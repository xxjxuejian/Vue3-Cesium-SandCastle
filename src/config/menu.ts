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
  document?: string; // Markdown document path relative to src/documents
  children?: MenuItem[]; // 子菜单
  redirect?: string;
}
//todo: 约定：如果含有子级路由，但是没有设置component，在路由注册时，会自动注册ParentView作为容器
// todo: Vue Router 在内部是用 name 做唯一索引 的，必须全局唯一
const menuConfig: MenuItem[] = [
  // 文档
  {
    path: "documents",
    name: "documents",
    meta: {
      title: "documents", // 文档
      icon: "el-icon-Document",
    },
    redirect: "/documents/introduction",
    children: [
      {
        path: "introduction",
        name: "documents_introduction",
        meta: { title: "documents_introduction" }, //
        document: "README.md",
      },
      {
        path: "user-management-frontend-design",
        name: "documents_user-management-frontend-design",
        meta: { title: "documents_user-management-frontend-design" },
        document: "用户管理前端结构设计.md",
      },
    ],
  },
  // 低空安全
  {
    path: "low-altitude-safety",
    name: "low-altitude-safety",
    meta: { title: "low-altitude-safety", icon: "el-icon-Promotion" },
    redirect: "/low-altitude-safety/basic-electronic-fence",
    children: [
      {
        path: "basic-electronic-fence",
        name: "basic-electronic-fence",
        meta: { title: "basic-electronic-fence" }, // 3D Tiles 样式
        component: "LowAltitudeSafety/BasicElectronicFence.vue",
      },
      {
        path: "shape-draw",
        name: "shape-draw",
        meta: { title: "shape-draw" }, // 形状绘制
        component: "LowAltitudeSafety/ShapeDraw.vue",
      },
      {
        path: "detection-simulation",
        name: "detection-simulation",
        meta: { title: "detection-simulation" },
        component: "LowAltitudeSafety/DetectionSimulation.vue",
      },
      {
        path: "flight-monitoring",
        name: "flight-monitoring",
        meta: { title: "flight-monitoring" },
        component: "LowAltitudeSafety/FlightMonitoring/index.vue",
      },
    ],
  },
  // getting started : 快速开始
  {
    path: "getting-started", // 建议：小写+短横线
    name: "getting-started",
    meta: {
      title: "getting-started", // 快速开始
      icon: "el-icon-Collection",
    },
    // component: "ParentView",
    redirect: "/getting-started/hello-world",
    children: [
      {
        path: "hello-world",
        name: "gs_helloWorld",
        meta: { title: "getting-started_hello-world" }, // Hello World 案例
        component: "GettingStarted/HelloWorld.vue",
      },
      {
        path: "html-overlays",
        name: "gs_html-overlays",
        meta: { title: "getting-started_html-overlays" }, // HTML 覆盖层
        // component: "GettingStarted/HtmlOverlays.vue",
        children: [
          {
            path: "official-demo",
            name: "overlays_official-demo",
            meta: { title: "getting-started_html-overlays_official-demo" }, // HTML 覆盖层 官网 Demo
            component: "GettingStarted/HtmlOverlays/OfficialDemo.vue",
          },
          {
            path: "optimization-demo",
            name: "overlays_optimization-demo",
            meta: { title: "getting-started_html-overlays_optimization-demo" }, // HTML 覆盖层 优化官网 Demo
            component: "GettingStarted/HtmlOverlays/OptimizationDemo.vue",
          },
          {
            path: "billboard-overlay",
            name: "overlays_billboard-overlay",
            meta: { title: "getting-started_html-overlays_billboard-demo" }, // billboard 实现覆盖层
            component: "GettingStarted/HtmlOverlays/BillboardOverlay.vue",
          },
        ],
      },
      {
        path: "offline",
        name: "gs_offline",
        meta: { title: "getting-started_offline" }, // 离线案例
        component: "GettingStarted/Offline.vue",
      },
      {
        path: "resolution-scale",
        name: "gs_resolution-scale",
        meta: { title: "getting-started_resolution-scale" }, // 缩放分辨率
        component: "GettingStarted/ResolutionScale.vue",
      },
      {
        path: "cesium-widget",
        name: "gs_cesium-widget",
        meta: { title: "getting-started_cesium-widget" }, // 缩放分辨率
        component: "GettingStarted/CesiumWidget.vue",
      },
    ],
  },
  //性能优化
  {
    path: "Performance", // 建议：小写+短横线
    name: "performance",
    meta: {
      title: "performance", // 快速开始
      icon: "el-icon-Odometer",
    },
    redirect: "/performance/massive-point-rendering",
    children: [
      {
        path: "massive-point-rendering", // 建议：小写+短横线
        name: "massive-point-rendering",
        meta: {
          title: "massive-point-rendering", // 快速开始
        },
        component: "Performance/MassivePointRendering.vue",
      },
    ],
  },
  // 系统管理
  {
    path: "system-management",
    name: "system-management",
    meta: {
      title: "system-management",
      icon: "el-icon-Setting",
    },
    redirect: "/system-management/user-management",
    children: [
      {
        path: "user-management",
        name: "system-management_user-management",
        meta: { title: "system-management_user-management" },
        component: "SystemManagement/userManagement/UserManagement.vue",
      },
    ],
  },
  // showcases : 案例展示
  {
    path: "showcases", // 建议：小写+短横线
    name: "showcases",
    meta: {
      title: "showcases", // 案例展示
      icon: "el-icon-Collection",
    },
    // component: "ParentView", // /show-cases下面的容器组件，children路由渲染位置
    redirect: "/showcases/3d-tiles-gaussian-splatting", // 默认打开第一个子菜单
    children: [
      {
        path: "hello-world",
        name: "sc_hello-world",
        meta: { title: "showcases_hello-world" }, // Hello World案例
        // 注意：确保你的文件真实路径是 src/views/ShowCases/3DTilesGaussianSplatting.vue
        component: "ShowCases/HelloWorld.vue",
      },
      {
        path: "3d-tiles-gaussian-splatting",
        name: "sc_3d-tiles-gaussian-splatting",
        meta: { title: "showcases_3d-tiles-gaussian-splatting" }, // 3D 瓦片高斯贴图
        // 注意：确保你的文件真实路径是 src/views/ShowCases/3DTilesGaussianSplatting.vue
        component: "ShowCases/3DTilesGaussianSplatting.vue",
      },
      {
        path: "3d-tiles-gaussian-splatting-comparison",
        name: "sc_3d-tiles-gaussian-splatting-comparison",
        meta: { title: "showcases_3d-tiles-gaussian-splatting-—-mesh-comparison" }, // 3D 瓦片高斯贴图 - 网格比较
        component: "ShowCases/3DTilesGaussianSplattingMeshComparison.vue",
      },
      {
        path: "vertical-exaggeration-with-3d-tiles",
        name: "sc_vertical-exaggeration-with-3d-tiles",
        meta: { title: "showcases_vertical-exaggeration-with-3d-tiles" }, // 3D 瓦片垂直拉伸
        component: "ShowCases/VerticalExaggerationWith3dTiles.vue",
      },
      {
        path: "google-photorealistic-3d-tiles",
        name: "sc_google-photorealistic-3d-tiles",
        meta: { title: "showcases_google-photorealistic-3d-tiles" }, // Google 照片级真实三维瓦片数据
        component: "ShowCases/GooglePhotorealistic3dTiles.vue",
      },
      {
        path: "google-2d-tiles",
        name: "sc_google-2d-tiles",
        meta: { title: "showcases_google-2d-tiles" }, // 加载Google Maps 2D 地图瓦片数据
        component: "ShowCases/Google2DTiles.vue",
      },
      {
        path: "imagery-assets-available-from-ion",
        name: "sc_imagery-assets-available-from-ion",
        meta: { title: "showcases_imagery-assets-available-from-ion" }, // 从Cesium Ion 加载imagery影像图层
        component: "ShowCases/ImageryAssetsFromIon.vue",
      },
      {
        path: "google-2d-tiles-with-custom-styles",
        name: "sc_google-2d-tiles-with-custom-styles",
        meta: { title: "showcases_google-2d-tiles-with-custom-styles" }, //
        component: "ShowCases/Google2DTilesWithCustomStyles.vue",
      },
    ],
  },
  // 2D 视图
  {
    path: "2d-view", // 修正：去掉了空格
    name: "2d-view",
    meta: { title: "2d-view", icon: "el-icon-MapLocation" }, // 2D 视图
    // component: "ParentView",
    redirect: "/2d-view/multiple-synced-views",
    children: [
      {
        path: "multiple-synced-views",
        name: "multiple-synced-views",
        meta: { title: "2d-view_multiple-synced-views" }, // 多个同步视图
        component: "2DViews/MultipleSyncedViews.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
      {
        path: "rotatable-2d-map",
        name: "rotatable-2d-map",
        meta: { title: "2d-view_rotatable-2d-map" }, // 可旋转的二维地图
        component: "2DViews/Rotatable2DMap.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
  // 动画
  {
    path: "animation", // 修正：去掉了空格
    name: "animation",
    meta: { title: "animation", icon: "el-icon-VideoPlay" }, // 动画
    // component: "ParentView",
    redirect: "/animation/clock",
    children: [
      {
        path: "clock",
        name: "animation_clock",
        meta: { title: "animation_clock" }, // 时钟
        component: "Animation/Clock.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
      // 自定义补充的demo,动画基础案例
      {
        path: "base-animation",
        name: "animation_base-animation",
        meta: { title: "animation_base-animation" }, // 基础动画
        component: "Animation/BaseAnimation.vue",
      },
      {
        path: "accelerate-animation",
        name: "animation_accelerate-animation",
        meta: { title: "animation_accelerate-animation" }, // 加速动画
        component: "Animation/AccelerateAnimation.vue",
      },
      {
        path: "time-dynamic-wheels",
        name: "animation_time-dynamic-wheels",
        meta: { title: "animation_time-dynamic-wheels" }, // 时间动态轮子
        component: "Animation/TimeDynamicWheels.vue",
      },
    ],
  },
  // 3D 模型
  {
    path: "3d-models", // 修正：去掉了空格
    name: "3d-models",
    meta: { title: "3d-models", icon: "el-icon-Box" }, // 3D 模型
    // component: "ParentView",
    redirect: "/3d-models/gltf-models",
    children: [
      {
        path: "gltf-models",
        name: "3d_gltf-models",
        meta: { title: "3d-models_gltf-models" }, // glTF 模型
        component: "3DModels/GltfModels.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
      {
        path: "coloring-and-styling-gltf-models",
        name: "3d-models_coloring-and-styling-gltf-models",
        meta: { title: "3d-models_coloring-and-styling-gltf-models" }, // glTF 模型 着色和样式
        component: "3DModels/ColoringGltfModels.vue",
      },
      {
        path: "clamp-to-3d-model",
        name: "3d-models_clamp-to-3d-model",
        meta: { title: "3d-models_clamp-to-3d-model" }, // glTF 模型 着色和样式
        component: "3DModels/Clamp3dModel.vue",
      },
      {
        path: "projection",
        name: "3d-models_projection",
        meta: { title: "3d-models_projection" }, //projection
        component: "3DModels/Projection.vue",
      },
      {
        path: "physically-based-materials",
        name: "3d-models_physically-based-materials",
        meta: { title: "3d-models_physically-based-materials" }, //Physically-Based Materials
        component: "3DModels/PhysicallyBasedMaterials.vue",
      },
      {
        path: "time-dynamic-wheels",
        name: "3d-models_time-dynamic-wheels",
        meta: { title: "3d-models_time-dynamic-wheels" }, //Time-Dynamic Wheels
        component: "3DModels/TimeDynamicWheels.vue",
      },
    ],
  },
  // Camera 相机
  {
    path: "camera",
    name: "camera",
    meta: { title: "camera", icon: "el-icon-Camera" },
    redirect: "/camera/camera",
    children: [
      {
        path: "camera",
        name: "camera-fly",
        meta: { title: "camera_camera" }, // 相机飞行
        component: "Camera/CameraFly.vue",
      },
      {
        path: "camera-tutorial",
        name: "camera-tutorial",
        meta: { title: "camera_camera-tutorial" }, // 相机教程
        component: "Camera/CameraTutorial.vue",
      },
      {
        path: "entity-tracking",
        name: "entity-tracking",
        meta: { title: "camera_entity-tracking" }, // 实体跟踪
        component: "Camera/EntityTracking.vue",
      },
      {
        path: "multiple-synced-views",
        name: "camera_multiple-synced-views",
        meta: { title: "camera_multiple-synced-views" }, // 同步视图
        component: "Camera/MultipleSyncedViews.vue",
      },
      {
        path: "cardboard",
        name: "camera_cardboard",
        meta: { title: "camera_cardboard" }, // 同步视图
        component: "Camera/Cardboard.vue",
      },
    ],
  },
  // Entity 实体
  {
    path: "entities",
    name: "entities",
    meta: { title: "entities", icon: "el-icon-Van" },
    redirect: "/entities/show-or-hide-entities",
    children: [
      {
        path: "show-or-hide-entities",
        name: "show-or-hide-entities",
        meta: { title: "entities_show-or-hide-entities" }, // 显示与隐藏实体
        component: "Entities/ShowOrHiddenEntities.vue",
      },
      {
        path: "video",
        name: "entities_video",
        meta: { title: "entities_video" }, // 视频
        component: "Entities/Video.vue",
      },
      {
        path: "gltf-models",
        name: "entities_gltf-models",
        meta: { title: "entities_gltf-models" }, // glTF 模型
        component: "Entities/GltfModels.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
      {
        path: "coloring-and-styling-gltf-models",
        name: "entities_coloring-and-styling-gltf-models",
        meta: { title: "entities_coloring-and-styling-gltf-models" }, // glTF 模型 着色和样式
        component: "Entities/ColoringGltfModels.vue", // 假设在 src/views/MultipleSyncedViews.vue
      },
    ],
  },
  // Metadata
  {
    path: "metadata",
    name: "metadata",
    meta: { title: "metadata", icon: "el-icon-Dish" },
    redirect: "/metadata/3d-tiles-styling",
    children: [
      {
        path: "3d-tiles-styling",
        name: "metadata_3d-tiles-styling",
        meta: { title: "metadata_3d-tiles-styling" }, // 3D Tiles 样式
        component: "Metadata/3DTilesStyling.vue",
      },
    ],
  },
  // 3D Tiles 3D 瓦片
  {
    path: "3d-tiles",
    name: "3d-tiles",
    meta: { title: "3d-tiles", icon: "el-icon-Memo" },
    redirect: "/3d-tiles/3d-tiles-styling",
    children: [
      {
        path: "offset-3d-tileset-height",
        name: "3d-tiles_offset-3d-tileset-height",
        meta: { title: "3d-tiles_offset-3d-tileset-height" }, // 3D Tiles 偏移高度
        component: "3DTiles/Offset3DTilesetHeight.vue",
      },
      {
        path: "3d-tiles-styling",
        name: "3d-tiles_3d-tiles-styling",
        meta: { title: "3d-tiles_3d-tiles-styling" }, // 3D Tiles 偏移高度
        component: "3DTiles/3DTilesStyling.vue",
      },
    ],
  },
];

export default menuConfig;
