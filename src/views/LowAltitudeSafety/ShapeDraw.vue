<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { Delete, Location, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

// 当前支持的绘制类型：多边形、矩形、圆形。
type ShapeType = "polygon" | "rectangle" | "circle";

// 统一的经纬度点结构，所有图形最终都会转换成这种边界点数组。
interface DrawPoint {
  lon: number;
  lat: number;
}

// 已绘制区域的数据结构，同时保存业务数据和 Cesium 实体，便于定位和删除。
interface DrawArea {
  id: string;
  name: string;
  type: ShapeType;
  positions: DrawPoint[];
  entities: Cesium.Entity[];
}

// 圆形采样点数量，数值越大圆越平滑，但生成的线段也越多。
const CIRCLE_SEGMENTS = 72;

// Cesium 初始化配置。
const vwConfig: Cesium.Viewer.ConstructorOptions = {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  infoBox: false,
};

// Cesium Viewer 实例。
const viewer = shallowRef<Cesium.Viewer | null>(null);
// 鼠标事件处理器，负责监听点击、移动和右键结束。
const handler = shallowRef<Cesium.ScreenSpaceEventHandler | null>(null);

// 当前选择的绘制类型，默认绘制多边形。
const activeShape = ref<ShapeType>("polygon");
// 是否处于绘制中状态。
const drawing = ref(false);
// 用户已经点击确认的绘制点。
const drawPoints = ref<DrawPoint[]>([]);
// 鼠标当前位置对应的临时点，用于实时预览。
const dynamicPoint = ref<DrawPoint | null>(null);
// 已完成绘制的区域列表。
const areaList = ref<DrawArea[]>([]);

// 绘制过程中的临时点实体，完成或取消后会统一清理。
const previewPointEntities: Cesium.Entity[] = [];
// 绘制过程中的动态预览线，只创建一次，位置由 CallbackProperty 实时计算。
const previewLineEntity = shallowRef<Cesium.Entity | null>(null);

// 绘制类型和中文展示文案的映射。
const shapeLabelMap: Record<ShapeType, string> = {
  polygon: "多边形",
  rectangle: "矩形",
  circle: "圆形",
};

// 根据绘制状态切换开始按钮文案。
const startButtonText = computed(() => {
  return drawing.value ? "绘制中" : "开始绘制";
});

/**
 * 获取绘制类型对应的中文名称。
 *
 * @param type 绘制类型。
 * @returns 中文展示名称。
 */
const getShapeLabel = (type: ShapeType) => shapeLabelMap[type];

/**
 * 把屏幕坐标转换为地球上的经纬度点。
 *
 * @param position 鼠标事件中的屏幕坐标。
 * @returns 经纬度点；当没有命中地球或场景时返回 null。
 */
const cartesianToLngLat = (position: Cesium.Cartesian2): DrawPoint | null => {
  if (!viewer.value) return null;

  const pickedPosition = viewer.value.scene.pickPositionSupported
    ? viewer.value.scene.pickPosition(position)
    : undefined;
  const cartesian = Cesium.defined(pickedPosition)
    ? pickedPosition
    : viewer.value.camera.pickEllipsoid(position, viewer.value.scene.globe.ellipsoid);

  if (!cartesian) return null;

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
  };
};

/**
 * 把经纬度点数组转换成 Cesium 可用的 Cartesian3 坐标数组。
 *
 * @param points 经纬度点数组。
 * @param height 转换时使用的高度，默认略微抬高，避免贴地闪烁。
 * @returns Cesium Cartesian3 坐标数组。
 */
const toCartesianPositions = (points: DrawPoint[], height = 1) => {
  if (points.length === 0) return [];

  const degrees: number[] = [];
  points.forEach((point) => {
    degrees.push(point.lon, point.lat, height);
  });
  return Cesium.Cartesian3.fromDegreesArrayHeights(degrees);
};

/**
 * 返回闭合后的边界点数组，也就是把第一个点追加到最后。
 *
 * @param points 原始边界点数组。
 * @returns 闭合后的边界点数组。
 */
const closePoints = (points: DrawPoint[]) => {
  if (points.length === 0) return [];
  return [...points, points[0]];
};

/**
 * 根据矩形的两个对角点生成四个边界点。
 *
 * @param start 矩形起点。
 * @param end 矩形对角点。
 * @returns 矩形四个边界点。
 */
const buildRectanglePoints = (start: DrawPoint, end: DrawPoint): DrawPoint[] => {
  return [start, { lon: end.lon, lat: start.lat }, end, { lon: start.lon, lat: end.lat }];
};

/**
 * 计算两个经纬度点之间的地表距离。
 *
 * @param start 起点。
 * @param end 终点。
 * @returns 两点之间的地表距离，单位是米。
 */
