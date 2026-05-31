# Cesium 区域绘制

这篇文档总结 `ShapeDraw.vue` 中区域绘制的实现思路。目标是做一个容易复用的绘制工具：用户可以选择多边形、矩形、圆形，在地图上通过鼠标交互绘制区域；绘制过程中用闭合边界线预览，完成后再创建正式的区域面和边界线。

## 实现目标

区域绘制可以拆成几个小目标：

- 记录当前绘制类型，例如多边形、矩形、圆形。
- 把用户点击的屏幕坐标转换成经纬度点。
- 用一组统一的边界点描述所有图形。
- 绘制过程中只用 `polyline` 做边界预览。
- 鼠标移动时动态更新预览线。
- 绘制结束后创建正式的 `polygon` 面和边界线。
- 页面卸载、重新绘制、结束绘制时清理临时实体。

核心思想是：**不管用户画的是多边形、矩形还是圆形，最终都转换成一组边界点**。预览阶段只负责把这组点连成闭合线。

## 基础状态

先定义支持的图形类型和统一的点结构：

```ts
type ShapeType = "polygon" | "rectangle" | "circle";

interface DrawPoint {
  lon: number;
  lat: number;
}
```

组件里维护几类状态：

```ts
const activeShape = ref<ShapeType>("polygon");
const drawing = ref(false);
const drawPoints = ref<DrawPoint[]>([]);
const dynamicPoint = ref<DrawPoint | null>(null);

const handler = shallowRef<Cesium.ScreenSpaceEventHandler | null>(null);
const previewPointEntities: Cesium.Entity[] = [];
const previewLineEntity = shallowRef<Cesium.Entity | null>(null);
```

这些状态分别表示：

- `activeShape`：当前选择的绘制类型。
- `drawing`：是否正在绘制。
- `drawPoints`：用户已经点击确认的点。
- `dynamicPoint`：鼠标当前位置对应的临时点。
- `previewPointEntities`：绘制过程中的临时节点实体。
- `previewLineEntity`：绘制过程中的动态预览线实体。

## 屏幕坐标转经纬度

鼠标事件给到的是屏幕坐标，需要转换成地图上的经纬度点。开启地形或模型时，优先使用 `scene.pickPosition`；如果拿不到结果，就用 `camera.pickEllipsoid` 兜底。

```ts
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
```

这个函数是绘制交互的入口。左键点击和鼠标移动都通过它拿到当前地表点。

## 经纬度点转 Cesium 坐标

Cesium 的实体最终需要 `Cartesian3` 坐标。这里把经纬度数组转换成带高度的坐标数组：

```ts
const toCartesianPositions = (points: DrawPoint[], height = 1) => {
  if (points.length === 0) return [];

  const degrees: number[] = [];
  points.forEach((point) => {
    degrees.push(point.lon, point.lat, height);
  });

  return Cesium.Cartesian3.fromDegreesArrayHeights(degrees);
};
```

预览线贴地时可以传 `height = 0`，普通实体可以使用默认高度。

## 闭合边界线

区域的边界线需要闭合，也就是把第一个点追加到数组末尾：

```ts
const closePoints = (points: DrawPoint[]) => {
  if (points.length === 0) return [];
  return [...points, points[0]];
};
```

例如三个点 `[A, B, C]` 会变成 `[A, B, C, A]`，这样 `polyline` 就能画出闭合轮廓。

## 三种图形统一成边界点

多边形、矩形、圆形的交互方式不同，但最终都可以转换成 `DrawPoint[]`。

### 多边形

多边形最直接：用户每点一次就追加一个点。鼠标移动时，把临时点追加到末尾用于预览。

```ts
if (activeShape.value === "polygon") {
  if (drawPoints.value.length === 0) return [];
  return dynamicPoint.value ? [...drawPoints.value, dynamicPoint.value] : [...drawPoints.value];
}
```

### 矩形

矩形只需要两个点：起点和对角点。根据这两个点可以计算出四个角：

```ts
const buildRectanglePoints = (start: DrawPoint, end: DrawPoint): DrawPoint[] => {
  return [start, { lon: end.lon, lat: start.lat }, end, { lon: start.lon, lat: end.lat }];
};
```

交互上第一次点击确定起点，鼠标移动时用当前位置作为对角点实时生成矩形。

