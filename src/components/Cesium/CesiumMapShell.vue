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

// 业务页面只需要配置初始视角/底图，并通过 expose 或事件使用点位能力。
const props = withDefaults(
  defineProps<{
    // 透传给 CesiumViewer 的初始化配置。
    config?: Cesium.Viewer.ConstructorOptions;
    // 重置视角使用的主页位置。
    homeView: MapHomeView;
    // 初始底图类型。
    defaultBaseLayer?: BaseLayerType;
    // 是否显示右下角通用地图工具栏。
    showToolbar?: boolean;
  }>(),
  {
    config: () => ({}),
    defaultBaseLayer: "tianditu-vector",
    showToolbar: true,
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
  // 点击实体marker,回调逻辑是什么，直接把这个回调传递过去，
  // 回调的执行，是在底层
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
</style>
