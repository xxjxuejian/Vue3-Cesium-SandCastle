<script setup lang="ts">
import { onUnmounted } from "vue";
// @ts-ignore
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  homeButton: false,
};

let viewer: Cesium.Viewer | null = null;

const handleMapLoaded = async (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;

  // 在这里迁移 Sandcastle 示例核心逻辑。
};

onUnmounted(() => {
  viewer = null;
});
</script>

<template>
  <div class="demo-page">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />

    <div class="control-panel">
      <!-- 在这里放置从 Sandcastle toolbar 迁移来的 Vue 控件。 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.demo-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.control-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  color: #fff;
  background: rgb(32 34 38 / 82%);
  border-radius: 6px;
}
</style>
