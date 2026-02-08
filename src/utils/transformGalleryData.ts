import type { galleryData } from "@/types/api/home";

export function transformGalleryDataToMap(data: Array<galleryData>) {
  const hashMap: Record<string, Array<galleryData>> = {};

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
