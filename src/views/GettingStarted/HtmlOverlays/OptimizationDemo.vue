<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import cesiumLogoOverLay from "@/assets/images/Cesium_Logo_overlay.png";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  requestRenderMode: true,
};

const htmlElRef = ref<HTMLImageElement>();
let removePreRenderListener: Cesium.Event.RemoveCallback | undefined; // 用于存储移除事件的函数
let viewerInstance: Cesium.Viewer | null = null; // 暂存 viewer 实例

//，频繁创建对象（new Object）是有代价的，尤其是在 preRender 这种每秒执行 60 次的高频循环中。
const position = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
const scratch = new Cesium.Cartesian2();
function updateOverlayPosition(viewer: Cesium.Viewer) {
  const htmlEl = htmlElRef.value;
  if (!viewer || !htmlEl) return;

  // A. 计算屏幕坐标
  const canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position, scratch);
  if (Cesium.defined(canvasPosition)) {
    // B. 处理“地球背面遮挡”问题
    // 如果不加这个判断，当点转到地球背面时，图片依然会显示在地球表面，看起来很怪
    const cameraPosition = viewer.camera.position;
    const ellipsoidalOccluder = new Cesium.EllipsoidalOccluder(
      viewer.scene.globe.ellipsoid,
      cameraPosition
    );

    // 检查点是否被地球挡住了
    const isVisible = ellipsoidalOccluder.isPointVisible(position);
    if (isVisible) {
      htmlEl.style.display = "block";

      // 使用 transform (性能更好，不触发重排)
      //  transform 只触发 Composite (合成)，利用 GPU 加速，在每秒 60 帧的高频更新下，transform 会让画面更流畅，减少卡顿。
      //  使用 transform，必须固定好元素的初始位置，因为他的移动是相对于初始位置的，必须把元素固定在左上角，才能使用canvasPosition的值
      htmlEl.style.transform = `translate3d(${canvasPosition.x}px, ${canvasPosition.y}px, 0)`;
    } else {
      // 在背面时隐藏
      htmlEl.style.display = "none";
    }
  }
}

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewerInstance = viewer;
  // viewer.scene.preRender.addEventListener 会返回一个用于移除该监听的函数
  removePreRenderListener = viewer.scene.preRender.addEventListener(() => {
    updateOverlayPosition(viewer);
  });
};

// 4. 组件销毁前清理事件，防止内存泄漏和报错
onUnmounted(() => {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    // 移除preRender 事件
    if (removePreRenderListener) {
      removePreRenderListener(); // 执行移除函数
      removePreRenderListener = undefined;
    }

    // 清空引用
    viewerInstance = null;
  }
});
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded"></CesiumViewer>

    <img
      ref="htmlElRef"
      :src="cesiumLogoOverLay"
      alt="cesiumLogoOverLay"
      class="absolute z-10 top-0 left-0 pointer-events-none"
      style="will-change: transform"
    />
  </div>
</template>

<style scoped lang="scss"></style>
