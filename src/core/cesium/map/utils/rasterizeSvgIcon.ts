const pngIconCache = new Map<string, string>();

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const isSvgDataUri = (src: string) => src.startsWith("data:image/svg+xml");

/**
 * 将 SVG 图标转成 PNG data URI，避免 Cesium billboard 在部分 SVG 上贴图加载失败。
 */
export const rasterizeSvgIcon = async (src: string, size = 48) => {
  if (!isSvgDataUri(src)) return src;

  const cacheKey = `${size}:${src}`;
  const cachedIcon = pngIconCache.get(cacheKey);
  if (cachedIcon) return cachedIcon;

  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return src;

  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);

  const pngIcon = canvas.toDataURL("image/png");
  pngIconCache.set(cacheKey, pngIcon);
  return pngIcon;
};
