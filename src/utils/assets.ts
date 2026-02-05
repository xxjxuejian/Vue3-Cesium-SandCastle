/**
 * 获取 public 目录下的静态资源路径
 * 自动适配 Vite 的 base 配置
 * @param path 资源路径，例如 'SampleData/models/xxx.glb'
 */
export function getPublicAssets(path: string): string {
  // 确保 path 不以 / 开头，防止出现双斜杠 //
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
