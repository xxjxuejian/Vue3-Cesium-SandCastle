<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

let vwInstance: Cesium.Viewer;
const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  showRenderLoopErrors: false, // 是否显示渲染循环错误
  shouldAnimate: true, //启用时间轴动画
};
const videoContainerRef = ref<HTMLVideoElement | null>(null);
const isSync = ref(false);
let synchronizer: Cesium.VideoSynchronizer | null = null;
const isRepeating = ref(true); //控制纹理重复（repeat）
const isShowVideoElement = ref(true); // 是否显示视频元素

const handleSyncChange = () => {
  // 销毁同步器
  if (Cesium.defined(synchronizer)) {
    synchronizer.destroy();
    synchronizer = null;
    videoContainerRef.value!.playbackRate = 1.0;
    return;
  }

  // 创建同步器
  if (vwInstance) {
    synchronizer = new Cesium.VideoSynchronizer({
      clock: vwInstance.clock,
      element: videoContainerRef.value as HTMLVideoElement,
    });
  }
};

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  vwInstance = viewer;
  // 1. 先判断 DOM 是否成功获取，解决 null 报错
  if (!videoContainerRef.value) {
    console.error("Video DOM hasn't mounted yet!");
    return;
  }

  const sphere = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(-79, 39, 5000),
    ellipsoid: {
      radii: new Cesium.Cartesian3(1000, 1000, 1000),
      // material: videoContainerRef.value,
      // 2. 标准写法：使用 ImageMaterialProperty 显式创建材质
      material: new Cesium.ImageMaterialProperty({
        image: videoContainerRef.value, // 这里的 image 属性可以合法接收 HTMLVideoElement
      }),
    },
  });
  viewer.trackedEntity = sphere;

  // 视频同步器
  synchronizer = new Cesium.VideoSynchronizer({
    clock: viewer.clock,
    element: videoContainerRef.value as HTMLVideoElement,
  });

  // 动态属性 CallbackProperty 每一帧都会执行。
  const material = sphere.ellipsoid?.material as Cesium.ImageMaterialProperty;
  if (material) {
    material.repeat = new Cesium.CallbackProperty(function (time, result) {
      if (!Cesium.defined(result)) {
        result = new Cesium.Cartesian2();
      }
      if (isRepeating.value) {
        result.x = 8;
        result.y = 8;
      } else {
        result.x = 1;
        result.y = 1;
      }
      return result;
    }, false);
  }
};
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <div class="absolute-lt z-10 bg-[#1f2023] p-2 flex flex-col gap-y-2 text-white rounded-lg">
      <div class="flex items-center gap-x-2">
        <el-switch v-model="isSync" @change="handleSyncChange" />
        <span>Clock synchronization</span>
      </div>
      <div class="flex items-center gap-x-2">
        <el-switch v-model="isRepeating" />
        <span>Image Repeat</span>
      </div>
      <div class="flex items-center gap-x-2">
        <el-switch v-model="isShowVideoElement" />
        <span>Video Overlay</span>
      </div>
    </div>
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded"></CesiumViewer>
    <div
      v-show="isShowVideoElement"
      class="absolute right-0 bottom-[75px] z-10 w-[320px] h-[180px]"
    >
      <video
        ref="videoContainerRef"
        muted
        autoplay
        loop
        crossorigin="anonymous"
        controls
        class="wh-full"
      >
        <source
          src="https://cesium.com/public/SandcastleSampleData/big-buck-bunny_trailer.webm"
          type="video/webm"
        />
        <source
          src="https://cesium.com/public/SandcastleSampleData/big-buck-bunny_trailer.mp4"
          type="video/mp4"
        />
        <source
          src="https://cesium.com/public/SandcastleSampleData/big-buck-bunny_trailer.mov"
          type="video/quicktime"
        />
        Your browser does not support the
        <code>video</code>
        element.
      </video>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
