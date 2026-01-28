// src/config/menu.ts

export interface MenuMeta extends Record<PropertyKey, unknown> {
  title: string;
  icon?: string;
}

export interface MenuItem {
  name: string; // 唯一标识
  path: string; // 路由路径片段 (不带 /)
  meta?: MenuMeta;
  component?: string; // 具体的 vue 文件路径 (相对 src/views)
  children?: MenuItem[]; // 子菜单
  redirect?: string;
}
//todo: 约定：如果含有子级路由，但是没有设置component，在路由注册时，会自动注册ParentView作为容器
// todo: Vue Router 在内部是用 name 做唯一索引 的，必须全局唯一
const menuConfig: MenuItem[] = [
  // getting started : 快速开始
  {
    path: "getting-started", // 建议：小写+短横线
    name: "GettingStarted",
    meta: {
      title: "快速开始",
      icon: "el-icon-Collection",
    },
    // component: "ParentView",
    redirect: "/getting-started/offline",
    children: [
      {
        path: "hello-world",
        name: "gs-HelloWorld",
        meta: { title: "Hello World案例" },
        component: "GettingStarted/HelloWorld.vue",
      },
      {
        path: "html-overlays",
        name: "HtmlOverlays",
        meta: { title: "HTML 覆盖层" },
        // component: "GettingStarted/HtmlOverlays.vue",
        children: [
          {
            path: "native-demo",
            name: "NativeDemo",
            meta: { title: "HTML 覆盖层 官网demo" },
            component: "GettingStarted/HtmlOverlays/NativeDemo.vue",
          },
          {
            path: "optimization-demo",
            name: "OptimizationDemo",
            meta: { title: "HTML 覆盖层 优化官网demo" },
            component: "GettingStarted/HtmlOverlays/OptimizationDemo.vue",
          },
          {
            path: "billboard-overlay",
            name: "BillboardOverlay",
            meta: { title: "billboard 实现覆盖层" },
            component: "GettingStarted/HtmlOverlays/BillboardOverlay.vue",
          },
        ],
      },
      {
        path: "offline",
        name: "Offline",
        meta: { title: "离线案例" },
        component: "GettingStarted/Offline.vue",
      },
      {
        path: "resolution-scale",
        name: "ResolutionScale",
        meta: { title: "缩放分辨率" },
        component: "GettingStarted/ResolutionScale.vue",
      },
    ],
  },
  {
    path: "show-cases", // 建议：小写+短横线
    name: "ShowCases",
    meta: {
      title: "案例展示",
      icon: "el-icon-Collection",
    },
    // component: "ParentView", // /show-cases下面的容器组件，children路由渲染位置
    redirect: "/show-cases/3d-tiles-gaussian-splatting", // 默认打开第一个子菜单
    children: [
      {
        path: "hello-world",
        name: "HelloWorld",
        meta: { title: "Hello World案例" },
        // 注意：确保你的文件真实路径是 src/views/ShowCases/3DTilesGaussianSplatting.vue
        component: "ShowCases/HelloWorld.vue",
      },
      {
        path: "3d-tiles-gaussian-splatting",
        name: "3DTilesGaussianSplatting",
        meta: { title: "3D瓦片高斯贴图" },
        // 注意：确保你的文件真实路径是 src/views/ShowCases/3DTilesGaussianSplatting.vue
        component: "ShowCases/3DTilesGaussianSplatting.vue",
      },
      {
        path: "mesh-comparison",
        name: "MeshComparison",
        meta: { title: "3D瓦片高斯贴图-网格比较" },
        component: "ShowCases/3DTilesGaussianSplattingMeshComparison.vue",
      },
    ],
  },
  {
    path: "2d-view", // 修正：去掉了空格
    name: "2DView",
    meta: { title: "2D 视图", icon: "el-icon-MapLocation" },
    // component: "ParentView",
    redirect: "/2d-view/multiple-synced-views",
    children: [
      {
        path: "multiple-synced-views",
        name: "MultipleSyncedViews",
        meta: { title: "多个同步视图" },
        component: "2DViews/MultipleSyncedViews.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
      {
        path: "rotatable-2d-map",
        name: "Rotatable2DMap",
        meta: { title: "可旋转的二维地图" },
        component: "2DViews/Rotatable2DMap.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
  // 动画
  {
    path: "animation", // 修正：去掉了空格
    name: "Animation",
    meta: { title: "动画", icon: "el-icon-VideoPlay" },
    // component: "ParentView",
    redirect: "/animation/clock",
    children: [
      {
        path: "clock",
        name: "Clock",
        meta: { title: "时钟" },
        component: "Animation/Clock.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
  // 3D 模型
  {
    path: "3d-models", // 修正：去掉了空格
    name: "3DModels",
    meta: { title: "3D 模型", icon: "el-icon-Box" },
    // component: "ParentView",
    redirect: "/3d-models/gltf-models",
    children: [
      {
        path: "gltf-models",
        name: "GltfModels",
        meta: { title: "gltf 模型" },
        component: "3DModels/GltfModels.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
];

export default menuConfig;
