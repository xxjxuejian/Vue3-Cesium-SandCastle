<script setup lang="ts">
// 利用鼠标和键盘 操作相机，熟悉 Cesium 的基本交互方式
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

let scene: Cesium.Scene | null = null;
let canvas: HTMLCanvasElement | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
let removeTickListener: Cesium.Event.RemoveCallback | null = null;

let startMousePosition: Cesium.Cartesian2 | null = null;
let mousePosition: Cesium.Cartesian2 | null = null;

// 定义状态标志位的类型
type MovementFlags = {
  looking: boolean;
  moveForward: boolean;
  moveBackward: boolean;
  moveUp: boolean;
  moveDown: boolean;
  moveLeft: boolean;
  moveRight: boolean;
};
// 控制状态 flags，确定当前是否处于某一种控制状态
const flags: MovementFlags = {
  looking: false,
  moveForward: false,
  moveBackward: false,
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,
};

const keyCodeMap: Record<string, keyof MovementFlags> = {
  KeyW: "moveForward",
  KeyS: "moveBackward",
  KeyQ: "moveUp",
  KeyE: "moveDown",
  KeyD: "moveRight",
  KeyA: "moveLeft",
};
/*
 --- 事件处理函数 ---
 按键按下时，根据按键的值，设置 flags 对应的标志位为 true
*/
const handleKeyDown = (e: KeyboardEvent) => {
  const flagName = keyCodeMap[e.code];
  if (flagName) {
    flags[flagName] = true;
  }
};
// 按键抬起时，根据按键的值，设置 flags 对应的标志位为 false
const handleKeyUp = (e: KeyboardEvent) => {
  const flagName = keyCodeMap[e.code];
  if (flagName) {
    flags[flagName] = false;
  }
};

// 获取 canvas 获取焦点
const handleCanvasClick = () => {
  if (canvas) {
    canvas.focus();
  }
};

function initCesium(viewer: Cesium.Viewer) {
  scene = viewer.scene;
  canvas = viewer.canvas;

  // 让 canvas 变成可聚焦元素。获取焦点，接受键盘输入
  canvas.setAttribute("tabindex", "0"); // needed to put focus on the canvas
  canvas.addEventListener("click", handleCanvasClick);
  // 获取地球椭球体
  const ellipsoid = scene.globe.ellipsoid;

  // 关闭 Cesium 默认相机控制：现在要自己实现 第一人称控制。
  scene.screenSpaceCameraController.enableRotate = false;
  scene.screenSpaceCameraController.enableTranslate = false;
  scene.screenSpaceCameraController.enableZoom = false;
  scene.screenSpaceCameraController.enableTilt = false;
  scene.screenSpaceCameraController.enableLook = false;

  handler = new Cesium.ScreenSpaceEventHandler(canvas);
  handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
    flags.looking = true;
    // 修复原代码问题：屏幕坐标应该是 Cartesian2，而不是 Cartesian3
    mousePosition = Cesium.Cartesian2.clone(movement.position);
    startMousePosition = Cesium.Cartesian2.clone(movement.position);
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
    if (flags.looking) {
      mousePosition = movement.endPosition;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    flags.looking = false;
  }, Cesium.ScreenSpaceEventType.LEFT_UP);

  // 4. 注册时钟 Tick 事件
  removeTickListener = viewer.clock.onTick.addEventListener(() => {
    const camera = viewer!.camera;

    // 处理视角旋转
    if (flags.looking && startMousePosition && mousePosition) {
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;

      const x = (mousePosition.x - startMousePosition.x) / width;
      const y = -(mousePosition.y - startMousePosition.y) / height;

      const lookFactor = 0.05;
      camera.lookRight(x * lookFactor);
      camera.lookUp(y * lookFactor);
    }

    // 处理移动
    const cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
    const moveRate = Math.max(cameraHeight / 100.0, 0.1); // 添加一个最小移动速度以防贴地无法移动

    if (flags.moveForward) camera.moveForward(moveRate);
    if (flags.moveBackward) camera.moveBackward(moveRate);
    if (flags.moveUp) camera.moveUp(moveRate);
    if (flags.moveDown) camera.moveDown(moveRate);
    if (flags.moveLeft) camera.moveLeft(moveRate);
    if (flags.moveRight) camera.moveRight(moveRate);
  });
}

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  initCesium(viewer);
};

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown, false);
  document.addEventListener("keyup", handleKeyUp, false);
});

onBeforeUnmount(() => {
  // 1. 移除 DOM 事件监听，防止内存泄漏
  document.removeEventListener("keydown", handleKeyDown, false);
  document.removeEventListener("keyup", handleKeyUp, false);

  if (canvas) {
    canvas.removeEventListener("click", handleCanvasClick);

    // 2. 移除 Tick 监听器
    if (removeTickListener) {
      removeTickListener();
    }

    // 3. 销毁 handler 和 viewer
    if (handler) {
      handler.destroy();
    }
  }
});
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt z-10 bg-[#1f2023] rounded-lg text-white p-4 flex flex-col gap-2">
      <div>Click on the Cesium display to start.</div>
      <div>w/s - move forward/backward</div>
      <div>a/d - move left/right</div>
      <div>q/e - move up/down</div>
      <div>left mouse button down plus mouse move changes the look direction</div>
    </div>
    <CesiumViewer @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
