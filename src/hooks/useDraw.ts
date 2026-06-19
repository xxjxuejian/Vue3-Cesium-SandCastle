import { ref, shallowRef, type Ref, type ShallowRef } from "vue";
import * as Cesium from "cesium";

// 当前支持的绘制类型：多边形、矩形、圆形。
export type ShapeType = "polygon" | "rectangle" | "circle";

// 统一的经纬度点结构，所有图形最终都会转换成这种边界点数组。
export interface DrawPoint {
  lon: number;
  lat: number;
}

// 绘制完成后对外返回的结果，调用方可以据此创建区域、电子围栏或保存数据。
export interface DrawCompleteResult {
  type: ShapeType;
  positions: DrawPoint[];
}

// useDraw 的可选配置。
export interface UseDrawOptions {
  onComplete?: (result: DrawCompleteResult) => void;
}

// 圆形采样点数量，数值越大圆越平滑，但生成的线段也越多。
const CIRCLE_SEGMENTS = 72;

// 绘制类型和中文展示文案的映射。
const shapeLabelMap: Record<ShapeType, string> = {
  polygon: "多边形",
  rectangle: "矩形",
  circle: "圆形",
};

// 获取绘制类型对应的中文名称，供表格展示使用。
export const getShapeLabel = (type: ShapeType) => shapeLabelMap[type];

// 把屏幕坐标转换为地球上的经纬度点。
const getScenePoint = (viewer: Cesium.Viewer, position: Cesium.Cartesian2): DrawPoint | null => {
  const pickedPosition = viewer.scene.pickPositionSupported
    ? viewer.scene.pickPosition(position)
    : undefined;
  const cartesian = Cesium.defined(pickedPosition)
    ? pickedPosition
    : viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);

  if (!cartesian) return null;

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
  };
};

// 把经纬度点数组转换成 Cesium 可用的 Cartesian3 坐标数组。
export const toCartesianPositions = (points: DrawPoint[]) => {
  if (points.length === 0) return [];

  const degrees: number[] = [];
  points.forEach((point) => {
    degrees.push(point.lon, point.lat, 0);
  });
  return Cesium.Cartesian3.fromDegreesArrayHeights(degrees);
};

// 返回闭合后的边界点数组，也就是把第一个点追加到最后。
export const closePoints = (points: DrawPoint[]) => {
  if (points.length === 0) return [];
  return [...points, points[0]];
};

// 根据矩形的两个对角点生成四个角点。
const buildRectanglePoints = (start: DrawPoint, end: DrawPoint): DrawPoint[] => {
  return [start, { lon: end.lon, lat: start.lat }, end, { lon: start.lon, lat: end.lat }];
};

// 计算两个经纬度点之间的地表距离，单位是米。
const getDistanceMeters = (start: DrawPoint, end: DrawPoint) => {
  const startCartographic = Cesium.Cartographic.fromDegrees(start.lon, start.lat);
  const endCartographic = Cesium.Cartographic.fromDegrees(end.lon, end.lat);
  const geodesic = new Cesium.EllipsoidGeodesic(startCartographic, endCartographic);
  return geodesic.surfaceDistance;
};

// 根据圆心和圆上一点生成圆周采样点，最终圆形也会变成一组边界点。
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

