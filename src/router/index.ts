//src/router/index.ts

import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import menuConfig from "@/config/menu";
import { generateRoutes } from "./generator";
const Layout = () => import("@/layout/index.vue");

export const constantRoutes: RouteRecordRaw[] = [
  // 1. 顶级路由：只要路径匹配到 /，就先加载 Layout
  {
    path: "/",
    name: "Root",
    component: Layout,
    redirect: "/home",
    children: [
      {
        // 首页：path 为空，表示默认显示, 访问 http://localhost/ 时显示 Home
        path: "home",
        name: "Home",
        component: () => import("@/views/Home/index.vue"),
        meta: {
          title: "home",
          icon: "el-icon-HomeFilled",
        },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/Error/404.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// 3. 动态路由注册逻辑
// 注意：通常这部分逻辑会放在 main.ts 或者 路由守卫(permission.ts) 中
// 为了演示简单，这里直接写在初始化之后

const initDynamicRoutes = () => {
  // 生成路由树
  const dynamicRoutes = generateRoutes(menuConfig);
  console.log("dynamicRoutes", dynamicRoutes);
  // 遍历生成的顶层路由，将它们逐个添加到 'Layout' 内部
  dynamicRoutes.forEach((route) => {
    // 语法：router.addRoute(parentName, routeRecord)
    router.addRoute("Root", route);
  });

  // console.log('当前所有路由:', router.getRoutes());
};

// 执行注册
initDynamicRoutes();

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router;
