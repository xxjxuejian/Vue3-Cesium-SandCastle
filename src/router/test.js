export const constantRoutes = [
  // 1. 顶级路由：只要路径匹配到 /，就先加载 Layout
  {
    path: "/",
    name: "/",
    component: Layout,
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/Home/index.vue"),
        meta: {
          title: "home",
          icon: "home",
        },
      },
      {
        path: "2d-view", // 修正：去掉了空格
        name: "2DView",
        meta: { title: "2D 视图", icon: "Monitor" },
        children: [
          {
            path: "multiple-synced-views",
            name: "MultipleSyncedViews",
            meta: { title: "多个同步视图" },
            component: "2DViews/MultipleSyncedViews.vue",
          },
        ],
      },
    ],
  },
];

export const constantRoutes2 = [
  // 1. 顶级路由：只要路径匹配到 /，就先加载 Layout
  {
    path: "/",
    name: "/",
    component: Layout,
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/views/Home/index.vue"),
        meta: {
          title: "home",
          icon: "home",
        },
      },
    ],
  },

  {
    path: "/2d-view", // 修正：去掉了空格
    name: "2DView",
    component: "Layout",
    redirect: "/2d-view/multiple-synced-views",
    meta: { title: "2D 视图", icon: "Monitor" },
    children: [
      {
        path: "multiple-synced-views",
        name: "MultipleSyncedViews",
        meta: { title: "多个同步视图" },
        component: "2DViews/MultipleSyncedViews.vue",
      },
    ],
  },
];
