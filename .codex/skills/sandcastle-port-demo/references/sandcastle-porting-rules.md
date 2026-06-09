# Sandcastle 迁移规则

## 源码分析

迁移前先识别这些内容：

- `viewer` 初始化参数。
- `scene`、`camera`、`entities`、`dataSources`、`imageryLayers`、`terrainProvider`、`primitives` 的操作。
- `Sandcastle.addToolbarButton`、`Sandcastle.addToolbarMenu`、`Sandcastle.addToggleButton` 等 UI。
- 示例依赖的 `SampleData`、图片、模型、CZML、GeoJSON、3D Tiles 或 Ion asset。
- 是否依赖时间轴、动画控件、地形深度测试、clock 或 trackedEntity。

## Viewer 参数迁移

Sandcastle 常常直接写：

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
```

迁移后改为：

```ts
const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  // 按当前 Cesium 版本和类型定义迁移配置
};
```

如果 Sandcastle 的初始化参数不兼容当前 Cesium 版本，优先查当前项目已使用写法，再参考 Cesium 官方当前 API。

## UI 迁移

Sandcastle 工具栏应改成 Vue 模板和方法。示例：

```js
Sandcastle.addToolbarButton("Fly", function () {
  viewer.camera.flyTo(...);
});
```

迁移为：

```vue
<button type="button" @click="flyToTarget">Fly</button>
```

```ts
let viewer: Cesium.Viewer | null;

const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
};

const flyToTarget = () => {
  viewer?.camera.flyTo(...);
};
```

如 UI 状态会影响 Cesium 对象，优先使用 `ref`、`computed` 和明确的方法，不要用直接 DOM 操作。
对于`scene`、`camera`、`entities`等cesium对象,应该避免使用`ref`,使用`let`或者
`shallowRef`。
## 生命周期清理

`CesiumViewer` 会销毁 Viewer，但页面中自己创建的这些对象仍应考虑清理：

- `ScreenSpaceEventHandler`
- `viewer.clock.onTick` 监听
- `setInterval`、`setTimeout`
- 自定义 primitive、dataSource 或 postProcessStage
- DOM 事件监听

使用 `onUnmounted` 清理组件级资源。

## 资源路径

Sandcastle 中常见资源路径：

```js
"../SampleData/models/CesiumAir/Cesium_Air.glb"
```

在当前项目中通常改成：

```ts
"/SampleData/models/CesiumAir/Cesium_Air.glb"
```

资源必须存在于 `public/SampleData/`。不存在时不要臆造路径，先查找项目文件。

## 注释与文案

除代码、命令、API、库名和专业术语外，说明、注释、Markdown 文档使用中文。保留必要的英文示例名称。
