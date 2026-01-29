<script setup lang="ts">
import { type Viewer, Math } from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

let viewerInstance: Viewer | null = null;
const viewModel = reactive({
  useBrowserRecommendedResolution: false,
  resolutionScale: 0.2,
});
const handleMapLoaded = (viewer: Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  viewerInstance = viewer;
  // viewer实例创建完成，进行一次分辨率设置
  update();
};

/* 
  结合UI实时调整Cesium WebGL canvas 的渲染分辨率，以平衡清晰度和性能。
  useBrowserRecommendedResolution: 
      true：使用浏览器建议的分辨率（通常是 CSS 像素，≈96 DPI）
      false：使用设备原生分辨率（受 devicePixelRatio 影响）

  resolutionScale: 对 WebGL canvas 再做一次缩放（在是否采用了 useBrowserRecommendedResolution的基础上 做缩放）
  默认值：1.0
      < 1：降分辨率 → 性能↑
      > 1：升分辨率 → 更清晰，但更耗性能
*/
function update() {
  // console.log("1111", viewerInstance);
  if (!viewerInstance) return;
  const viewer = viewerInstance;
  viewer.useBrowserRecommendedResolution = viewModel.useBrowserRecommendedResolution;

  let resolutionScale = Number(viewModel.resolutionScale);
  resolutionScale = !isNaN(resolutionScale) ? resolutionScale : 1.0;
  // 限定resolutionScale，在 [0.1, 2.0] 之间，防止非法输入破坏渲染
  resolutionScale = Math.clamp(resolutionScale, 0.1, 2.0);
  viewer.resolutionScale = resolutionScale;
}

// 监听分辨率缩放，执行一次更新操作，如果采用immediate: true，初始并不会执行，因为viewer实例没有创建完成，
// 所以在handleMapLoaded 进行初次操作
watch(
  () => viewModel.resolutionScale,
  (value, oldValue) => {
    console.log("value", value, oldValue);
    update();
  }
);
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer @map-loaded="handleMapLoaded"></CesiumViewer>

    <!-- UI 控制 -->
    <div class="absolute-lt z-10 bg-[#1f2023] p-2 text-white w-[400px]">
      <div>
        <el-checkbox
          v-model="viewModel.useBrowserRecommendedResolution"
          label="Use Browser Recommended Resolution"
        />
      </div>
      <div class="flex items-center">
        <span class="shrink-0 mr-4">Resolution Scale</span>
        <el-slider
          v-model="viewModel.resolutionScale"
          class="flex-1"
          :min="0.1"
          :max="2"
          :step="0.1"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
