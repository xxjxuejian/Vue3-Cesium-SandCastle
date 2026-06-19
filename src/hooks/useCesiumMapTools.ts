import { computed, onBeforeUnmount, reactive, shallowRef, type ShallowRef } from "vue";
import type * as Cesium from "cesium";
import { MapCameraService } from "@/core/cesium/map/MapCameraService";
import { MapLayerService } from "@/core/cesium/map/MapLayerService";
import { MapMarkerService } from "@/core/cesium/map/MapMarkerService";
import { MapMeasureService } from "@/core/cesium/map/MapMeasureService";
import type {
  BaseLayerType,
  MapFlyToPointOptions,
  MapHomeView,
  MapMarkerData,
  MapMarkerEvent,
  MapPoint,
  MapToolState,
  MapToolbarAction,
} from "@/core/cesium/map/types";

interface UseCesiumMapToolsOptions {
  // 地图重置视角的目标位置。
  homeView: MapHomeView;
  // 初始化时加载的底图。
  defaultBaseLayer: BaseLayerType;
  // 天地图 token，缺失时图层服务会给出提示并跳过加载。
  tiandituToken?: string;
}

// 聚合 Cesium 通用能力，作为 UI action 与底层 service 之间的调度层。
export function useCesiumMapTools(
  viewerRef: ShallowRef<Cesium.Viewer | null>,
  options: UseCesiumMapToolsOptions
) {
  // 各 service 分别管理单一能力，便于后续替换或扩展。
  const cameraService = shallowRef<MapCameraService | null>(null);
  const layerService = shallowRef<MapLayerService | null>(null);
  const measureService = shallowRef<MapMeasureService | null>(null);
  const markerService = shallowRef<MapMarkerService | null>(null);

  // toolbar 只读取这份状态，不直接读取 Cesium 对象。
  const state = reactive<MapToolState>({
    currentBaseLayer: options.defaultBaseLayer,
    activeMeasureMode: null,
    hasMeasureResult: false,
  });

  // 当前第一版只提供天地图矢量和影像两种底图。
  const layerOptions = computed(() => [
    { label: "天地图矢量", value: "tianditu-vector" as const },
    { label: "天地图影像", value: "tianditu-image" as const },
  ]);

  // Viewer ready 后初始化所有地图服务，并应用默认清晰度、底图和视角。
  const initMapTools = (viewer: Cesium.Viewer) => {
    viewerRef.value = viewer;

    cameraService.value = new MapCameraService(viewer, options.homeView);
    layerService.value = new MapLayerService(
      viewer,
      options.tiandituToken,
      options.defaultBaseLayer
    );
    measureService.value = new MapMeasureService(viewer);
    markerService.value = new MapMarkerService(viewer);

    measureService.value.setChangeHandler((measureState) => {
      state.activeMeasureMode = measureState.activeMode;
      state.hasMeasureResult = measureState.hasResult;
    });

    improveMapClarity(viewer);
    layerService.value.switchBaseLayer(options.defaultBaseLayer);
    cameraService.value.resetView(0);
  };

  // 统一处理 toolbar 发出的操作意图，避免 UI 组件直接调用 service。
  const handleToolbarAction = (action: MapToolbarAction, payload?: unknown) => {
    if (action === "zoom-in") cameraService.value?.zoomIn();
    if (action === "zoom-out") cameraService.value?.zoomOut();
    if (action === "reset") cameraService.value?.resetView();
    if (action === "measure-distance") measureService.value?.start("distance");
    if (action === "measure-area") measureService.value?.start("area");
    if (action === "clear-measure") measureService.value?.clear();

    if (action === "switch-layer") {
      const baseLayer = payload as BaseLayerType;
      layerService.value?.switchBaseLayer(baseLayer);
      state.currentBaseLayer = baseLayer;
    }
  };

  // 点位能力对外保持稳定接口，内部由 MapMarkerService 管理 entity 和事件。
  const flyToPoint = (point: MapPoint, options?: MapFlyToPointOptions) => {
    cameraService.value?.flyToPoint(point, options);
  };
  const addMarker = (markerData: MapMarkerData) => markerService.value?.addMarker(markerData);
  const removeMarker = (id: string) => markerService.value?.removeMarker(id);
  const clearMarkers = () => markerService.value?.clearMarkers();
  const onMarkerClick = (handler: (event: MapMarkerEvent) => void) => {
    return markerService.value?.onClick(handler) ?? (() => undefined);
  };
  const onMarkerHover = (handler: (event: MapMarkerEvent) => void) => {
    return markerService.value?.onHover(handler) ?? (() => undefined);
  };

  // 页面卸载或 Shell 销毁时统一释放 Cesium 事件、实体和图层。
  const destroyMapTools = () => {
    measureService.value?.destroy();
    markerService.value?.destroy();
    layerService.value?.destroy();

    measureService.value = null;
    markerService.value = null;
    layerService.value = null;
    cameraService.value = null;
    viewerRef.value = null;
  };

  onBeforeUnmount(() => {
    destroyMapTools();
  });

  return {
    state,
    layerOptions,
    initMapTools,
    destroyMapTools,
    handleToolbarAction,
    flyToPoint,
    addMarker,
    removeMarker,
    clearMarkers,
    onMarkerClick,
    onMarkerHover,
  };
}

// 提升高分屏下的地图文字和线条清晰度，限制倍率避免 GPU 压力过大。
const improveMapClarity = (viewer: Cesium.Viewer) => {
  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
  viewer.scene.postProcessStages.fxaa.enabled = false;
};
