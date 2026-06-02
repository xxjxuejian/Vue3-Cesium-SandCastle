<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import {
  filterPointsByCameraHeight,
  generateSimulatedPoints,
  type SimulatedPoint,
} from "./pointData";
import { createPointRenderer, type PointRenderer, type RenderMode } from "./pointRenderers";

interface RenderStats {
  totalCount: number;
  renderedCount: number;
  loadTime: number;
  fps: number;
  sampleStep: number;
  filterDescription: string;
  strategyDescription: string;
}

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  navigationHelpButton: false,
  requestRenderMode: true,
  maximumRenderTimeChange: Number.POSITIVE_INFINITY,
};

const countOptions = [5_000, 20_000, 50_000, 100_000];
const modeOptions: Array<{ label: string; value: RenderMode }> = [
  { label: "Entity 基准", value: "entity" },
  { label: "PointPrimitive 优化", value: "pointPrimitive" },
  { label: "Billboard 图标", value: "billboard" },
];

const controls = reactive({
  pointCount: 20_000,
  renderMode: "pointPrimitive" as RenderMode,
  useDistanceFilter: true,
  useBatchLoading: true,
  useRequestRenderMode: true,
  useResolutionScale: true,
  resolutionScale: 0.75,
  batchSize: 2_000,
});

const stats = reactive<RenderStats>({
  totalCount: 0,
  renderedCount: 0,
  loadTime: 0,
  fps: 0,
  sampleStep: 1,
  filterDescription: "等待地图加载。",
  strategyDescription: "等待选择渲染策略。",
});

const isRendering = ref(false);
const progressText = ref("等待地图加载");

let viewerInstance: Cesium.Viewer | null = null;
let points: SimulatedPoint[] = [];
let renderer: PointRenderer | null = null;
let renderAbortController: AbortController | null = null;
let removeCameraListener: Cesium.Event.RemoveCallback | undefined;
let removePostRenderListener: Cesium.Event.RemoveCallback | undefined;
let rerenderTimer: number | undefined;
let frameCount = 0;
let fpsStartTime = 0;

const currentModeName = computed(() => {
  return modeOptions.find((item) => item.value === controls.renderMode)?.label ?? "未知策略";
});

const optimizationSummary = computed(() => {
  const items = [
    controls.useRequestRenderMode ? "显式渲染" : "连续渲染",
    controls.useBatchLoading ? "分批加载" : "一次性加载",
    controls.useDistanceFilter ? "视距抽样" : "不过滤",
    controls.useResolutionScale ? `分辨率 ${controls.resolutionScale}` : "原始分辨率",
  ];

  return items.join(" / ");
});

function requestSceneRender() {
  viewerInstance?.scene.requestRender();
}

function applyViewerPerformanceOptions() {
  if (!viewerInstance) return;

  const sceneWithRequestMode = viewerInstance.scene as Cesium.Scene & {
    requestRenderMode: boolean;
  };

  sceneWithRequestMode.requestRenderMode = controls.useRequestRenderMode;
  viewerInstance.resolutionScale = controls.useResolutionScale ? controls.resolutionScale : 1;
  requestSceneRender();
}

function rebuildData() {
  const seed = controls.pointCount + Date.now();
  points = generateSimulatedPoints({
    count: controls.pointCount,
    seed,
  });
  stats.totalCount = points.length;
}

function getVisiblePoints() {
  if (!viewerInstance) {
    return {
      points: [] as SimulatedPoint[],
      sampleStep: 1,
      description: "Viewer 未就绪。",
    };
  }

  const cameraHeight = viewerInstance.camera.positionCartographic.height;
  return filterPointsByCameraHeight(points, cameraHeight, controls.useDistanceFilter);
}

function resetRenderer(mode: RenderMode) {
  renderer?.clear();
  renderer = viewerInstance ? createPointRenderer(mode, viewerInstance) : null;
  stats.strategyDescription = renderer?.description ?? "Viewer 未就绪。";
}

function cancelCurrentRender() {
  renderAbortController?.abort();
  renderAbortController = null;
}

