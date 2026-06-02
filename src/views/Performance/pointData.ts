export type PointStatus = "normal" | "warning" | "danger";

export interface SimulatedPoint {
  id: number;
  longitude: number;
  latitude: number;
  height: number;
  status: PointStatus;
}

export interface GeneratePointOptions {
  count: number;
  seed?: number;
}

const STATUS_LIST: PointStatus[] = ["normal", "warning", "danger"];

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

export function generateSimulatedPoints(options: GeneratePointOptions): SimulatedPoint[] {
  const random = createSeededRandom(options.seed ?? 20260602);
  const points: SimulatedPoint[] = new Array(options.count);

  // 模拟华东城市群附近的低空感知点位，范围足够大，便于观察缩放后的密度变化。
  const minLongitude = 116.2;
  const maxLongitude = 122.3;
  const minLatitude = 28.4;
  const maxLatitude = 33.6;

  for (let index = 0; index < options.count; index += 1) {
    const statusRandom = random();
    const status = STATUS_LIST[statusRandom > 0.94 ? 2 : statusRandom > 0.78 ? 1 : 0];

    points[index] = {
      id: index + 1,
      longitude: minLongitude + (maxLongitude - minLongitude) * random(),
      latitude: minLatitude + (maxLatitude - minLatitude) * random(),
      height: 80 + random() * 720,
      status,
    };
  }

  return points;
}

export function filterPointsByCameraHeight(
  points: SimulatedPoint[],
  cameraHeight: number,
  enabled: boolean
) {
  if (!enabled) {
    return {
      points,
      sampleStep: 1,
      description: "视距过滤关闭，当前渲染全部点位。",
    };
  }

  let sampleStep = 1;

  if (cameraHeight > 4_000_000) {
    sampleStep = 10;
  } else if (cameraHeight > 1_500_000) {
    sampleStep = 5;
  } else if (cameraHeight > 500_000) {
    sampleStep = 2;
  }

  if (sampleStep === 1) {
    return {
      points,
      sampleStep,
      description: "相机距离较近，保留全部点位以保证细节。",
    };
  }

  const filteredPoints = points.filter((_, index) => index % sampleStep === 0);

  return {
    points: filteredPoints,
    sampleStep,
    description: `相机距离较远，每 ${sampleStep} 个点抽样渲染 1 个点。`,
  };
}
