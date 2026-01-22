<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

/* 
  希望两个视图在时间上保持同步，所以创建了一个共享的时钟对象，让它们一起用
  时间状态完全一致：包括：当前时间（currentTime）、在不在播放（shouldAnimate）、播放速度（multiplier）起止时间范围
 
*/
const clockViewModel = new Cesium.ClockViewModel();
const viewer3D = shallowRef<Cesium.Viewer>();
const viewer2D = shallowRef<Cesium.Viewer>();
// 3D Viewer 配置
const options3D: Cesium.Viewer.ConstructorOptions = {
  timeline: true,
  fullscreenButton: false, // 关闭全屏按钮
  sceneModePicker: false, // 关闭 2D/3D 模式切换按钮
  clockViewModel: clockViewModel, // 使用共享的 clock
};
// 2D Viewer 配置
const options2D: Cesium.Viewer.ConstructorOptions = {
  timeline: true,
  homeButton: false,
  fullscreenButton: false,
  sceneModePicker: false,
  clockViewModel: clockViewModel, // 使用共享的 clock
  infoBox: false,
  geocoder: false,
  sceneMode: Cesium.SceneMode.SCENE2D, // 初始视角类型: 强制 2D
  navigationHelpButton: false,
  animation: false,
};

let worldPosition: any;
let distance;

const handle3DMapLoaded = (viewer: Cesium.Viewer) => {
  viewer3D.value = viewer;
  // 每当3D 视图相机位置改变时触发 同步函数
  viewer3D.value.camera.changed.addEventListener(sync2DView);
  // By default, the `camera.changed` event will trigger when the camera has changed by 50%
  // To make it more sensitive, we can bring down this sensitivity
  // 提高灵敏度，默认情况下，camera.changed 事件，只有在 camera 变化 50% 才触发，为了更加敏感，我们可以提高其敏感度
  viewer3D.value.camera.percentageChanged = 0.01;
  const viewCenter = new Cesium.Cartesian2(
    Math.floor(viewer3D.value.canvas.clientWidth / 2),
    Math.floor(viewer3D.value.canvas.clientHeight / 2)
  );
  console.log(
    "x,y",
    viewer3D.value.canvas.clientWidth,
    viewer3D.value.canvas.clientHeight,
    viewCenter
  );
};
const handle2DMapLoaded = (viewer: Cesium.Viewer) => {
  viewer2D.value = viewer;
  // 禁用 2D 视图的一切操作：由于2D 视图跟随 3D 视图，3D 视图是主导视图，所以禁用2D 视图一切操作
  viewer2D.value.scene.screenSpaceCameraController.enableRotate = false;
  viewer2D.value.scene.screenSpaceCameraController.enableTranslate = false;
  viewer2D.value.scene.screenSpaceCameraController.enableZoom = false;
  viewer2D.value.scene.screenSpaceCameraController.enableTilt = false;
  viewer2D.value.scene.screenSpaceCameraController.enableLook = false;
};

// 2D 视图跟随 3D 视图, 3D 是主导
/* 
    看的是同一个地理位置
    缩放程度看起来一致
    以 3D 为主，2D 被动跟随
*/

function sync2DView() {
  if (!viewer3D.value || !viewer2D.value) return;
  // 计算 3D 视图的“屏幕中心”,找到 3D canvas 的正中心像素
  const viewCenter = new Cesium.Cartesian2(
    Math.floor(viewer3D.value.canvas.clientWidth / 2),
    Math.floor(viewer3D.value.canvas.clientHeight / 2)
  );
  // Given the pixel in the center, get the world position
  const newWorldPosition = viewer3D.value.scene.camera.pickEllipsoid(viewCenter);
  if (Cesium.defined(newWorldPosition)) {
    // Guard against the case where the center of the screen
    // does not fall on a position on the globe
    worldPosition = newWorldPosition;
  }
  // Get the distance between the world position of the point the camera is focusing on, and the camera's world position
  distance = Cesium.Cartesian3.distance(worldPosition, viewer3D.value.scene.camera.positionWC);
  // Tell the 2D camera to look at the point of focus. The distance controls how zoomed in the 2D view is
  // (try replacing `distance` in the line below with `1e7`. The view will still sync, but will have a constant zoom)
  viewer2D.value.scene.camera.lookAt(worldPosition, new Cesium.Cartesian3(0.0, 0.0, distance));
}
</script>

<template>
  <!-- 3D 视图主导、2D 视图跟随的双视图同步方案 -->
  <div class="wh-full flex">
    <!-- 3D 视图 -->
    <div class="view3D flex-1">
      <CesiumViewer :config="options3D" @map-loaded="handle3DMapLoaded"></CesiumViewer>
    </div>
    <!-- 2D 视图 -->
    <div class="view2D flex-1">
      <CesiumViewer :config="options2D" @map-loaded="handle2DMapLoaded"></CesiumViewer>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
