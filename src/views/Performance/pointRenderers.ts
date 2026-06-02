import * as Cesium from "cesium";
import type { PointStatus, SimulatedPoint } from "./pointData";

export type RenderMode = "entity" | "pointPrimitive" | "billboard";

export interface RenderOptions {
  batchSize: number;
  useBatchLoading: boolean;
  signal?: AbortSignal;
  onProgress?: (renderedCount: number) => void;
}

export interface RenderResult {
  renderedCount: number;
  duration: number;
}

export interface PointRenderer {
  label: string;
  description: string;
  render: (points: SimulatedPoint[], options: RenderOptions) => Promise<RenderResult>;
  updateVisible: (points: SimulatedPoint[], options: RenderOptions) => Promise<RenderResult>;
  clear: () => void;
}

const STATUS_COLORS: Record<PointStatus, Cesium.Color> = {
  normal: Cesium.Color.fromCssColorString("#35d07f"),
  warning: Cesium.Color.fromCssColorString("#ffd166"),
  danger: Cesium.Color.fromCssColorString("#ff4d4f"),
};

function ensureNotCancelled(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("渲染任务已取消", "AbortError");
  }
}

function waitNextFrame(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    ensureNotCancelled(signal);

    window.requestAnimationFrame(() => {
      if (signal?.aborted) {
        reject(new DOMException("渲染任务已取消", "AbortError"));
        return;
      }

      resolve();
    });
  });
}

function toCartesian(point: SimulatedPoint) {
  return Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height);
}

function getPointColor(status: PointStatus) {
  return STATUS_COLORS[status];
}

function getBatchSize(options: RenderOptions) {
  if (!options.useBatchLoading) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(500, options.batchSize);
}

async function forEachByBatch(
  points: SimulatedPoint[],
  options: RenderOptions,
  callback: (point: SimulatedPoint) => void
) {
  const batchSize = getBatchSize(options);
  let renderedCount = 0;

  for (let index = 0; index < points.length; index += 1) {
    ensureNotCancelled(options.signal);
    callback(points[index]);
    renderedCount += 1;

    if (renderedCount % batchSize === 0) {
      options.onProgress?.(renderedCount);
      await waitNextFrame(options.signal);
    }
  }

  options.onProgress?.(renderedCount);
}

function createBillboardCanvas(status: PointStatus) {
  const canvas = document.createElement("canvas");
  const size = 28;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    return canvas;
  }

  const color = getPointColor(status).toCssColorString();

  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(center, center, 10, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = "rgba(255,255,255,0.9)";
  context.stroke();
  context.beginPath();
  context.arc(center, center, 13, 0, Math.PI * 2);
  context.strokeStyle = color.replace(")", ", 0.35)").replace("rgb", "rgba");
  context.lineWidth = 2;
  context.stroke();

  return canvas;
}

export function createEntityRenderer(viewer: Cesium.Viewer): PointRenderer {
  const entities: Cesium.Entity[] = [];

  function clear() {
    entities.forEach((entity) => viewer.entities.remove(entity));
    entities.length = 0;
    viewer.scene.requestRender();
  }

  async function render(points: SimulatedPoint[], options: RenderOptions): Promise<RenderResult> {
    clear();
    const start = performance.now();

    await forEachByBatch(points, options, (point) => {
      const entity = viewer.entities.add({
        id: `performance-point-${point.id}`,
        position: toCartesian(point),
        point: {
          color: getPointColor(point.status),
          pixelSize: point.status === "danger" ? 9 : 6,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      entities.push(entity);
    });

    viewer.scene.requestRender();

    return {
      renderedCount: points.length,
      duration: performance.now() - start,
    };
  }

  return {
    label: "Entity 基准模式",
    description: "每个点都是一个 Entity，表达能力强，但大批量场景下管理成本最高。",
    render,
    updateVisible: render,
    clear,
  };
}

export function createPointPrimitiveRenderer(viewer: Cesium.Viewer): PointRenderer {
  let collection: Cesium.PointPrimitiveCollection | undefined;

  function clear() {
    if (collection) {
      viewer.scene.primitives.remove(collection);
      collection = undefined;
      viewer.scene.requestRender();
    }
  }

  async function render(points: SimulatedPoint[], options: RenderOptions): Promise<RenderResult> {
    clear();
    const start = performance.now();
    collection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());

    await forEachByBatch(points, options, (point) => {
      collection?.add({
        id: point.id,
        position: toCartesian(point),
        color: getPointColor(point.status),
        pixelSize: point.status === "danger" ? 9 : 6,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.75),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });

    viewer.scene.requestRender();

    return {
      renderedCount: points.length,
      duration: performance.now() - start,
    };
  }

  return {
    label: "PointPrimitiveCollection 优化模式",
    description: "把点位合并到 Primitive 集合中，适合几万级简单点位展示。",
    render,
    updateVisible: render,
    clear,
  };
}

export function createBillboardRenderer(viewer: Cesium.Viewer): PointRenderer {
  let collection: Cesium.BillboardCollection | undefined;
  const images = {
    normal: createBillboardCanvas("normal"),
    warning: createBillboardCanvas("warning"),
    danger: createBillboardCanvas("danger"),
  };

  function clear() {
    if (collection) {
      viewer.scene.primitives.remove(collection);
      collection = undefined;
      viewer.scene.requestRender();
    }
  }

  async function render(points: SimulatedPoint[], options: RenderOptions): Promise<RenderResult> {
    clear();
    const start = performance.now();
    collection = viewer.scene.primitives.add(new Cesium.BillboardCollection());

    await forEachByBatch(points, options, (point) => {
      collection?.add({
        id: point.id,
        image: images[point.status],
        position: toCartesian(point),
        scale: point.status === "danger" ? 0.72 : 0.58,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });

    viewer.scene.requestRender();

    return {
      renderedCount: points.length,
      duration: performance.now() - start,
    };
  }

  return {
    label: "BillboardCollection 图标模式",
    description: "使用图标表达状态，比纯点更直观，但纹理和像素填充开销更高。",
    render,
    updateVisible: render,
    clear,
  };
}

export function createPointRenderer(mode: RenderMode, viewer: Cesium.Viewer): PointRenderer {
  if (mode === "entity") {
    return createEntityRenderer(viewer);
  }

  if (mode === "billboard") {
    return createBillboardRenderer(viewer);
  }

  return createPointPrimitiveRenderer(viewer);
}