async function renderPoints() {
  if (!viewerInstance) return;

  cancelCurrentRender();
  applyViewerPerformanceOptions();

  if (!points.length || points.length !== controls.pointCount) {
    rebuildData();
  }

  if (!renderer) {
    resetRenderer(controls.renderMode);
  }

  if (!renderer) return;

  const visibleResult = getVisiblePoints();
  const abortController = new AbortController();
  renderAbortController = abortController;
  isRendering.value = true;
  stats.renderedCount = 0;
  stats.sampleStep = visibleResult.sampleStep;
  stats.filterDescription = visibleResult.description;
  stats.strategyDescription = renderer.description;
  progressText.value = "开始渲染";

  try {
    const result = await renderer.render(visibleResult.points, {
      batchSize: controls.batchSize,
      useBatchLoading: controls.useBatchLoading,
      signal: abortController.signal,
      onProgress: (renderedCount) => {
        stats.renderedCount = renderedCount;
        progressText.value = `已绘制 ${renderedCount.toLocaleString()} / ${visibleResult.points.length.toLocaleString()}`;
        requestSceneRender();
      },
    });

    stats.renderedCount = result.renderedCount;
    stats.loadTime = result.duration;
    progressText.value = `完成：${result.renderedCount.toLocaleString()} 个点`;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("点位渲染失败", error);
      progressText.value = "渲染失败，请查看控制台。";
    }
  } finally {
    if (renderAbortController === abortController) {
      renderAbortController = null;
      isRendering.value = false;
    }

    requestSceneRender();
  }
}

function scheduleRerender() {
  if (!viewerInstance || isRendering.value) return;

  if (rerenderTimer) {
    window.clearTimeout(rerenderTimer);
  }

  rerenderTimer = window.setTimeout(() => {
    rerenderTimer = undefined;
    renderPoints();
  }, 180);
}

function handleRebuildData() {
  rebuildData();
  renderPoints();
}

function handleClearPoints() {
  cancelCurrentRender();
  renderer?.clear();
  stats.renderedCount = 0;
  stats.loadTime = 0;
  progressText.value = "已清空点位";
  requestSceneRender();
}

function setupFpsCounter(viewer: Cesium.Viewer) {
  frameCount = 0;
  fpsStartTime = performance.now();

  removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
    frameCount += 1;
    const now = performance.now();
    const elapsed = now - fpsStartTime;

    if (elapsed >= 1_000) {
      stats.fps = Math.round((frameCount * 1_000) / elapsed);
      frameCount = 0;
      fpsStartTime = now;
    }
  });
}

function setupCameraDistanceFilter(viewer: Cesium.Viewer) {
  removeCameraListener = viewer.camera.moveEnd.addEventListener(() => {
    if (controls.useDistanceFilter) {
      scheduleRerender();
    }
  });
}

function handleMapLoaded(viewer: Cesium.Viewer) {
  viewerInstance = viewer;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(119.25, 31.1, 1_700_000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-65),
      roll: 0,
    },
  });

  applyViewerPerformanceOptions();
  setupFpsCounter(viewer);
  setupCameraDistanceFilter(viewer);
  rebuildData();
  resetRenderer(controls.renderMode);
  renderPoints();
}

watch(
  () => controls.renderMode,
  () => {
    resetRenderer(controls.renderMode);
    renderPoints();
  }
);

watch(
  () => controls.pointCount,
  () => {
    rebuildData();
    renderPoints();
  }
);

watch(
  () => [
    controls.useDistanceFilter,
    controls.useBatchLoading,
    controls.useRequestRenderMode,
    controls.useResolutionScale,
    controls.resolutionScale,
    controls.batchSize,
  ],
  () => {
    renderPoints();
  }
);

onUnmounted(() => {
  cancelCurrentRender();

  if (rerenderTimer) {
    window.clearTimeout(rerenderTimer);
    rerenderTimer = undefined;
  }

  removeCameraListener?.();
  removeCameraListener = undefined;
  removePostRenderListener?.();
  removePostRenderListener = undefined;
  renderer?.clear();
  renderer = null;
  viewerInstance = null;
  points = [];
});
</script>

