export type FlightPointType = "drone" | "monitoring-point" | "safe-passage" | "weather-station";

export interface FlightMonitoringPoint {
  id: string;
  name: string;
  type: FlightPointType;
  typeName: string;
  address: string;
  lon: number;
  lat: number;
  iconUrl: string;
}
