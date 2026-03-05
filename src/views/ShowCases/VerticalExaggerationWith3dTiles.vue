<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import { clamp } from "@/utils/common";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  timeline: false,
  animation: false,
  sceneModePicker: false,
  baseLayerPicker: false,
  geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
  // The globe does not need to be displayed, since the Photorealistic 3D Tiles include terrain
  // 因为 Google Photorealistic 3D Tiles 自带地形 所以不需要 Cesium 的 globe。
  globe: false,
};

// 优化 1: 使用 shallowRef 避免潜在 undefined
const scene = shallowRef<Cesium.Scene | null>(null);

// 滑动条的绑定数据
const viewModel = reactive({
  exaggeration: 3.0, // 夸张倍数，默认为1表示不夸张，可以根据需要调整范围和步长
  relativeHeight: 0,
});

// 监听地图加载完成
const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 实例已获取:", viewer);
  scene.value = viewer.scene;
  await initModel(viewer);
};

async function initModel(viewer: Cesium.Viewer) {
  const camera = viewer.camera;
  scene.value!.verticalExaggeration = viewModel.exaggeration;
  camera.setView({
    destination: new Cesium.Cartesian3(-2710292.813384663, -4360657.061518585, 3793571.786860543),
    orientation: new Cesium.HeadingPitchRoll(
      5.794062761901799,
      -0.30293409742984756,
      0.0009187098191985044
    ),
  });

  // Enable rendering the sky 开启天空大气
  if (scene.value?.skyAtmosphere) scene.value.skyAtmosphere.show = true;

  // 加载 Google Photorealistic 3D Tiles
  try {
    //加载 Google 的 3D 城市模型数据。
    const tileset = await Cesium.createGooglePhotorealistic3DTileset({
      // Only the Google Geocoder can be used with Google Photorealistic 3D Tiles.  Set the `geocode` property of the viewer constructor options to IonGeocodeProviderType.GOOGLE.
      onlyUsingWithGoogleGeocoder: true,
    });
    viewer.scene.primitives.add(tileset);
  } catch (error) {
    console.log(`Error loading Photorealistic 3D Tiles tileset.
    ${error}`);
  }
}

// 优化 2: 统一监听数据变化，替代模板中繁琐的 @input / @change 事件
watch(viewModel, (newVal) => {
  if (!scene.value) return;
  // 使用 clamp 确保安全性，并处理可能为空的情况
  newVal.exaggeration = clamp(Number(newVal.exaggeration) || 1, 1, 5);
  newVal.relativeHeight = clamp(Number(newVal.relativeHeight) || 0, -1000, 9000);

  scene.value.verticalExaggeration = newVal.exaggeration;
  scene.value.verticalExaggerationRelativeHeight = newVal.relativeHeight;
});

// 优化 4: 组件销毁前清理引用，防止内存泄漏
onBeforeUnmount(() => {
  scene.value = null;
});
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt bg-[#1f2023] p-4 text-white z-10 w-[420px] rounded-md max-w-[90vw]">
      <div class="flex items-center mb-2">
        <div class="w-[120px]">Exaggeration</div>
        <el-slider
          v-model="viewModel.exaggeration"
          :min="1"
          :max="5"
          :step="0.01"
          style="width: 150px"
          class="mx-4"
        />
        <el-input
          v-model.number="viewModel.exaggeration"
          placeholder="Please input"
          style="width: 80px"
          size="small"
          type="number"
          :min="1"
          :max="5"
          :step="0.01"
        />
      </div>
      <div class="flex items-center">
        <div class="w-[120px]">Relative Height</div>
        <el-slider
          v-model="viewModel.relativeHeight"
          :min="-1000"
          :max="9000"
          :step="1"
          style="width: 150px"
          class="mx-4"
        />
        <el-input
          v-model.number="viewModel.relativeHeight"
          placeholder="Please input"
          style="width: 80px"
          size="small"
          type="number"
          :min="-1000"
          :max="9000"
          :step="1"
        />
      </div>
    </div>
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
