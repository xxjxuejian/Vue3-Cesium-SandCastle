import type CesiumMapShell from "@/components/Cesium/CesiumMapShell.vue";
import { rasterizeSvgIcon } from "@/core/cesium/map/utils/rasterizeSvgIcon";
import type { MonitoringPoint } from "../types";

type MapShellInstance = InstanceType<typeof CesiumMapShell>;

export const useFlightMarkers = () => {
  const markerIconCache = new Map<string, Promise<string>>();

  /**
   * 获取栅格化后的点位图标，同一个 SVG 地址只转换一次。
   *
   * @param iconUrl SVG 图标地址。
   * @returns 栅格化后的图标地址。
   */
  const getMarkerIconUrl = (iconUrl: string) => {
    const cachedIcon = markerIconCache.get(iconUrl);
    if (cachedIcon) return cachedIcon;

    const iconPromise = rasterizeSvgIcon(iconUrl).catch((error: unknown) => {
      markerIconCache.delete(iconUrl);
      throw error;
    });
    markerIconCache.set(iconUrl, iconPromise);
    return iconPromise;
  };

  /**
   * 将业务点位同步到地图，并按照点位类型加入对应分组。
   *
   * @param mapShell 地图壳组件实例。
   * @param points 需要同步的业务点位。
   */
  const syncMarkers = async (mapShell: MapShellInstance | null, points: MonitoringPoint[]) => {
    if (!mapShell) return;

    const markerPoints = await Promise.all(
      points.map(async (point) => ({
        ...point,
        markerIconUrl: await getMarkerIconUrl(point.iconUrl),
      }))
    );

    mapShell.clearMarkers();
    markerPoints.forEach((point) => {
      mapShell.addMarker(
        {
          id: point.id,
          label: point.name,
          iconUrl: point.markerIconUrl,
          position: {
            lon: point.lon,
            lat: point.lat,
            height: 0,
          },
          payload: point,
        },
        {
          groupId: point.type,
        }
      );
    });
  };

  return {
    syncMarkers,
  };
};
