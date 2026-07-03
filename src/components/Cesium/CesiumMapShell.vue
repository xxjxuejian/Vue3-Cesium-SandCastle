<script setup lang="ts">
import MapToolbar from "./MapToolbar.vue";
import { useCesiumMapTools } from "@/hooks/useCesiumMapTools";
import { useCesium } from "@/hooks/useCesium";
import type {
  BaseLayerType,
  MapFlyToPointOptions,
  MapHomeView,
  MapMarkerAddOptions,
  MapMarkerData,
  MapMarkerEvent,
  MapPoint,
} from "@/core/cesium/map/types";
import type * as Cesium from "cesium";

// 业务页面只需要配置初始化视角、底图，并通过 expose 或事件使用点位能力。
const props = withDefaults(
  defineProps<{
    // 透传给 Cesium Viewer 的初始化配置。
    config?: Cesium.Viewer.ConstructorOptions;
    // 重置视角使用的主页位置。
    homeView: MapHomeView;
    // 初始底图类型。
    defaultBaseLayer?: BaseLayerType;
    // 是否显示右下角通用地图工具栏。
    showToolbar?: boolean;
    // 是否显示地图报警边缘效果。
    alarmActive?: boolean;
  }>(),
  {
    config: () => ({}),
    defaultBaseLayer: "tianditu-vector",
    showToolbar: true,
    alarmActive: false,
  }
);

const emit = defineEmits<{
  "map-loaded": [viewer: Cesium.Viewer];
  ready: [viewer: Cesium.Viewer];
  "marker-click": [event: MapMarkerEvent];
  "marker-hover": [event: MapMarkerEvent];
}>();

const containerId = `cesium-map-shell-${Math.random().toString(36).substring(2, 9)}`;

// 只用 shallowRef 保存 Viewer，避免 Vue 深度代理 Cesium 复杂对象。
const viewerRef = shallowRef<Cesium.Viewer | null>(null);
const { initViewer } = useCesium();

// 通用地图能力入口：相机、图层、测量、点位事件都从这里统一调度。
const mapTools = useCesiumMapTools(viewerRef, {
  homeView: props.homeView,
  defaultBaseLayer: props.defaultBaseLayer,
  tiandituToken: import.meta.env.VITE_TIANDITU_TOKEN,
});

// Viewer 创建完成后初始化工具服务，再向业务层转发 ready/map-loaded。
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  mapTools.initMapTools(viewer);
  mapTools.onMarkerClick((event) => emit("marker-click", event));
  mapTools.onMarkerHover((event) => emit("marker-hover", event));
  emit("map-loaded", viewer);
  emit("ready", viewer);
};

onMounted(() => {
  try {
    const viewer = initViewer(containerId, props.config);
    handleMapLoaded(viewer);
  } catch (error) {
    console.error("Cesium Viewer 初始化失败", error);
  }
});

// 暴露给业务页面的最小地图接口，避免业务层直接操作大量 Cesium 细节。
defineExpose({
  viewer: viewerRef,
  flyToPoint: (point: MapPoint, options?: MapFlyToPointOptions) =>
    mapTools.flyToPoint(point, options),
  addMarker: (markerData: MapMarkerData, options?: MapMarkerAddOptions) =>
    mapTools.addMarker(markerData, options),
  removeMarker: (id: string) => mapTools.removeMarker(id),
  clearMarkers: () => mapTools.clearMarkers(),
  setMarkerGroupVisible: (groupId: string, visible: boolean) =>
    mapTools.setMarkerGroupVisible(groupId, visible),
  onMarkerClick: mapTools.onMarkerClick,
  onMarkerHover: mapTools.onMarkerHover,
});
</script>

<template>
  <div class="cesium-map-shell">
    <div :id="containerId" class="wh-full overflow-hidden relative"></div>
    <div v-show="alarmActive" class="map-alarm-overlay" aria-hidden="true"></div>
    <MapToolbar
      v-if="showToolbar"
      :state="mapTools.state"
      :layer-options="mapTools.layerOptions.value"
      @action="mapTools.handleToolbarAction"
    />
    <slot />
  </div>
</template>

<style scoped>
.cesium-map-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-alarm-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  background:
    linear-gradient(
      90deg,
      rgb(239 68 68 / 52%),
      transparent 13%,
      transparent 87%,
      rgb(239 68 68 / 52%)
    ),
    linear-gradient(
      180deg,
      rgb(239 68 68 / 58%),
      transparent 15%,
      transparent 85%,
      rgb(239 68 68 / 58%)
    );
  border: 1px solid rgb(248 113 113 / 86%);
  box-shadow:
    inset 0 0 26px rgb(248 113 113 / 72%),
    inset 0 0 72px rgb(185 28 28 / 34%),
    0 0 24px rgb(239 68 68 / 34%);
  animation: map-alarm-pulse 1.25s ease-in-out infinite;
}

@keyframes map-alarm-pulse {
  0%,
  100% {
    box-shadow:
      inset 0 0 18px rgb(248 113 113 / 58%),
      inset 0 0 56px rgb(185 28 28 / 28%),
      0 0 18px rgb(239 68 68 / 22%);
    opacity: 0.58;
  }

  50% {
    box-shadow:
      inset 0 0 34px rgb(248 113 113 / 88%),
      inset 0 0 96px rgb(185 28 28 / 42%),
      0 0 34px rgb(239 68 68 / 42%);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-alarm-overlay {
    opacity: 0.82;
    animation: none;
  }
}
</style>
