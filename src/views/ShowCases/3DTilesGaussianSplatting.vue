<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 实例已获取:", viewer);

  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3667783);
    viewer.scene.primitives.add(tileset);
    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(Cesium.Math.toRadians(0.0), Cesium.Math.toRadians(-15.0), 200.0)
    );
  } catch (error) {
    console.log(`Error loading tileset: ${error}`);
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
