<script setup lang="ts">
// 利用鼠标和键盘 操作相机，熟悉 Cesium 的基本交互方式
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
};
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <CesiumViewer @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
