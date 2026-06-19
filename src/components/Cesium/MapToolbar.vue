<script setup lang="ts">
import {
  Crop,
  Delete,
  MapLocation,
  Operation,
  RefreshRight,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import type {
  BaseLayerType,
  MapToolState,
  MapToolbarAction,
} from "@/core/cesium/map/types";

interface LayerOption {
  label: string;
  value: BaseLayerType;
}

// 纯 UI 工具栏：只展示状态并向外发出地图操作意图，不直接依赖 Cesium Viewer。
defineProps<{
  // 当前工具状态，用于控制图层禁用项、测量激活态和清除按钮状态。
  state: MapToolState;
  // 可切换底图列表，具体图层创建由上层地图工具服务处理。
  layerOptions: LayerOption[];
}>();

const emit = defineEmits<{
  action: [action: MapToolbarAction, payload?: unknown];
}>();

// 将按钮点击统一转换为 action，保持 toolbar 与地图实现解耦。
const emitAction = (action: MapToolbarAction, payload?: unknown) => {
  emit("action", action, payload);
};

// Element Plus 下拉菜单 command 只关心选中的底图类型。
const handleLayerCommand = (value: BaseLayerType) => {
  emitAction("switch-layer", value);
};
</script>

<template>
  <div class="map-toolbar">
    <el-tooltip content="放大" placement="left">
      <el-button :icon="ZoomIn" circle @click="emitAction('zoom-in')" />
    </el-tooltip>

    <el-tooltip content="缩小" placement="left">
      <el-button :icon="ZoomOut" circle @click="emitAction('zoom-out')" />
    </el-tooltip>

    <el-tooltip content="重置视角" placement="left">
      <el-button :icon="RefreshRight" circle @click="emitAction('reset')" />
    </el-tooltip>

    <el-dropdown trigger="click" placement="left" @command="handleLayerCommand">
      <el-button :icon="MapLocation" circle />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item in layerOptions"
            :key="item.value"
            :command="item.value"
            :disabled="item.value === state.currentBaseLayer"
          >
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-tooltip content="测量距离" placement="left">
      <el-button
        :class="{ 'is-active-tool': state.activeMeasureMode === 'distance' }"
        :icon="Operation"
        circle
        @click="emitAction('measure-distance')"
      />
    </el-tooltip>

    <el-tooltip content="测量面积" placement="left">
      <el-button
        :class="{ 'is-active-tool': state.activeMeasureMode === 'area' }"
        :icon="Crop"
        circle
        @click="emitAction('measure-area')"
      />
    </el-tooltip>

    <el-tooltip content="清除测量" placement="left">
      <el-button
        :disabled="!state.hasMeasureResult && !state.activeMeasureMode"
        :icon="Delete"
        circle
        @click="emitAction('clear-measure')"
      />
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.map-toolbar {
  position: absolute;
  right: 20px;
  bottom: 28px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgb(255 255 255 / 92%);
  border: 1px solid rgb(31 41 55 / 12%);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgb(15 23 42 / 16%);

  :deep(.el-button) {
    margin-left: 0;
  }
}

.is-active-tool {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}
</style>
