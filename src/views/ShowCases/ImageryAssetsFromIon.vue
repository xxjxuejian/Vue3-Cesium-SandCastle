<script setup lang="ts">
// 从Cesium Ion 加载Imagery影像资产的示例
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

// 重点：使用 shallowRef 或普通变量来存储 viewer，避免 Vue 的深度响应式代理导致卡顿或报错
const viewerInstance = shallowRef<Cesium.Viewer | null>(null);
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
const selectedLayerId = ref(3830186); // select选择器的选中值
const selectOptions = [
  { label: "Google Maps 2D Contour", assetId: 3830186 },
  { label: "Google Maps 2D Labels Only", assetId: 3830185 },
  { label: "Google Maps 2D Roadmap", assetId: 3830184 },
  { label: "Google Maps 2D Satellite", assetId: 3830182 },
  { label: "Google Maps 2D Satellite with Labels", assetId: 3830183 },
  //   { label: "Azure Maps Aerial", assetId: 3891168 },
  //   { label: "Azure Maps Roads", assetId: 3891169 },
  //   { label: "Azure Maps Labels Only", assetId: 3891170 },
  { label: "Sentinel-2", assetId: 3954 },
];
// 加载 Google Maps 2D 地图瓦片数据
async function loadTerrain(viewer: Cesium.Viewer) {
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);
}

// 显示影像
function showLayer(assetId: number) {
  if (!viewerInstance.value) return;
  // 移除现有图层
  viewerInstance.value.imageryLayers.removeAll(true);
  // 添加新图层
  const layer = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(assetId)
  );
  viewerInstance.value.imageryLayers.add(layer);
}

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  viewerInstance.value = viewer; // 将 Cesium Viewer 实例存储在 shallowRef 中
  console.log("Cesium 示例已加载:", viewer);

  //   加载地形
  await loadTerrain(viewer);
  // 展开搜索框
  viewer.geocoder.viewModel.keepExpanded = true;

  // Viewer 初始化完成后，手动调用一次，加载默认选中的图层
  showLayer(selectedLayerId.value);

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

/* 
这里不推荐使用 watch(..., { immediate: true }) ？
在组件刚刚 setup 并触发 immediate watch 时，viewer.value 还是 null。
所以最稳妥的逻辑如上述代码所示：
    1. onMounted 里完成 viewer 实例化后，显式调用一次 showLayer 进行首屏渲染。
    2. 之后由普通的 watch 接管，每当用户在下拉框切换数据改变 selectedLayerId 时，自动触发图层切换。
*/
watch(selectedLayerId, (newAssetId) => {
  showLayer(newAssetId);
});

onBeforeUnmount(() => {
  if (viewerInstance.value) {
    viewerInstance.value.destroy();
    viewerInstance.value = null;
  }
});
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt bg-[#1f2023 z-10 p-4 rounded-lg">
      <el-select v-model="selectedLayerId" placeholder="Select" style="width: 240px">
        <el-option
          v-for="item in selectOptions"
          :key="item.assetId"
          :label="item.label"
          :value="item.assetId"
        />
      </el-select>
    </div>
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
