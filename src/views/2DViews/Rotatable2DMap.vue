<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  sceneMode: Cesium.SceneMode.SCENE2D,
  mapMode2D: Cesium.MapMode2D.ROTATE,
};

let mapViewer: Cesium.Viewer;
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  mapViewer = viewer;
  mapViewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-73.0, 42.0, 50000000.0),
    orientation: {
      heading: Cesium.Math.toRadians(-45.0),
    },
  });
};
</script>

<template>
  <div class="wh-full overflow-hidden">
    <CesiumViewer :config="mapConfig" @loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
