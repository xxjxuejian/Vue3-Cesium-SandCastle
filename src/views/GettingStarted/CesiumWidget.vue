<script setup lang="ts">
import * as Cesium from "cesium";

import { useTips } from "@/hooks/useTips";
import { useCesiumWidget } from "@/hooks/useCesiumWidget";

const mapRef = ref<HTMLDivElement>();
const mapConfig = {
  shouldAnimate: true,
};

/*
    CesiumWidget 是 Cesium 的“核心渲染内核 + 场景管理”，但不包含任何 UI 控件。
    Cesium.CesiumWidget 与 Cesium.Viewer 类似，但功能更精简。
    它只是一个用于显示 3D 地球的组件；
    不包含动画、影像选择等其他控件，
    也不依赖第三方的 Knockout 库。
*/

const { widget } = useCesiumWidget(mapRef, mapConfig);
const { isExpandTips, tipsContainerClasses, toggleTips } = useTips();

/**
 *  加载模型
 */
function loadModel(v: Cesium.CesiumWidget | Cesium.Viewer) {
  // 以 position 为原点的 ENU 坐标系
  const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 500);
  // 创建 ENU 旋转,模型自身的坐标系, E:East(X轴), N:North (Y轴), U:Up(Z轴)
  // heading ，模型的朝向，0度朝北，90度朝东，顺时针旋转，调整heading，相当于模型绕Z轴旋转，也就是U轴旋转
  const heading = Cesium.Math.toRadians(135);
  // pitch ，模型的俯仰角，0度平视，90度。调整pitch，相当于模型绕East（X）轴旋转
  const pitch = Cesium.Math.toRadians(0);
  // roll ，模型的偏航角，0度，90度 绕 North（Y）轴旋转
  const roll = Cesium.Math.toRadians(0);
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  // Cesium 先在 position 处建立一个 ENU 局部坐标系
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  const entity = v.entities.add({
    // 实体的位置
    position,
    // 实体的旋转
    orientation: orientation,
    model: {
      uri: "/SampleData/models/CesiumAir/Cesium_Air.glb",
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });
  v.trackedEntity = entity;
}

watch(widget, (widget) => {
  if (!widget) return;
  loadModel(widget);
});
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <div ref="mapRef" class="wh-full"></div>

    <div
      class="absolute-lt z-10 bg-[#1f2023] p-2 text-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg rounded-md"
      :class="tipsContainerClasses"
    >
      <!-- 情况A：收起状态 (只显示向右的箭头) -->
      <div v-show="!isExpandTips" class="flex-center">
        <el-icon class="cursor-pointer" :size="20" @click="toggleTips">
          <CaretRight />
        </el-icon>
      </div>

      <!-- 情况B：展开状态 (显示完整内容) -->
      <div v-show="isExpandTips">
        <div class="flex-x-between">
          <span class="font-bold">Tips:</span>
          <el-icon class="cursor-pointer" :size="20" @click="toggleTips">
            <CaretLeft />
          </el-icon>
        </div>

        <el-scrollbar max-height="300">
          <div class="content">
            <p>CesiumWidget 创建了一个基础的3D地球组件</p>
            <p>
              它是Cesium最基础的“裸机”版本。它只提供一个3D
              画布（Canvas），不包含任何自带的用户界面UI控件。
            </p>
            <p>通常我们用 Cesium.Viewer，但在以下场景你会选择用 CesiumWidget：</p>
            <p>
              1. 需要自定义I时:不需要Timeline、Animation、Geocoder等UI时因为它不会加载那些多余的 DOM
              元素。
            </p>
            <p>
              2. 集成到其他框架时：当你把 Cesium 集成到 React、Vue 或 Angular 项目中， 避免 Cesium
              内部的 Knockout.js（Viewer 依赖的 MVVM
              库）与现代前端框架的状态管理发生冲突，使用更底层的 CesiumWidget 往往更干净、性能更好。
            </p>
            <p>
              3.
              轻量级展示：如果你只需要在页面的一个小角落展示一个旋转的地球，不需要任何交互工具，用
              CesiumWidget 更轻量。
            </p>
            <p>
              目前90%以上的Vue/React + Cesium 项目，都是直接使用的 Cesium.Viewer。 CesiumWidget
              是给写游戏引擎的人或者写 Cesium 插件的大神用的；Cesium.Viewer 是给我们做 GIS
              应用开发的普通人用的。
            </p>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
