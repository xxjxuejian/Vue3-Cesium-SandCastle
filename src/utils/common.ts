/**
 * 数值钳制（clamp）,把变量限制在一个区间 [min, max] 内
 * @param value 需要钳制的数值
 * @param min 最小值
 * @param max 最大值
 * @returns 钳制后的数值
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
