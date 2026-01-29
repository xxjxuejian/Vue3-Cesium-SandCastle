<script setup lang="ts">
import * as Cesium from "cesium";
import { type Viewer, type Entity } from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import cesiumLogoOverLay from "@/assets/images/Cesium_Logo_overlay.png";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  // terrainProvider: Cesium.createWorldTerrain(),
  selectionIndicator: true,
  infoBox: true,
};

// 用于存储 viewer 实例和 entity 对象，方便销毁
let viewerInstance: Viewer | null = null;
let billboardEntity: Entity | null = null;
const isExpandTips = ref(false); // 提示框的展开状态
// 动态计算容器的 Class
const tipsContainerClasses = computed(() => {
  return isExpandTips.value
    ? "w-[350px] h-auto" // 展开时的尺寸
    : "w-8 h-8"; // 收起时的尺寸 (形成一个小方块按钮)
});

// 使用Billboard 添加一个图标覆盖物
function addOverlays(viewer: Cesium.Viewer) {
  if (!viewer) return;
  billboardEntity = viewer.entities.add({
    // 1. 设置地理坐标 (经度, 纬度, 高度)
    position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
    // 2. 配置广告牌 (Billboard) 属性
    billboard: {
      // 图片地址 (可以是 URL 或 base64 或 导入的资源)
      // image: "/src/assets/images/Cesium_Logo_overlay.png",
      image: cesiumLogoOverLay,
      // 图片尺寸 可选，(单位：像素)
      // width: 64,
      // height: 64,
      // 缩放比例 (可选)
      scale: 1.0,

      // --- 关键配置：贴地与遮挡 ---
      // 垂直原点：BOTTOM 表示图片的底部对准坐标点 (像大头针一样插在地上)
      // CENTER 表示图片的中心对准坐标点
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      // 水平原点：LEFT 居左对准坐标点 (像小地图一样插在左上角)
      // CENTER 居中对准坐标点
      // RIGHT 居右对准坐标点
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,

      // 高度参考：CLAMP_TO_GROUND 确保图标紧贴地形表面
      // 如果没有加载地形，可以用 NONE 或 RELATIVE_TO_GROUND
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,

      // 深度检测：默认开启。
      // 如果你希望图标永远显示在最上层（不被山体遮挡），可以取消注释下面这行：
      // disableDepthTestDistance: Number.POSITIVE_INFINITY,

      // 随距离缩放 (可选)：近大远小
      // 距离 1.5e2(150米) 时缩放 2.0 倍，距离 1.5e7(1500万米) 时缩放 0.5 倍
      // scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
      // 随距离透明度 (可选)
      // translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.0)
    },
    // (可选) 点击图标时弹出的标题和描述 (Cesium 自带的信息框)
    name: "Cesium Logo",
    description: "这是一个原生 Entity 图片",
  });
}

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  addOverlays(viewer);
  // (可选) 飞到该位置查看
  // viewer.flyTo(billboardEntity);
};

const handleToggleTips = () => {
  isExpandTips.value = !isExpandTips.value;
};

// 组件销毁时清理
onBeforeUnmount(() => {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    // 1. 移除实体
    if (billboardEntity) {
      viewerInstance.entities.remove(billboardEntity);
      billboardEntity = null;
    }

    // 2. 如果你有 preRender 事件，必须在这里移除！
    // 如果等到 onUnmounted，Viewer 可能已经被子组件销毁了，这里就会报错
    // removePreRenderListener();
    // 清空引用
    viewerInstance = null;
  }
});
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
    <!-- 注意：这里不需要那个 <img /> 标签了，完全由 Cesium 内部渲染 -->

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
            <p>使用 Cesium 原生 Entity (Billboard) 实现图片覆盖物</p>
            <p>
              相比于之前的 HTML Overlay 方案，这个方案不需要手动计算坐标，不需要监听
              preRender，且自动处理地球背面遮挡（Depth Test）、贴地（Clamp to
              Ground）、随距离缩放/透明度变化。性能最好。
            </p>
            <p>唯一缺点是样式定制问题</p>
            <p>
              只能是一张图或一段字。无法使用 CSS 的圆角、阴影、Flex 布局，也无法嵌入复杂的 HTML
              结构（比如一个表格）。
            </p>
            <p>
              如果你需要图片旁边有一个输入框、一个视频播放器，或者鼠标悬停时复杂的 CSS
              动画，那么原生 Entity 做不到（或者很难做），这时候才应该使用 HTML Overlay 方案。
            </p>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
