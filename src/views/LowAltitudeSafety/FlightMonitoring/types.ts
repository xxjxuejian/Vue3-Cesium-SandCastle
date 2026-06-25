/** 监控点位类型。 */
export type MonitoringPointType = "drone" | "monitoring-point" | "safe-passage" | "weather-station";

/** 点位类型筛选选项。 */
export interface MonitoringPointTypeOption {
  /** 点位类型值。 */
  value: MonitoringPointType;
  /** 类型展示名称。 */
  label: string;
  /** 类型图标地址。 */
  iconUrl: string;
}

/** 低空监控地图中的点位信息。 */
export interface MonitoringPoint {
  /** 点位唯一标识。 */
  id: string;
  /** 点位名称。 */
  name: string;
  /** 点位类型。 */
  type: MonitoringPointType;
  /** 点位类型展示名称。 */
  typeName: string;
  /** 点位所在地址。 */
  address: string;
  /** 经度，单位为度。 */
  lon: number;
  /** 纬度，单位为度。 */
  lat: number;
  /** 点位图标地址。 */
  iconUrl: string;
}