<template>
  <div class="performance-page">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />

    <aside class="performance-panel">
      <div class="panel-header">
        <span class="panel-title">海量点位性能优化</span>
        <el-tag size="small" type="success">{{ currentModeName }}</el-tag>
      </div>

      <div class="control-block">
        <div class="control-label">点位数量</div>
        <el-segmented
          v-model="controls.pointCount"
          :options="countOptions"
          :disabled="isRendering"
        />
      </div>

      <div class="control-block">
        <div class="control-label">渲染模式</div>
        <el-radio-group v-model="controls.renderMode" :disabled="isRendering">
          <el-radio-button v-for="mode in modeOptions" :key="mode.value" :label="mode.value">
            {{ mode.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="control-block compact">
        <el-checkbox v-model="controls.useDistanceFilter">根据相机高度做视距抽样</el-checkbox>
        <el-checkbox v-model="controls.useBatchLoading">分批加载点位，减少主线程长任务</el-checkbox>
        <el-checkbox v-model="controls.useRequestRenderMode">
          启用 requestRenderMode 显式渲染
        </el-checkbox>
        <el-checkbox v-model="controls.useResolutionScale">降低 WebGL 渲染分辨率</el-checkbox>
      </div>

      <div class="control-block">
        <div class="control-label">分辨率缩放</div>
        <el-slider
          v-model="controls.resolutionScale"
          :disabled="!controls.useResolutionScale"
          :min="0.4"
          :max="1"
          :step="0.05"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </div>

      <div class="control-block">
        <div class="control-label">分批大小</div>
        <el-slider
          v-model="controls.batchSize"
          :disabled="!controls.useBatchLoading"
          :min="500"
          :max="5000"
          :step="500"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </div>

      <div class="button-row">
        <el-button type="primary" :loading="isRendering" @click="renderPoints">重新渲染</el-button>
        <el-button :disabled="isRendering" @click="handleRebuildData">一键重建数据</el-button>
        <el-button :disabled="isRendering" @click="handleClearPoints">清空点位</el-button>
      </div>

      <div class="stats-grid">
        <div>
          <span>总点位</span>
          <strong>{{ stats.totalCount.toLocaleString() }}</strong>
        </div>
        <div>
          <span>实际绘制</span>
          <strong>{{ stats.renderedCount.toLocaleString() }}</strong>
        </div>
        <div>
          <span>加载耗时</span>
          <strong>{{ stats.loadTime.toFixed(0) }} ms</strong>
        </div>
        <div>
          <span>估算 FPS</span>
          <strong>{{ stats.fps }}</strong>
        </div>
      </div>

      <div class="strategy-box">
        <div>当前组合：{{ optimizationSummary }}</div>
        <div>{{ progressText }}</div>
        <div>{{ stats.filterDescription }}</div>
        <div>{{ stats.strategyDescription }}</div>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.performance-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: #e8edf5;
  background: #0f141c;
}

.performance-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  width: min(460px, calc(100% - 32px));
  max-height: calc(100% - 32px);
  padding: 14px;
  overflow: auto;
  background: rgb(15 20 28 / 92%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 28%);
}

.panel-header,
.button-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.panel-header {
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
}

.control-block {
  margin-top: 12px;
}

.control-block.compact {
  display: grid;
  gap: 4px;
}

.control-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: #aeb8c7;
}

.button-row {
  flex-wrap: wrap;
  margin-top: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.stats-grid > div {
  padding: 8px 10px;
  background: rgb(255 255 255 / 7%);
  border-radius: 6px;
}

.stats-grid span,
.strategy-box {
  font-size: 12px;
  color: #aeb8c7;
}

.stats-grid strong {
  display: block;
  margin-top: 3px;
  font-size: 17px;
  color: #fff;
}

.strategy-box {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  line-height: 1.5;
}

:deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
  color: #d8dee9;
}

:deep(.el-radio-button__inner),
:deep(.el-segmented) {
  max-width: 100%;
}

@media (width <= 720px) {
  .performance-panel {
    top: 10px;
    left: 10px;
    width: calc(100% - 20px);
    max-height: 58%;
  }
}
</style>
