<script setup lang="ts">
// demo作用：加载 Google 提供的 Photorealistic 3D Tiles，并把相机定位到 Google 总部区域。
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  timeline: false, // 关闭底部时间轴
  animation: false, // 关闭底部动画控制
  sceneModePicker: false, // 禁用2D / 3D 切换选择器
  baseLayerPicker: false, // 禁用底图选择器
  geocoder: Cesium.IonGeocodeProviderType.GOOGLE, // 必须使用 Google Geocoder
  //默认情况下 Cesium 会渲染 Globe：包括Terrain、Imagery
  //   但 Google Photorealistic 3D Tiles 已经包含地形和建筑：真实地形 + 建筑模型
  //   直接关闭 globe 渲染，避免与 Google 3D Tiles 的地形重复渲染，提升性能。
  globe: false,
};

// 监听地图加载完成
const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);

  //   Enable rendering the sky 开启大气层渲染。
  // 效果就是远处会出现：蓝色天空、地平线雾化；如果关闭则远处是黑色的天空。
  //   这个只是视觉增强，不影响 tiles。
  if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;

  // 加载 Google Photorealistic 3D Tiles
  try {
    // 调用 Cesium 提供的 快捷 API：createGooglePhotorealistic3DTileset,本质上是在创建Cesium3DTileset
    // 数据来源是 Google 服务器。
    const tileset = await Cesium.createGooglePhotorealistic3DTileset({
      // Only the Google Geocoder can be used with Google Photorealistic 3D Tiles.
      //   Set the `geocode` property of the viewer constructor options to IonGeocodeProviderType.GOOGLE.
      onlyUsingWithGoogleGeocoder: true, // 保证只在使用 Google Geocoder 的情况下使用此数据。否则 Cesium 会抛异常。
    });
    viewer.scene.primitives.add(tileset);
  } catch (error) {
    console.log(`Error loading Photorealistic 3D Tiles tileset.
          ${error}`);
  }

  // Point the camera at the Googleplex 定位到 Google 总部区域
  viewer.scene.camera.setView({
    destination: new Cesium.Cartesian3(-2693797.551060477, -4297135.517094725, 3854700.7470414364),
    // 控制相机姿态
    orientation: new Cesium.HeadingPitchRoll(
      4.6550106925119925,
      -0.2863894863138836,
      1.3561760425773173e-7
    ),
  });
};
</script>

<template>
  <div class="wh-full overflow-auto">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
