<script setup lang="ts">
import { type PropType } from "vue";
import { type MenuItem } from "@/config/menu"; // 引入你的类型定义

import SideBarMenuItemTitle from "./SideBarMenuItemTitle.vue";
const props = defineProps({
  // 当前菜单项数据
  item: {
    type: Object as PropType<MenuItem>,
    required: true,
  },
  // 父级路径，用于拼接完整 URL
  basePath: {
    type: String,
    default: "",
  },
});

/**
 * 路径拼接函数
 * 将父路径 (basePath) 和当前路径 (routePath) 拼接成完整路径，这个路由路径将用于 生成菜单项的索引index值。
 * 例如: basePath="/show-cases", routePath="mesh" -> "/show-cases/mesh"
 */
const resolvePath = (routePath: string) => {
  const fullPath =
    props.basePath === "/" ? `${props.basePath}${routePath}` : `${props.basePath}/${routePath}`;
  // console.log("basePath", props.basePath);
  // console.log("routePath", routePath);
  // console.log(`fullPath,fullPath`, fullPath);
  return fullPath;
};
</script>

<template>
  <!-- 情况1：没有子菜单，或者子菜单为空 -> 渲染为具体的菜单项 -->
  <template v-if="!item.children || item.children.length === 0">
    <el-menu-item :index="resolvePath(item.path)">
      <SideBarMenuItemTitle
        :icon="item.meta?.icon"
        :title="item.meta?.title"
      ></SideBarMenuItemTitle>
    </el-menu-item>
  </template>
  <!-- 情况2：有子菜单 -> 渲染为折叠菜单 -->
  <template v-else>
    <el-sub-menu :index="resolvePath(item.path)">
      <template #title>
        <SideBarMenuItemTitle
          :icon="item.meta?.icon"
          :title="item.meta?.title"
        ></SideBarMenuItemTitle>
      </template>
      <!-- 递归渲染子菜单项 -->
      <SideBarMenuItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(item.path)"
      />
    </el-sub-menu>
  </template>
</template>

<style scoped lang="scss">
.el-sub-menu.is-active {
  & > :deep(.el-sub-menu__title) {
    color: var(--el-menu-active-color);
  }
}
</style>
