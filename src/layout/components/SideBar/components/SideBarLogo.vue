<script setup lang="ts">
import cesiumLogo from "@/assets/images/cesium-logo.png";
import { useAppStore } from "@/stores/modules/app.store";
const appStore = useAppStore();
</script>

<template>
  <div class="sidebar-logo">
    <img :src="cesiumLogo" alt="cesium-logo" class="w-8 h-8" title="Cesium Examples" />
    <span v-show="!appStore.isCollapse" class="title text-sm truncate">Vue3 Cesium Examples</span>
  </div>
</template>

<style scoped lang="scss">
.sidebar-logo {
  display: flex;
  column-gap: 4px;
  align-items: center;
  justify-content: center;
  height: $navbar-height;
  cursor: pointer;
  background-color: #f5f5f5;

  .title {
    font-weight: 700;
  }
}
</style>
