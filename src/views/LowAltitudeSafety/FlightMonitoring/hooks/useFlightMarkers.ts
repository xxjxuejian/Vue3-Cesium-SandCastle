import type CesiumMapShell from "@/components/Cesium/CesiumMapShell.vue";
import { rasterizeSvgIcon } from "@/core/cesium/map/utils/rasterizeSvgIcon";
import type { FlightMonitoringPoint } from "../types";

type MapShellInstance = InstanceType<typeof CesiumMapShell>;

export const useFlightMarkers = () => {
  const syncMarkers = async (
    mapShell: MapShellInstance | null,
    points: FlightMonitoringPoint[]
  ) => {
    if (!mapShell) return;

    const markerPoints = await Promise.all(
      points.map(async (point) => ({
        ...point,
        markerIconUrl: await rasterizeSvgIcon(point.iconUrl),
      }))
    );

    mapShell.clearMarkers();
    markerPoints.forEach((point) => {
      mapShell.addMarker({
        id: point.id,
        label: point.name,
        iconUrl: point.markerIconUrl,
        position: {
          lon: point.lon,
          lat: point.lat,
          height: 0,
        },
        payload: point,
      });
    });
  };

  return {
    syncMarkers,
  };
};
