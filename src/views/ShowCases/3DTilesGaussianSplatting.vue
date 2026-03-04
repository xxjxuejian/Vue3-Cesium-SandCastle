<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 实例已获取:", viewer);

  try {
    // Cesium.Cesium3DTileset 和Cesium.IonResource 等有什么区别？
    const resource = await Cesium.IonResource.fromAssetId(4498728);
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0, 100),
      model: {
        uri: resource,
      },
    });
    viewer.trackedEntity = entity;
  } catch (error) {
    console.log(error);
  }
};
</script>

<template>
  <div class="demo-container">
    <CesiumViewer @map-loaded="handleMapLoaded"></CesiumViewer>
  </div>
</template>

<style scoped lang="scss">
.demo-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
