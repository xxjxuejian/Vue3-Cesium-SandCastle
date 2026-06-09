# 项目约定

## 技术栈

当前项目使用 Vue 3、TypeScript、Vite、Cesium、Vue Router、Pinia、Element Plus 和 UnoCSS。源码主要位于 `src/`，Cesium 示例页面主要位于 `src/views/`。

## 页面组织

每个路由通常对应 `src/views/<分类>/<页面>.vue` 中的一个组件，例如：

- `src/views/GettingStarted/HelloWorld.vue`
- `src/views/ShowCases/Google2DTiles.vue`
- `src/views/Camera/CameraFly.vue`

目录名优先使用 PascalCase 或项目已有分类名，页面文件使用 PascalCase。

## Cesium 初始化

页面不直接创建 `Cesium.Viewer`，而是使用：

```vue
<CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
```

对应脚本结构：

```ts
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  timeline: false,
};

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  // 示例逻辑
};
```

`CesiumViewer` 内部通过 `useCesium` 初始化 Viewer，并在卸载时销毁 Viewer。

## 样式约定

地图页面通常使用全尺寸容器：

```vue
<template>
  <div class="wh-full overflow-hidden relative">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>
```

需要浮层控件时使用绝对定位。控件需要点击时不要设置 `pointer-events: none`；纯展示浮层可以设置鼠标穿透。

## 验证命令

提交前优先运行：

```bash
pnpm build
```

涉及代码风格时运行：

```bash
pnpm lint:eslint
pnpm lint:prettier
pnpm lint:stylelint
```
