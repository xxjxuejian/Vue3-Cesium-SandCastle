<script setup lang="ts">
// demo作用：演示如何在 CesiumJS 中加载和使用来自 Google Maps 的全球卫星影像瓦片。
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: Cesium.IonGeocodeProviderType.GOOGLE, // Geocoder 使用 Google
  timeline: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  homeButton: false,
};

// 加载 Google Maps 2D 地图瓦片数据
async function loadTerrain(viewer: Cesium.Viewer) {
  viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
}

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  // 展开搜索框
  viewer.geocoder.viewModel.keepExpanded = true;

  //   加载 Google Maps 2D 地图瓦片数据(异步)
  viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3830184))
  );
  await loadTerrain(viewer);

  /* 
   // Cesium.IonImageryProvider.fromAssetId(3830184),和 Cesium.createWorldTerrainAsync(), 都是返回promise
   // 可以使用Promise.all来同时加载影像和地形数据，
     const [imagery, terrain] = await Promise.all([
      Cesium.IonImageryProvider.fromAssetId(3830184),
      Cesium.createWorldTerrainAsync(),
    ]);
    viewer.imageryLayers.add(new Cesium.ImageryLayer(imagery));
    viewer.terrainProvider = terrain;
   */

  viewer.scene.globe.depthTestAgainstTerrain = true;

  viewer.scene.camera.flyTo({
    duration: 0,
    // Rectangle.fromDegrees 是静态方法，不需要 new。
    destination: Cesium.Rectangle.fromDegrees(
      //Philly
      -75.280266,
      39.867004,
      -74.955763,
      40.137992
    ),
  });
};
</script>

<template>
  <div class="wh-full overflow-hidden">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
