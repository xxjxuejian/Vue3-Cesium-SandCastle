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

const menuConfig: MenuItem[] = [
  {
    path: "show-cases", // 建议：小写+短横线
    name: "ShowCases",
    meta: {
      title: "基础案例",
      icon: "Location",
    },
    // component: "ParentView", // /show-cases下面的容器组件，children路由渲染位置
    redirect: "/show-cases/3d-tiles-gaussian-splatting", // 默认打开第一个子菜单
    children: [
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
        meta: { title: "网格比较" },
        component: "ShowCases/3DTilesGaussianSplattingMeshComparison.vue",
      },
    ],
  },
  {
    path: "2d-view", // 修正：去掉了空格
    name: "2DView",
    meta: { title: "2D 视图", icon: "Monitor" },
    // component: "ParentView",
    redirect: "/2d-view/multiple-synced-views",
    children: [
      {
        path: "multiple-synced-views",
        name: "MultipleSyncedViews",
        meta: { title: "多个同步视图" },
        component: "2DViews/MultipleSyncedViews.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
];

export default menuConfig;
