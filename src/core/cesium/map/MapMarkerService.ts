import * as Cesium from "cesium";
import type { MapMarkerAddOptions, MapMarkerData, MapMarkerEvent } from "./types";

type MarkerEventHandler = (event: MapMarkerEvent) => void;

const DEFAULT_MARKER_GROUP_ID = "default";

interface MarkerRecord {
  markerData: MapMarkerData;
  entity: Cesium.Entity;
  groupId: string;
}

export class MapMarkerService {
  // Cesium Viewer 实例，是地图服务的总入口对象。
  private readonly viewer: Cesium.Viewer;
  // 以业务点位 id 为 key，保存点位数据和对应的 Cesium Entity。
  private records = new Map<string, MarkerRecord>();
  // 将 Cesium Entity id 映射回业务点位 id，用于 pick 后还原业务点位。
  private entityIdToMarkerId = new Map<string, string>();
  // 每个业务分组对应一个 CustomDataSource，用于整组控制显隐和生命周期。
  private groupDataSources = new Map<string, Cesium.CustomDataSource>();
  // 即使数据源尚未创建，也保留业务层设置的目标显隐状态。
  private groupVisibility = new Map<string, boolean>();
  // DataSourceCollection.add 返回 Promise，需要跟踪异步添加以处理销毁竞态。
  private pendingDataSourceAdds = new Set<Promise<Cesium.DataSource>>();
  private destroyed = false;
  // 全局只维护一个拾取事件处理器，避免每个点位单独绑定事件。
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  // 点位点击订阅集合，由业务层或 Shell 注册回调。
  private clickHandlers = new Set<MarkerEventHandler>();
  // 点位悬停订阅集合，由业务层或 Shell 注册回调。
  private hoverHandlers = new Set<MarkerEventHandler>();

  /**
   * 创建地图点位服务实例，并初始化统一的 Cesium 鼠标事件处理器。
   *
   * @param viewer Cesium Viewer 实例。
   */
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.ensureHandler();
  }

  /**
   * 添加一个地图点位。
   *
   * 如果传入的点位 id 已存在，会先移除旧点位，再创建新的 Cesium Entity。
   * 传入 iconUrl 时使用 billboard，否则使用 point 样式。
   *
   * @param markerData 点位业务数据。
   * @param options 点位管理选项，groupId 未提供时归入默认分组。
   * @returns 创建后的 Cesium Entity。
   */
  addMarker(markerData: MapMarkerData, options: MapMarkerAddOptions = {}) {
    if (this.destroyed) {
      throw new Error("MapMarkerService 已销毁，无法继续添加点位");
    }

    this.removeMarker(markerData.id);
    const groupId = options.groupId ?? DEFAULT_MARKER_GROUP_ID;
    const dataSource = this.ensureGroupDataSource(groupId);

    const entity = dataSource.entities.add({
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

    this.records.set(markerData.id, { markerData, entity, groupId });
    this.entityIdToMarkerId.set(entity.id, markerData.id);
    return entity;
  }

  /**
   * 根据业务点位 id 移除地图点位。
   *
   * @param id 点位业务 id。
   */
  removeMarker(id: string) {
    const record = this.records.get(id);
    if (!record) return;

    this.groupDataSources.get(record.groupId)?.entities.remove(record.entity);
    this.entityIdToMarkerId.delete(record.entity.id);
    this.records.delete(id);
  }

  /**
   * 设置指定点位分组的显示状态。
   *
   * 分组尚未创建时也会保存目标状态，后续创建数据源时自动应用。
   *
   * @param groupId 点位分组标识。
   * @param visible 是否显示该分组。
   */
  setMarkerGroupVisible(groupId: string, visible: boolean) {
    this.groupVisibility.set(groupId, visible);
    const dataSource = this.groupDataSources.get(groupId);
    if (dataSource) dataSource.show = visible;
  }

  /**
   * 清空当前服务管理的所有点位。
   */
  clearMarkers() {
    Array.from(this.records.keys()).forEach((id) => this.removeMarker(id));
  }

  /**
   * 注册点位点击事件回调。
   *
   * @param handler 点位点击时触发的回调函数。
   * @returns 取消本次点击事件监听的函数。
   */
  onClick(handler: MarkerEventHandler) {
    this.clickHandlers.add(handler);
    return () => this.clickHandlers.delete(handler);
  }

  /**
   * 注册点位悬停事件回调。
   *
   * @param handler 点位悬停时触发的回调函数。
   * @returns 取消本次悬停事件监听的函数。
   */
  onHover(handler: MarkerEventHandler) {
    this.hoverHandlers.add(handler);
    return () => this.hoverHandlers.delete(handler);
  }

  /**
   * 销毁点位服务，释放实体、事件处理器和已注册的业务回调。
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.viewer.scene.canvas.style.cursor = "";
    this.clearMarkers();
    this.groupDataSources.forEach((dataSource) => {
      this.viewer.dataSources.remove(dataSource, true);
    });
    this.groupDataSources.clear();
    this.groupVisibility.clear();
    this.handler?.destroy();
    this.handler = null;
    this.clickHandlers.clear();
    this.hoverHandlers.clear();
  }

  /**
   * 获取或创建点位分组对应的 CustomDataSource。
   *
   * @param groupId 点位分组标识。
   * @returns 分组对应的数据源。
   */
  private ensureGroupDataSource(groupId: string) {
    const existingDataSource = this.groupDataSources.get(groupId);
    if (existingDataSource) return existingDataSource;

    const dataSource = new Cesium.CustomDataSource(`marker-group:${groupId}`);
    dataSource.show = this.groupVisibility.get(groupId) ?? true;
    this.groupDataSources.set(groupId, dataSource);

    const addPromise = this.viewer.dataSources.add(dataSource);
    this.pendingDataSourceAdds.add(addPromise);
    void addPromise
      .then((addedDataSource) => {
        if (this.destroyed || this.groupDataSources.get(groupId) !== dataSource) {
          this.viewer.dataSources.remove(addedDataSource, true);
        }
      })
      .catch((error: unknown) => {
        if (!this.destroyed && this.groupDataSources.get(groupId) === dataSource) {
          this.groupDataSources.delete(groupId);
          console.error(`点位分组 ${groupId} 添加失败`, error);
        }
      })
      .finally(() => {
        this.pendingDataSourceAdds.delete(addPromise);
      });

    return dataSource;
  }

  /**
   * 确保当前服务只创建一套 Cesium 鼠标事件处理器。
   *
   * 点击和移动事件都会先通过 pickMarker 还原为业务点位事件，再分发给订阅者。
   */
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

  /**
   * 根据屏幕坐标拾取 Cesium Entity，并还原为业务点位事件。
   *
   * @param position 鼠标事件中的屏幕坐标。
   * @returns 命中的业务点位事件；未命中点位时返回 null。
   */
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