### 圆形

圆形也只需要两个点：圆心和圆上一点。先用两个点计算地表距离作为半径，再按角度采样圆周点。

```ts
const getDistanceMeters = (start: DrawPoint, end: DrawPoint) => {
  const startCartographic = Cesium.Cartographic.fromDegrees(start.lon, start.lat);
  const endCartographic = Cesium.Cartographic.fromDegrees(end.lon, end.lat);
  const geodesic = new Cesium.EllipsoidGeodesic(startCartographic, endCartographic);
  return geodesic.surfaceDistance;
};
```

圆周采样：

```ts
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
```

`CIRCLE_SEGMENTS` 控制圆的平滑程度。值越大越平滑，线段也越多。

## 计算预览边界点

统一入口是 `getPreviewPoints`。它根据当前图形类型返回边界点：

```ts
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
```

再根据点数判断是否闭合：

```ts
const getPreviewLinePoints = () => {
  const previewPoints = getPreviewPoints();
  if (previewPoints.length < 2) return [];

  const shouldClose = activeShape.value !== "polygon" || previewPoints.length >= 3;
  return shouldClose ? closePoints(previewPoints) : previewPoints;
};
```

这里的规则是：

- 多边形少于 3 个点时不闭合，只显示折线。
- 多边形达到 3 个点后闭合。
- 矩形和圆形天然是区域，直接闭合。

## 用 CallbackProperty 做动态预览线

预览线只创建一次，后续鼠标移动时只更新 `dynamicPoint`。`CallbackProperty` 会在 Cesium 渲染时重新读取最新点位，不需要反复删除和创建线实体。

```ts
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
```

这里有两个关键点：

- `positions` 使用 `CallbackProperty`，实现动态预览。
- `clampToGround: true`，开启地形时让线贴地显示。

## 开启地形时的显示问题

如果使用了 World Terrain：

```ts
terrain: Cesium.Terrain.fromWorldTerrain(),
```

普通 `height: 1` 的点和线可能会被真实地形遮挡。预览实体需要贴地处理。

预览点可以这样写：

```ts
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
```

预览线和正式边界线可以这样写：

```ts
polyline: {
  positions: toCartesianPositions(closePoints(points), 0),
  width: 1,
  clampToGround: true,
}
```

如果没有这一步，删除地形后能看到预览，开启地形后却看不到，通常就是被地形遮住了。

## 鼠标事件流程

绘制功能主要依赖三个事件：

- 左键点击：添加点或完成矩形、圆形。
- 鼠标移动：更新动态点，刷新预览。
- 右键点击：完成当前绘制。

初始化事件处理器：

```ts
const enableScreenEventHandler = () => {
  if (!viewer.value || handler.value) return;

  handler.value = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas);
  handler.value.setInputAction(handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.value.setInputAction(handleMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.value.setInputAction(handleRightClick, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};
```

开始绘制时，先清理旧状态，再进入绘制状态：

```ts
const handleStartDrawing = () => {
  if (!viewer.value || drawing.value) return;

  resetDrawing();
  drawing.value = true;
  enableScreenEventHandler();
};
```

注意不要把 `drawing.value = true` 放在 `resetDrawing()` 前面，否则会刚进入绘制中又立刻被重置成 `false`。

## 左键点击逻辑

左键点击时先把屏幕坐标转成经纬度：

```ts
const point = cartesianToLngLat(event.position);
if (!point) return;
```

多边形每次点击都追加点：

```ts
if (activeShape.value === "polygon") {
  drawPoints.value = [...drawPoints.value, point];
  dynamicPoint.value = point;
  addPreviewPoint(point);
  showPreviewLine();
  return;
}
```

矩形和圆形第一次点击记录起点，第二次点击完成绘制：

```ts
if (drawPoints.value.length === 0) {
  drawPoints.value = [point];
  dynamicPoint.value = point;
  addPreviewPoint(point);
  showPreviewLine();
  return;
}

dynamicPoint.value = point;
finishDrawing();
```

## 鼠标移动逻辑

鼠标移动只做一件事：更新临时点。

```ts
const handleMouseMove = (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
  if (!drawing.value || drawPoints.value.length === 0 || !viewer.value) return;

  const point = cartesianToLngLat(event.endPosition);
  if (!point) return;

  dynamicPoint.value = point;
};
```