const getDistanceMeters = (start: DrawPoint, end: DrawPoint) => {
  const startCartographic = Cesium.Cartographic.fromDegrees(start.lon, start.lat);
  const endCartographic = Cesium.Cartographic.fromDegrees(end.lon, end.lat);
  const geodesic = new Cesium.EllipsoidGeodesic(startCartographic, endCartographic);
  return geodesic.surfaceDistance;
};

/**
 * 根据圆心和圆上一点生成圆周采样点，圆形最终也统一成边界点数组。
 *
 * @param center 圆心点。
 * @param edge 圆上一点，用于计算半径。
 * @returns 圆周采样边界点。
 */
const buildCirclePoints = (center: DrawPoint, edge: DrawPoint): DrawPoint[] => {
  const radius = getDistanceMeters(center, edge);
  if (radius <= 0) return [];

  const centerCartographic = Cesium.Cartographic.fromDegrees(center.lon, center.lat);
  const centerCartesian = Cesium.Cartesian3.fromRadians(
    centerCartographic.longitude,
    centerCartographic.latitude
  );
  const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
  const points: DrawPoint[] = [];

  for (let index = 0; index < CIRCLE_SEGMENTS; index += 1) {
    const angle = (Cesium.Math.TWO_PI * index) / CIRCLE_SEGMENTS;
    const offset = new Cesium.Cartesian3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    const cartesian = Cesium.Matrix4.multiplyByPoint(localFrame, offset, new Cesium.Cartesian3());
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

    points.push({
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
    });
  }

  return points;
};

/**
 * 创建正式区域实体：一个面实体和一条闭合边界线。
 *
 * @param points 区域边界点。
 * @param type 区域类型。
 * @param name 区域名称。
 */
const createArea = (points: DrawPoint[], type: ShapeType, name: string) => {
  if (!viewer.value || points.length < 3) return;

  const cartesianPositions = toCartesianPositions(points);
  const boundaryPositions = toCartesianPositions(closePoints(points), 0);
  const polygonEntity = viewer.value.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(cartesianPositions),
      material: Cesium.Color.BLUE.withAlpha(0.35),
    },
  });
  const boundaryEntity = viewer.value.entities.add({
    polyline: {
      positions: boundaryPositions,
      width: 1,
      clampToGround: true,
    },
  });

  areaList.value.push({
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    type,
    positions: points,
    entities: [polygonEntity, boundaryEntity],
  });
};

/**
 * 根据当前绘制类型和鼠标位置计算预览边界点。
 *
 * @returns 用于预览当前区域轮廓的边界点。
 */
const getPreviewPoints = () => {
  if (activeShape.value === "polygon") {
    if (drawPoints.value.length === 0) return [];
    return dynamicPoint.value ? [...drawPoints.value, dynamicPoint.value] : [...drawPoints.value];
  }

  if (drawPoints.value.length === 0 || !dynamicPoint.value) return [];

  if (activeShape.value === "rectangle") {
    return buildRectanglePoints(drawPoints.value[0], dynamicPoint.value);
  }

  return buildCirclePoints(drawPoints.value[0], dynamicPoint.value);
};

/**
 * 计算动态预览线需要展示的点。
 *
 * @returns 预览线点数组；能形成区域时会自动补上闭合点。
 */
const getPreviewLinePoints = () => {
  const previewPoints = getPreviewPoints();
  if (previewPoints.length < 2) return [];

  const shouldClose = activeShape.value !== "polygon" || previewPoints.length >= 3;
  return shouldClose ? closePoints(previewPoints) : previewPoints;
};

/**
 * 添加一个临时点击点，用于标识用户已经确认的绘制节点。
 *
 * @param point 用户确认的绘制节点。
 */
const addPreviewPoint = (point: DrawPoint) => {
  if (!viewer.value) return;

  const entity = viewer.value.entities.add({
    position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
    point: {
      pixelSize: 8,
      color: Cesium.Color.fromCssColorString("#00ccff"),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });

  previewPointEntities.push(entity);
};

/**
 * 创建动态预览线。
 *
 * 预览线的位置使用 CallbackProperty 动态计算，鼠标移动时只更新 dynamicPoint，
 * 不需要反复删除和重建实体。
 */
const showPreviewLine = () => {
  if (!viewer.value || previewLineEntity.value) return;

  previewLineEntity.value = viewer.value.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(() => {
        return toCartesianPositions(getPreviewLinePoints(), 0);
      }, false),
      width: 3,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString("#00ccff"),
        dashLength: 16,
      }),
      clampToGround: true,
    },
  });
};

/**
 * 清理绘制过程中的临时点和预览线。
 */
const clearPreview = () => {
  if (!viewer.value) return;

  previewPointEntities.forEach((entity) => viewer.value?.entities.remove(entity));
  previewPointEntities.length = 0;

  if (previewLineEntity.value) {
    viewer.value.entities.remove(previewLineEntity.value);
    previewLineEntity.value = null;
  }
};

/**
 * 重置绘制状态，并清理临时预览实体。
 */
const resetDrawing = () => {
  drawing.value = false;
  drawPoints.value = [];
  dynamicPoint.value = null;
  clearPreview();
};

