// src/router/generator.ts
import { type RouteRecordRaw, RouterView } from "vue-router";
import type { MenuItem } from "@/config/menu";

// 1. 获取 views 目录下所有 vue 文件
// Vite 的 Glob 导入：Key 是路径，Value 是动态 import 函数
const viewsModules = import.meta.glob("@/views/**/*.vue");
const ParentView = () => import("@/components/ParentView/index.vue");
/**
 * 简单的 ParentView 组件
 * 作用：仅仅渲染 router-view，让子路由显示出来
 */
// const ParentView = {
//   name: "ParentView",
//   render: () => h(RouterView), // 使用 Vue 的 h 函数渲染 RouterView
// };
// 注意：如果上面报错 'h' 未定义，请在文件头部 import { h } from 'vue';
// 或者直接用 template 写法： const ParentView = { template: '<router-view />' };

/**
 * 将菜单树转换为路由树
 * @param menus 菜单配置
 * @returns 路由配置数组
 */
export const generateRoutes = (menus: MenuItem[]): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = [];

  menus.forEach((item) => {
    // 基础路由对象
    const route = { ...item } as RouteRecordRaw;

    // ---------------- 核心逻辑开始 ----------------

    // 情况 1: 如果有具体的 component 路径，尝试加载组件
    if (item.component) {
      // 拼接完整路径，需与 import.meta.glob 的 key 匹配
      // 假设你的 component 字段是 'ShowCases/3DTiles.vue'
      const fullPath = `/src/views/${item.component}`;

      if (viewsModules[fullPath]) {
        route.component = viewsModules[fullPath];
      } else {
        console.warn(`[路由生成] 未找到组件文件: ${fullPath}，请检查路径拼写。`);
        // 容错处理：找不到组件时也给个 404 防止报错
        route.component = viewsModules["/src/views/Error/404.vue"];
      }
    }
    //  没有 component，但是有 children (中间层级菜单，如 'ShowCases')
    else if (item.children && item.children.length > 0) {
      // 这时候必须给它一个容器组件，否则它的 children 无法渲染！
      route.component = ParentView;
    }

    // ---------------- 核心逻辑结束 ----------------

    // 递归处理子路由
    if (item.children && item.children.length > 0) {
      route.children = generateRoutes(item.children);
    }

    routes.push(route);
  });

  return routes;
};
