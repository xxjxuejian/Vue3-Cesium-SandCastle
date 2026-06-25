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
  MapMarkerAddOptions,
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

/**
 * 聚合 Cesium 通用能力，作为 UI action 与底层 service 之间的调度层。
 *
 * @param viewerRef 当前地图 Viewer 引用，用于对外暴露和跨能力共享。
 * @param options 地图工具初始化配置。
 */
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

  /**
   * Viewer ready 后统一初始化地图工具层。
   *
   * 这里接收 CesiumMapShell 创建好的 viewer，并把它挂到 viewerRef，供外部 expose 的能力复用。
   * 后续所有地图操作都通过 service 分层管理，避免业务组件直接散落调用 Cesium API。
   * 初始化完成后会同步测量状态回 toolbar，并应用默认清晰度、底图和初始视角。
   *
   * @param viewer CesiumMapShell 创建完成的 Cesium Viewer 实例。
   */
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

    // 应用默认清晰度、底图和初始视角。
    improveMapClarity(viewer);
    layerService.value.switchBaseLayer(options.defaultBaseLayer);
    cameraService.value.resetView(0);
  };

  /**
   * 统一处理 toolbar 发出的操作意图。
   *
   * 这里需要同时调度相机、图层、测量等多个 service，因此放在这个聚合 hook 中处理，
   * 避免 UI 组件直接调用底层 service。
   *
   * @param action toolbar 发出的操作类型。
   * @param payload 操作携带的额外参数，例如切换底图时的目标底图类型。
   */
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

  /**
   * 飞行到指定点位。
   *
   * @param point 目标点位坐标。
   * @param options 相机飞行配置。
   */
  const flyToPoint = (point: MapPoint, options?: MapFlyToPointOptions) => {
    cameraService.value?.flyToPoint(point, options);
  };

  /**
   * 添加地图点位标记。
   *
   * @param markerData 点位标记数据。
   * @param options 点位分组等管理选项。
   */
  const addMarker = (markerData: MapMarkerData, options?: MapMarkerAddOptions) =>
    markerService.value?.addMarker(markerData, options);

  /**
   * 移除指定点位标记。
   *
   * @param id 点位标记 ID。
   */
  const removeMarker = (id: string) => markerService.value?.removeMarker(id);

  /**
   * 清空所有点位标记。
   */
  const clearMarkers = () => markerService.value?.clearMarkers();

  /**
   * 设置指定点位分组的显示状态。
   *
   * @param groupId 点位分组标识。
   * @param visible 是否显示该分组。
   */
  const setMarkerGroupVisible = (groupId: string, visible: boolean) =>
    markerService.value?.setMarkerGroupVisible(groupId, visible);

  /**
   * 注册点位点击事件回调。
   *
   * @param handler 点位点击时触发的回调函数。
   * @returns 取消监听函数。
   */
  const onMarkerClick = (handler: (event: MapMarkerEvent) => void) => {
    return markerService.value?.onClick(handler) ?? (() => undefined);
  };

  /**
   * 注册点位悬停事件回调。
   *
   * @param handler 点位悬停时触发的回调函数。
   * @returns 取消监听函数。
   */
  const onMarkerHover = (handler: (event: MapMarkerEvent) => void) => {
    return markerService.value?.onHover(handler) ?? (() => undefined);
  };

  /**
   * 页面卸载或 Shell 销毁时统一释放 Cesium 事件、实体和图层。
   */
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
    setMarkerGroupVisible,
    onMarkerClick,
    onMarkerHover,
  };
}

/**
 * 提升高分屏下的地图文字和线条清晰度，限制倍率避免 GPU 压力过大。
 *
 * @param viewer 需要调整显示清晰度的 Cesium Viewer 实例。
 */
const improveMapClarity = (viewer: Cesium.Viewer) => {
  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
  viewer.scene.postProcessStages.fxaa.enabled = false;
};
