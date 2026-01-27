<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import cesiumLogoOverLay from "@/assets/images/Cesium_Logo_overlay.png";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  requestRenderMode: true,
};

// 把html元素 添加到地图上
// // 为了根据地理位置将 HTML 元素覆盖在 Cesium 画布上，
// 需要使用 scene.cartesianToCanvasCoordinates 方法，
// 将世界坐标转换为画布坐标（x、y）。
// 本示例使用的是 img 元素，但同样适用于任意 HTML 元素。
const htmlElRef = ref<HTMLImageElement>();
const viewerInstance = ref<Cesium.Viewer>();
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewerInstance.value = viewer;
  viewerInstance.value?.scene.preRender.addEventListener(function () {
    console.log("asdasda");
  });
};

// viewerInstance.value?.camera.changed.addEventListener(() => {
//   const position = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
//   console.log("position", position);
// });
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded"></CesiumViewer>

    <img
      ref="htmlElRef"
      :src="cesiumLogoOverLay"
      alt="cesiumLogoOverLay"
      class="absolute z-10 top-0 left-0"
    />
  </div>
</template>

<style scoped lang="scss"></style>
