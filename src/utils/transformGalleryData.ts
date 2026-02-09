import type { galleryData } from "@/types/api/home";

// 从 https://sandcastle.cesium.com/gallery/list.json 获取的数据
// 安装labels 生成hashMap, 调整数据结构
export function transformGalleryDataToMap(data: galleryData[]) {
  const hashMap: Record<string, galleryData[]> = {};

  data.forEach((item) => {
    const labels = item.labels.map((item: string) => {
      return item.toLowerCase().replace(/\s+/gi, "-");
    });
    item.title = item.title.toLowerCase().replace(/\s+/gi, "-");
    item.labels = labels;
    labels.forEach((label: string) => {
      if (!hashMap[label]) {
        hashMap[label] = [];
      }
      const obj = {
        ...item,
        title: label + "_" + item.title,
      };
      hashMap[label].push(obj);
    });
  });

  return hashMap;
}

// 上一步的hashMap转为首页home页面可以使用的结构
export function generateHomeListData(hashMap: Record<string, galleryData[]>) {
  const homeListData: Record<string, galleryData[]> = {};
  for (const key in hashMap) {
    homeListData[key] = hashMap[key].map((item) => {
      const path = item.title.replace("_", "/");
      return {
        ...item,
        path: `/${path}`,
      };
    });
  }
  return homeListData;
}