/**
 * 结束当前绘制，并把有效区域转换为正式实体。
 *
 * @returns 创建成功时无返回值；非绘制状态或点位不足时返回 null。
 */
const finishDrawing = () => {
  if (!drawing.value) return null;

  const previewPoints = getPreviewPoints();
  const finalPoints = activeShape.value === "polygon" ? drawPoints.value : previewPoints;

  resetDrawing();

  if (finalPoints.length < 3) return null;

  const name = `区域${areaList.value.length + 1}`;
  createArea(finalPoints, activeShape.value, name);
};

/**
 * 处理地图左键点击：多边形持续加点，矩形和圆形第二次点击即完成。
 *
 * @param event Cesium 左键点击事件。
 */
const handleLeftClick = (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
  if (!viewer.value || !drawing.value) return;

  const point = cartesianToLngLat(event.position);
  if (!point) return;

  if (activeShape.value === "polygon") {
    drawPoints.value = [...drawPoints.value, point];
    dynamicPoint.value = point;
    addPreviewPoint(point);
    showPreviewLine();
    return;
  }

  if (drawPoints.value.length === 0) {
    drawPoints.value = [point];
    dynamicPoint.value = point;
    addPreviewPoint(point);
    showPreviewLine();
    return;
  }

  dynamicPoint.value = point;
  finishDrawing();
};

/**
 * 处理鼠标移动：更新动态点，预览线会通过 CallbackProperty 自动刷新。
 *
 * @param event Cesium 鼠标移动事件。
 */
const handleMouseMove = (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
  if (!drawing.value || drawPoints.value.length === 0 || !viewer.value) return;

  const point = cartesianToLngLat(event.endPosition);
  if (!point) return;

  dynamicPoint.value = point;
};

/**
 * 处理地图右键点击，右键表示结束当前绘制。
 */
const handleRightClick = () => {
  finishDrawing();
};

/**
 * 启动地图鼠标事件监听，只创建一次处理器，避免重复绑定。
 */
const enableScreenEventHandler = () => {
  if (!viewer.value || handler.value) return;

  handler.value = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas);
  handler.value.setInputAction(handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.value.setInputAction(handleMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.value.setInputAction(handleRightClick, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

/**
 * 地图加载完成后保存 viewer，并把相机飞到默认演示区域。
 *
 * @param viewerInstance CesiumViewer 组件创建出的 Viewer 实例。
 */
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer.value = viewerInstance;

  viewerInstance.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.3969921072894, 39.91848141642785, 500),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 1,
  });
};

/**
 * 开始绘制当前选中的图形类型。
 */
const handleStartDrawing = () => {
  if (!viewer.value || drawing.value) return;

  resetDrawing();
  drawing.value = true;
  enableScreenEventHandler();
};

/**
 * 主动结束当前绘制。
 */
const handleFinishDrawing = () => {
  finishDrawing();
};

/**
 * 删除指定区域，同时移除地图上的面和边界线实体。
 *
 * @param area 要删除的区域。
 */
const removeArea = (area: DrawArea) => {
  if (!viewer.value) return;

  area.entities.forEach((entity) => viewer.value?.entities.remove(entity));
  areaList.value = areaList.value.filter((item) => item.id !== area.id);
};

/**
 * 定位到指定区域。
 *
 * @param area 要定位的区域。
 */
const flyToArea = (area: DrawArea) => {
  if (!viewer.value) return;

  viewer.value.flyTo(area.entities);
};

/**
 * 页面卸载时清理绘制事件、临时实体和已经绘制的区域实体。
 */
onBeforeUnmount(() => {
  resetDrawing();
  handler.value?.destroy();
  handler.value = null;

  areaList.value.forEach((area) => {
    area.entities.forEach((entity) => viewer.value?.entities.remove(entity));
  });
  areaList.value = [];
});
</script>

<template>
  <div class="relative wh-full overflow-hidden">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded" />

    <el-card class="absolute left-4 top-4 z-10 w-90" shadow="always">
      <template #header>
        <span>区域绘制</span>
      </template>

      <el-radio-group v-model="activeShape" :disabled="drawing">
        <el-radio-button value="polygon">多边形</el-radio-button>
        <el-radio-button value="rectangle">矩形</el-radio-button>
        <el-radio-button value="circle">圆形</el-radio-button>
      </el-radio-group>

      <div class="my-3 flex gap-3">
        <el-button type="primary" :icon="VideoPlay" :loading="drawing" @click="handleStartDrawing">
          {{ startButtonText }}
        </el-button>
        <el-button :icon="VideoPause" @click="handleFinishDrawing">结束绘制</el-button>
      </div>

      <el-table :data="areaList" empty-text="暂无区域" border>
        <el-table-column prop="name" label="名称" min-width="90" show-overflow-tooltip />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            {{ getShapeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Location" @click="flyToArea(row)" />
            <el-button link type="danger" :icon="Delete" @click="removeArea(row)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
