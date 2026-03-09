<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
  timeline: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  homeButton: false,
};
const assetId = 3830184;

// 加载地形
async function loadTerrain(viewer: Cesium.Viewer) {
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);
}

// 添加影像图层
function addImageryLayer(viewer: Cesium.Viewer) {
  const base = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.Google2DImageryProvider.fromIonAssetId({
      assetId,
      mapType: "satellite",
    })
  );

  const overlay = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.Google2DImageryProvider.fromIonAssetId({
      assetId,
      overlayLayerType: "layerRoadmap",
      //   修改默认 Google 地图的视觉风格,每个对象就是一条 地图样式规则。
      styles: [
        // 没有指定 featureType，则对所有地图元素生效
        {
          // 改变整体色调 ；调整饱和度
          stylers: [{ hue: "#00ffe6" }, { saturation: -20 }],
        },
        // 针对道路单独设置：只作用道路，只作用道路几何形状
        {
          featureType: "road",
          elementType: "geometry",
          //   道路变得 非常亮（接近白色）； 道路 简化显示
          stylers: [{ lightness: 100 }, { visibility: "simplified" }],
        },
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }],
        },
      ],
    })
  );
  viewer.imageryLayers.add(base);
  viewer.imageryLayers.add(overlay);
}

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  //   viewerInstance.value = viewer; // 将 Cesium Viewer 实例存储在 shallowRef 中
  console.log("Cesium 示例已加载:", viewer);

  //   加载地形
  await loadTerrain(viewer);
  //   添加影像图层
  addImageryLayer(viewer);

  // 展开搜索框
  viewer.geocoder.viewModel.keepExpanded = true;

  //   调整相机位置，飞行到指定区域
  viewer.scene.camera.flyTo({
    duration: 0,
    destination: new Cesium.Rectangle.fromDegrees(
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
