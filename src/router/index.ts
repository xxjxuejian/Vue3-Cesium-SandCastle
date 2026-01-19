import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import menuConfig, { type MenuItem } from "@/config/menu";
const Layout = () => import("@/layout/index.vue");

// 目标：把配置转化为 RouteRecordRaw 对象, 平铺结构平级子路由
function generateRoutes(config: any[], parentPath = ""): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];

  config.forEach((item) => {
    // 拼接路径：如果 parentPath 是 '2d-view'，child 是 'multiple'，结果就是 '2d-view/multiple'
    // 注意：这里我们构造的是相对路径，最终会放在 Layout 的 children 里
    const fullPath = parentPath ? `${parentPath}/${item.path}` : item.path;

    // 情况 A：这是个具体的页面（有componentPath）
    if (item.component) {
      const componentLoader = modules[`/src/views/${item.component}`];
      console.log("componentLoader", componentLoader);

      if (componentLoader) {
        routes.push({
          path: fullPath, // 这里生成的路径是相对于 Layout 的根路径的
          name: item.name,
          meta: item.meta,
          component: componentLoader,
        });
      }
    }

    // 情况 B：这是个目录，继续递归（不管目录本身，只关心目录下的叶子节点）
    if (item.children) {
      routes.push(...generateRoutes(item.children, item.path));
    }
  });

  return routes;
}

// 1. 导入所有视图组件
const modules = import.meta.glob("@/views/**/*.vue");
console.log("modules", modules);

const dynamicRoutes = generateRoutes(menuConfig);
console.log("aaaaaa", dynamicRoutes);

export const constantRoutes: RouteRecordRaw[] = [
  // 1. 顶级路由：只要路径匹配到 /，就先加载 Layout
  {
    path: "/",
    name: "/",
    component: Layout,
    children: [
      {
        // 首页：path 为空，表示默认显示, 访问 http://localhost/ 时显示 Home
        path: "",
        name: "Home",
        component: () => import("@/views/Home/index.vue"),
        meta: {
          title: "home",
          icon: "home",
        },
      },
      ...dynamicRoutes,
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}
console.log("router", router.getRoutes());
export default router;