// 封装 Cesium 区域绘制核心，只负责交互、临时预览和输出边界点。
export function useDraw(
  viewerRef: Ref<Cesium.Viewer | null> | ShallowRef<Cesium.Viewer | null>,
  options: UseDrawOptions = {}
) {
  // 鼠标事件处理器，负责监听点击、移动和右键结束。
  const handler = shallowRef<Cesium.ScreenSpaceEventHandler | null>(null);
  // 当前选择的绘制类型，默认绘制多边形。
  const activeShape = ref<ShapeType>("polygon");
  // 是否处于绘制中状态。
  const drawing = ref(false);
  // 用户已经点击确认的绘制点。
  const drawPoints = ref<DrawPoint[]>([]);
  // 鼠标当前位置对应的临时点，用于实时预览。
  const cursorPoint = ref<DrawPoint | null>(null);
  // 绘制过程中的临时点实体，完成或取消后会统一清理。
  const previewPointEntities: Cesium.Entity[] = [];
  // 绘制过程中的动态预览线，只创建一次，位置由 CallbackProperty 实时计算。
  const previewLineEntity = shallowRef<Cesium.Entity | null>(null);

  // 根据当前绘制类型和鼠标位置计算预览边界点。
  const getPreviewPoints = () => {
    if (activeShape.value === "polygon") {
      if (drawPoints.value.length === 0) return [];
      return cursorPoint.value ? [...drawPoints.value, cursorPoint.value] : [...drawPoints.value];
    }

    if (drawPoints.value.length === 0 || !cursorPoint.value) return [];

    if (activeShape.value === "rectangle") {
      return buildRectanglePoints(drawPoints.value[0], cursorPoint.value);
    }

    return buildCirclePoints(drawPoints.value[0], cursorPoint.value);
  };

  // 计算动态预览线需要展示的点。CallbackProperty 会反复读取这个结果。
  const getPreviewLinePoints = () => {
    const previewPoints = getPreviewPoints();
    if (previewPoints.length < 2) return [];

    const shouldClose = activeShape.value !== "polygon" || previewPoints.length >= 3;
    return shouldClose ? closePoints(previewPoints) : previewPoints;
  };

  // 添加一个临时点击点，用于标识用户已经确认的绘制节点。
  const addPreviewPoint = (point: DrawPoint) => {
    const viewer = viewerRef.value;
    if (!viewer) return;

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, 1),
      point: {
        pixelSize: 8,
      },
    });

    previewPointEntities.push(entity);
  };

  // 创建动态预览线。线的位置使用 CallbackProperty，鼠标移动时无需删除重建实体。
  const ensurePreviewLine = () => {
    const viewer = viewerRef.value;
    if (!viewer || previewLineEntity.value) return;

    previewLineEntity.value = viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return toCartesianPositions(getPreviewLinePoints());
        }, false),
        width: 2,
      },
    });
  };

  // 清除绘制过程中的临时点和动态预览线。
  const clearPreview = () => {
    const viewer = viewerRef.value;
    if (!viewer) return;

    previewPointEntities.forEach((entity) => viewer.entities.remove(entity));
    previewPointEntities.length = 0;

    if (previewLineEntity.value) {
      viewer.entities.remove(previewLineEntity.value);
      previewLineEntity.value = null;
    }
  };

  // 重置绘制状态，并清理临时预览实体。
  const resetDrawing = () => {
    drawing.value = false;
    drawPoints.value = [];
    cursorPoint.value = null;
    clearPreview();
  };

  // 结束当前绘制，把不同图形统一转换成边界点数组后返回给调用方。
  const finishDrawing = (): DrawCompleteResult | null => {
    if (!drawing.value) return null;

    const previewPoints = getPreviewPoints();
    const finalPoints = activeShape.value === "polygon" ? drawPoints.value : previewPoints;

    resetDrawing();

    if (finalPoints.length < 3) return null;

    const result = {
      type: activeShape.value,
      positions: finalPoints,
    };
    options.onComplete?.(result);
    return result;
  };

  // 处理鼠标左键点击：多边形持续加点，矩形和圆形第二次点击即完成。
  const handleLeftClick = (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const viewer = viewerRef.value;
    if (!drawing.value || !viewer) return;

    const point = getScenePoint(viewer, event.position);
    if (!point) return;

    if (activeShape.value === "polygon") {
      drawPoints.value = [...drawPoints.value, point];
      cursorPoint.value = point;
      addPreviewPoint(point);
      ensurePreviewLine();
      return;
    }

    if (drawPoints.value.length === 0) {
      drawPoints.value = [point];
      cursorPoint.value = point;
      addPreviewPoint(point);
      ensurePreviewLine();
      return;
    }

    cursorPoint.value = point;
    finishDrawing();
  };

  // 处理鼠标移动：只更新临时点，动态预览线会通过 CallbackProperty 自动刷新。
  const handleMouseMove = (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const viewer = viewerRef.value;
    if (!drawing.value || drawPoints.value.length === 0 || !viewer) return;

    const point = getScenePoint(viewer, event.endPosition);
    if (!point) return;

    cursorPoint.value = point;
  };

  // 初始化 Cesium 鼠标事件，只创建一次，避免重复绑定。
  const ensureHandler = () => {
    const viewer = viewerRef.value;
    if (!viewer || handler.value) return;

    handler.value = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.value.setInputAction(handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.value.setInputAction(handleMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.value.setInputAction(() => {
      finishDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  // 开始绘制：清理旧的临时状态并确保鼠标事件已绑定。
  const startDrawing = (type: ShapeType = activeShape.value) => {
    const viewer = viewerRef.value;
    if (!viewer || drawing.value) return;

    resetDrawing();
    activeShape.value = type;
    drawing.value = true;
    ensureHandler();
  };

  // 取消当前绘制，不返回边界点。
  const cancelDrawing = () => {
    resetDrawing();
  };

  // 销毁绘制能力，页面卸载时调用，避免残留鼠标事件和临时实体。
  const destroyDrawing = () => {
    resetDrawing();
    handler.value?.destroy();
    handler.value = null;
  };

  return {
    drawing,
    activeShape,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    destroyDrawing,
    getShapeLabel,
  };
}
