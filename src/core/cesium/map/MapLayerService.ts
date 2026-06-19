import * as Cesium from "cesium";
import type { BaseLayerType } from "./types";

interface TiandituLayerConfig {
  base: "vec_w" | "img_w";
  annotation: "cva_w" | "cia_w";
}

const TIANDITU_LAYER_MAP: Record<BaseLayerType, TiandituLayerConfig> = {
  "tianditu-vector": {
    base: "vec_w",
    annotation: "cva_w",
  },
  "tianditu-image": {
    base: "img_w",
    annotation: "cia_w",
  },
};

export class MapLayerService {
  private readonly viewer: Cesium.Viewer;
  private readonly token: string | undefined;

  private layers: Cesium.ImageryLayer[] = [];
  private currentBaseLayer: BaseLayerType;

  constructor(viewer: Cesium.Viewer, token: string | undefined, defaultBaseLayer: BaseLayerType) {
    this.viewer = viewer;
    this.token = token;
    this.currentBaseLayer = defaultBaseLayer;
  }

  getCurrentBaseLayer() {
    return this.currentBaseLayer;
  }

  switchBaseLayer(type: BaseLayerType) {
    this.currentBaseLayer = type;

    if (!this.token) {
      console.warn("请在 .env.local 中配置 VITE_TIANDITU_TOKEN 后加载天地图底图。");
      return;
    }

    this.clearLayers();

    const config = TIANDITU_LAYER_MAP[type];
    const baseLayer = this.viewer.imageryLayers.addImageryProvider(
      this.createTiandituProvider(config.base)
    );
    const annotationLayer = this.viewer.imageryLayers.addImageryProvider(
      this.createTiandituProvider(config.annotation)
    );

    this.layers = [baseLayer, annotationLayer];
  }

  destroy() {
    this.clearLayers();
  }

  private clearLayers() {
    this.layers.forEach((layer) => {
      this.viewer.imageryLayers.remove(layer, true);
    });
    this.layers = [];
  }

  private createTiandituProvider(layerType: TiandituLayerConfig[keyof TiandituLayerConfig]) {
    return new Cesium.UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/DataServer?T=${layerType}&x={x}&y={y}&l={z}&tk=${this.token}`,
      subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
      minimumLevel: 1,
      maximumLevel: 18,
    });
  }
}
