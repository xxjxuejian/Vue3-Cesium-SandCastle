<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import cesiumLogoOverLay from "@/assets/images/Cesium_Logo_overlay.png";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  // 如果设置为 true，只有在场景发生变化、确实需要时才会渲染一帧。
  // 启用该模式可以降低应用的 CPU / GPU 使用率，并减少移动设备的电量消耗；但在这种模式下，必须显式调用 Scene#requestRender 才会渲染新的帧。
  // 在使用 API 的其他部分对场景进行修改后，很多情况下都需要这样做。详见 《通过显式渲染提升性能（Improving Performance with Explicit Rendering）》。
  // 默认为false, 大概每秒渲染60帧左右
  // requestRenderMode: true,
};

const htmlElRef = ref<HTMLImageElement>();
let removePreRenderListener: Cesium.Event.RemoveCallback | null = null; // 用于存储移除事件的函数
let viewerInstance: Cesium.Viewer | null = null; // 暂存 viewer 实例
const isExpandTips = ref(false);
// 动态计算容器的 Class
const tipsContainerClasses = computed(() => {
  return isExpandTips.value
    ? "w-[350px] h-auto" // 展开时的尺寸
    : "w-8 h-8"; // 收起时的尺寸 (形成一个小方块按钮)
});

/* 
1. 既然经纬度（-75.59, 40.03）是不变的，为什么要每次都重新计算？
  首先，这个DOM元素就是要放置在经纬度：-75.59777, 40.03883位置处的。
  但是，对于我们用户来说，是在一个二维的屏幕上看到这个元素的，而且地球转动/缩放等等，这个元素需要 和地球一起转动。
  这就需要我们每次都计算这个经纬度，对应的画布坐标，然后在每一帧中把 这个元素放置在画布的指定位置，相当于每次都是把元素重新放置在屏幕上的一个位置，
  这样看起来，他就可以随着地球一起转动。
  viewer.scene.cartesianToCanvasCoordinates 这个函数的作用，就是把 3D空间里的坐标 转换成 2D屏幕上的像素坐标 (x, y)。
  当你拖动地图、缩放或旋转地球时，虽然那个点还在地球的同一个地方，但它相对于你屏幕左上角的位置（像素值）发生了变化。
  如果你不重新计算，这个 HTML 元素就会“死”在屏幕的某一个位置不动，看起来就像贴在显示器表面的贴纸，而不是贴在地球表面。

2. preRender 事件在什么情况下被触发？
  Cesium 是一个基于 WebGL 的 3D 渲染引擎，它的工作机制和 3D 游戏非常像，都是基于 渲染循环（Render Loop）的。
  触发频率：非常高。通常情况下，为了达到流畅的视觉效果，Cesium 会尝试每秒渲染 60 帧（60 FPS）。这意味着 preRender 每秒钟会被触发约 60 次。
  触发时机：顾名思义，preRender（渲染前）是在 Cesium 准备绘制下一帧画面 之前 的一瞬间触发的。

3. 为什么要给 preRender 添加事件来实现？
  结合上面两点，我们需要一个机制来保证：只要地球动了，HTML 元素的位置就要跟着动。
  由于我们不知道用户什么时候会拖动地图，最简单粗暴且有效的方法就是：每一帧都重新计算位置。

流程如下：
  1.这一帧开始。
  2.触发 preRender：
      代码算出该经纬度当前对应屏幕上的哪一个像素点 (x, y)。
      代码修改 HTML 的 top 和 left 样式。
  3.Cesium 渲染画面：绘制地球和 3D 模型。
  4.结果：用户看到的画面中，HTML 元素正好盖在了地球上对应的位置，肉眼感觉它就是“长”在地图上的
*/

//，频繁创建对象（new Object）是有代价的，尤其是在 preRender 这种每秒执行 60 次的高频循环中。
// suoyi
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

      // C. 设置位置
      // 方式一：使用 top/left (你原本的方式)
      // 修改 top/left 会触发浏览器的 Layout (重排)，浏览器需要重新计算页面布局。
      htmlEl.style.top = `${canvasPosition.y}px`;
      htmlEl.style.left = `${canvasPosition.x}px`;
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

const handleToggleTips = () => {
  isExpandTips.value = !isExpandTips.value;
};

// 4. 组件销毁前清理事件，防止内存泄漏和报错
onUnmounted(() => {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    // 移除preRender 事件
    if (removePreRenderListener) {
      removePreRenderListener(); // 执行移除函数
      removePreRenderListener = null;
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
      class="absolute z-10 top-0 left-0"
    />

    <!-- tips: -->
    <div
      class="absolute-lt z-10 bg-[#1f2023] p-2 text-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg rounded-md"
      :class="tipsContainerClasses"
    >
      <!-- 情况A：收起状态 (只显示向右的箭头) -->
      <div v-show="!isExpandTips" class="flex-center">
        <el-icon class="cursor-pointer" :size="20" @click="handleToggleTips">
          <CaretRight />
        </el-icon>
      </div>

      <!-- 情况B：展开状态 (显示完整内容) -->
      <div v-show="isExpandTips">
        <div class="flex-x-between">
          <span class="font-bold">Tips:</span>
          <el-icon class="cursor-pointer" :size="20" @click="handleToggleTips">
            <CaretLeft />
          </el-icon>
        </div>

        <el-scrollbar max-height="300">
          <div class="content">
            <p>实现HTML元素跟随地图上的某个地理位置移动</p>
            <p>
              利用scene.preRender事件，通常情况下，为了达到流畅的视觉效果，Cesium 会尝试每秒渲染 60
              帧（60 FPS）。这意味着 preRender 每秒钟会被触发约 60 次。
            </p>

            <ul>
              <li>流程如下：</li>
              <li>1.这一帧开始。</li>
              <li>2.触发 preRender：</li>
              <li>3.Cesium 渲染画面：绘制地球和3D模型。</li>
              <li>
                4.结果：用户看到的画面中，HTML
                元素正好盖在了地球上对应的位置，肉眼感觉它就是“长”在地图上的
              </li>
            </ul>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
