<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app.store";

const appStore = useAppStore();
const toggleClick = () => {
  appStore.toggleSidebar();
};
</script>

<template>
  <div class="flex items-center cursor-pointer" @click="toggleClick">
    <div
      class="i-svg:collapse text-lg transition-transform duration-300"
      :class="appStore.isCollapse ? 'is-collapse' : ''"
    ></div>
    <!-- <el-icon v-show="appStore.isCollapse" :size="20"><Expand /></el-icon>
    <el-icon v-show="!appStore.isCollapse" :size="20"><Fold /></el-icon> -->
  </div>
</template>

<style scoped lang="scss">
.is-collapse {
  /* transform: rotate(180deg); */
  transform: scaleX(-1);
}
</style>