预览线会通过 `CallbackProperty` 自动读取最新的 `dynamicPoint`。

## 完成绘制

完成绘制时，先得到最终边界点：

```ts
const previewPoints = getPreviewPoints();
const finalPoints = activeShape.value === "polygon" ? drawPoints.value : previewPoints;
```

多边形的最终点只用用户确认过的点，不使用鼠标临时点。矩形和圆形则使用当前预览点，因为它们的最终形状由起点和临时终点计算出来。

完整结束逻辑：

```ts
const finishDrawing = () => {
  if (!drawing.value) return null;

  const previewPoints = getPreviewPoints();
  const finalPoints = activeShape.value === "polygon" ? drawPoints.value : previewPoints;

  resetDrawing();

  if (finalPoints.length < 3) return null;

  const name = `区域${areaList.value.length + 1}`;
  createArea(finalPoints, activeShape.value, name);
};
```

## 创建正式区域

正式区域由两部分组成：

- `polygon`：负责面填充。
- `polyline`：负责边界线。

```ts
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
```

这里不建议依赖 `polygon.outline` 做边界线。开启地形时，Cesium 会提示贴地几何体不支持 outline。更清晰的方式是：**面负责填充，线负责边界**。

## 清理临时实体

绘制过程中创建的点和线都要在结束、取消、重新开始、页面卸载时清理：

```ts
const clearPreview = () => {
  if (!viewer.value) return;

  previewPointEntities.forEach((entity) => viewer.value?.entities.remove(entity));
  previewPointEntities.length = 0;

  if (previewLineEntity.value) {
    viewer.value.entities.remove(previewLineEntity.value);
    previewLineEntity.value = null;
  }
};

const resetDrawing = () => {
  drawing.value = false;
  drawPoints.value = [];
  dynamicPoint.value = null;
  clearPreview();
};
```

页面卸载时还要销毁鼠标事件处理器：

```ts
onBeforeUnmount(() => {
  resetDrawing();
  handler.value?.destroy();
  handler.value = null;

  areaList.value.forEach((area) => {
    area.entities.forEach((entity) => viewer.value?.entities.remove(entity));
  });
  areaList.value = [];
});
```

## 交互流程总览

多边形：

1. 点击“开始绘制”。
2. 左键点击地图添加第一个点。
3. 移动鼠标显示从已确认点到鼠标位置的动态边界。
4. 继续左键添加点。
5. 点数达到 3 个后，预览线自动闭合。
6. 右键或点击“结束绘制”完成区域。

矩形：

1. 点击“开始绘制”。
2. 左键点击地图确定一个角点。
3. 移动鼠标，使用当前位置作为对角点实时生成矩形边界。
4. 再次左键点击完成区域。

圆形：

1. 点击“开始绘制”。
2. 左键点击地图确定圆心。
3. 移动鼠标，使用当前位置计算半径并实时生成圆周边界。
4. 再次左键点击完成区域。

## 常见问题

### 点击开始后按钮文字不变化

通常是执行顺序问题。不要先设置 `drawing.value = true`，再调用会把它重置为 `false` 的函数。

正确顺序：

```ts
resetDrawing();
drawing.value = true;
```

### 开启地形后预览不显示

预览点和线可能被地形遮挡。点使用：

```ts
heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
```

线使用：

```ts
clampToGround: true
```

### 预览线没有动态刷新

确认 `positions` 使用的是 `Cesium.CallbackProperty`，并且鼠标移动时只更新 `dynamicPoint`。

### 点击地图没有反应

检查事件处理器是否真的绑定：

```ts
handler.value.setInputAction(handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

也要避免把函数调用写在注释同一行，例如：

```ts
// 启动事件监听 enableScreenEventHandler();
```

这种写法会导致 `enableScreenEventHandler()` 被注释掉。

## 小结

这套实现的关键不是分别为每种图形写一套实体逻辑，而是把它们都抽象成同一种数据结构：

```ts
DrawPoint[]
```

多边形直接使用用户点击点，矩形由两个对角点生成四个角点，圆形由圆心和半径采样出圆周点。预览阶段统一用闭合 `polyline`，完成阶段再创建正式 `polygon` 和边界线。这样逻辑清晰，也方便后续扩展更多图形，例如椭圆、扇形、航线缓冲区等。
