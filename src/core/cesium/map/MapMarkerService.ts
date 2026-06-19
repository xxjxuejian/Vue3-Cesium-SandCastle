import * as Cesium from "cesium";
import type { MapMarkerData, MapMarkerEvent } from "./types";

type MarkerEventHandler = (event: MapMarkerEvent) => void;

interface MarkerRecord {
  markerData: MapMarkerData;
  entity: Cesium.Entity;
}

export class MapMarkerService {
  // cesium的viewer 实例对象，是地图服务的总入口对象
  // readonly 属性一旦声明，就应该在初始化时确定下来。
  private readonly viewer: Cesium.Viewer;
  // 以业务点位 id 为 key，保存点位数据和对应的 Cesium Entity。
  private records = new Map<string, MarkerRecord>();
  // 将 Cesium Entity id 映射回业务点位 id，用于 pick 后还原业务点位。
  private entityIdToMarkerId = new Map<string, string>();
  // 全局只维护一个拾取事件处理器，避免每个点位单独绑定事件。
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  // 点位点击订阅集合，由业务层或 Shell 注册回调。
  //保存的是函数。这些函数会在“点击地图 marker”时被执行。
  //数据来自 onClick() 方法。
  private clickHandlers = new Set<MarkerEventHandler>();
  // 点位悬停订阅集合，由业务层或 Shell 注册回调。
  private hoverHandlers = new Set<MarkerEventHandler>();

  // 创建类实例时自动执行的方法。
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.ensureHandler();
  }

  addMarker(markerData: MapMarkerData) {
    this.removeMarker(markerData.id);

    const entity = this.viewer.entities.add({
      id: markerData.id,
      position: Cesium.Cartesian3.fromDegrees(
        markerData.position.lon,
        markerData.position.lat,
        markerData.position.height ?? 0
      ),
      billboard: markerData.iconUrl
        ? {
            image: markerData.iconUrl,
            width: 32,
            height: 32,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
        : undefined,
      point: markerData.iconUrl
        ? undefined
        : {
            pixelSize: markerData.style?.pixelSize ?? 12,
            color: Cesium.Color.fromCssColorString(markerData.style?.color ?? "#00d4ff"),
            outlineColor: Cesium.Color.fromCssColorString(
              markerData.style?.outlineColor ?? "#ffffff"
            ),
            outlineWidth: markerData.style?.outlineWidth ?? 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
      label: markerData.label
        ? {
            text: markerData.label,
            font: "13px sans-serif",
            fillColor: Cesium.Color.fromCssColorString(markerData.style?.labelColor ?? "#ffffff"),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -24),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
        : undefined,
    });

    this.records.set(markerData.id, { markerData, entity });
    this.entityIdToMarkerId.set(entity.id, markerData.id);
    return entity;
  }

  removeMarker(id: string) {
    const record = this.records.get(id);
    if (!record) return;

    this.viewer.entities.remove(record.entity);
    this.entityIdToMarkerId.delete(record.entity.id);
    this.records.delete(id);
  }

  clearMarkers() {
    Array.from(this.records.keys()).forEach((id) => this.removeMarker(id));
  }

  onClick(handler: MarkerEventHandler) {
    this.clickHandlers.add(handler);
    return () => this.clickHandlers.delete(handler);
  }

  onHover(handler: MarkerEventHandler) {
    this.hoverHandlers.add(handler);
    return () => this.hoverHandlers.delete(handler);
  }

  destroy() {
    this.viewer.scene.canvas.style.cursor = "";
    this.clearMarkers();
    this.handler?.destroy();
    this.handler = null;
    this.clickHandlers.clear();
    this.hoverHandlers.clear();
  }

  private ensureHandler() {
    // handler 已存在时直接复用，保证整个点位服务只有一套 Cesium 鼠标事件。
    if (this.handler) return;

    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    // 点击时先通过屏幕坐标 pick 到点位 Entity，再分发为业务点位点击事件。
    this.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const markerEvent = this.pickMarker(event.position);
      if (!markerEvent) return;
      this.clickHandlers.forEach((handler) => handler(markerEvent));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时持续检测当前位置是否命中点位，用于悬停高亮、tooltip 等交互。
    this.handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const markerEvent = this.pickMarker(event.endPosition);
      this.viewer.scene.canvas.style.cursor = markerEvent ? "pointer" : "";
      if (!markerEvent) return;
      this.hoverHandlers.forEach((handler) => handler(markerEvent));
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  private pickMarker(position: Cesium.Cartesian2): MapMarkerEvent | null {
    const picked = this.viewer.scene.pick(position);
    const entity = picked?.id instanceof Cesium.Entity ? picked.id : null;
    if (!entity) return null;

    const markerId = this.entityIdToMarkerId.get(entity.id);
    if (!markerId) return null;

    const record = this.records.get(markerId);
    if (!record) return null;

    return {
      id: record.markerData.id,
      entity,
      payload: record.markerData.payload,
      position: record.markerData.position,
    };
  }
}
