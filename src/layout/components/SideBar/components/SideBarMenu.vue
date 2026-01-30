<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app.store";

import SideBarMenuItem from "./SideBarMenuItem.vue";

import menuConfig from "@/config/menu";
import { type MenuItem } from "@/config/menu";

const appStore = useAppStore();

const route = useRoute();

// 1. 静态菜单项,也需要显示在侧边栏中的
// 首页通常没有子菜单，或者你不希望它展开，所以 children 不写或为空
// 利用 静态菜单项 + 动态菜单项menuConfig  实现 左侧菜单项的动态生成，和vue router 无关
const staticMenu: MenuItem = {
  path: "home",
  name: "Home",
  meta: {
    title: "home",
    icon: "el-icon-HomeFilled",
  },
};
// 2. 合并菜单：[首页, ...业务菜单]
const allMenuList = computed(() => {
  return [staticMenu, ...menuConfig];
});
</script>

<template>
  <el-menu
    :default-active="route.path"
    :unique-opened="false"
    mode="vertical"
    router
    :collapse="appStore.isCollapse"
  >
    <!-- 递归渲染菜单项 -->
    <SideBarMenuItem v-for="item in allMenuList" :key="item.path" :item="item" base-path="/" />
  </el-menu>
</template>

<style scoped lang="scss">
/* 解决子路由激活时，父级路由样式失效问题 */
/* .el-menu {
  :deep(.el-sub-menu.is-active) {
    & > .el-sub-menu__title {
      color: var(--el-menu-active-color);
    }
  }
} */
</style>
