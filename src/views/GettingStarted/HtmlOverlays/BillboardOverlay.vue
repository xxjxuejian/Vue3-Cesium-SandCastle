<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  //   terrainProvider: Cesium.createWorldTerrain(),
};

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
};

// 使用Billboard 添加一个图标覆盖物
function addOverlays(viewer: Cesium.Viewer) {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
    billboard: {
      image: require("@/assets/images/cesium-logo.png"),
      scale: 0.5,
      // 自动处理地球遮挡，不用你算
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    },
  });
}
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
