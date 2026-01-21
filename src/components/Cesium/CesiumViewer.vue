<script setup lang="ts">
import { onMounted } from "vue";
import { useCesium } from "@/hooks/useCesium";
import type * as Cesium from "cesium";

// 定义 Props，允许父组件传入 ID 和 配置
const props = withDefaults(
  defineProps<{
    config?: Cesium.Viewer.ConstructorOptions;
  }>(),
  {
    config: () => ({}),
  }
);

// 生成一个唯一的 ID，防止路由切换时 ID 冲突
const containerId = `cesium-container-${Math.random().toString(36).substring(2, 9)}`;

const { viewer, initViewer } = useCesium();

// 向外暴露 viewer 实例，以便父组件可以操作地图
defineExpose({
  viewer,
});

const emit = defineEmits(["map-loaded"]);

onMounted(() => {
  const v = initViewer(containerId, props.config);
  // 通知父组件地图加载完毕，可以开始添加 Entity 或 Primitives 了
  emit("map-loaded", v);
});
</script>

<template>
  <div :id="containerId" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
