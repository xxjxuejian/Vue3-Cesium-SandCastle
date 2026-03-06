import type { galleryData } from "@/types/api/home";

// 从 https://sandcastle.cesium.com/gallery/list.json 获取的数据
// 安装labels 生成hashMap, 调整数据结构 getGalleryMapData
export function getGalleryMapData(data: galleryData[]) {
  const hashMap: Record<string, galleryData[]> = {};

  data.forEach((item) => {
    // labels数组中的每个元素都转换为小写并替换空格为短横线，作为新的标签
    const labels = item.labels.map((item: string) => {
      return item.toLowerCase().replace(/\s+/gi, "-");
    });
    // 将title转换为小写并替换空格为短横线，作为新的title
    item.title = item.title.toLowerCase().replace(/\s+/gi, "-");
    item.labels = labels;
    // 对于每个标签，如果hashMap中没有这个标签，就创建一个新的数组；然后将当前项添加到对应标签的数组中
    labels.forEach((label: string) => {
      if (!hashMap[label]) {
        hashMap[label] = [];
      }
      const newTitle = label + "_" + item.title; // 新title格式：标签_原title的小写格式
      const path = newTitle.replace("_", "/"); // path格式：标签/原title的小写格式
      const obj = {
        ...item,
        title: newTitle,
        path: `/${path}`,
      };
      hashMap[label].push(obj);
    });
  });

  return hashMap;
}

// 上一步的hashMap添加path属性，用来点击
// export function addPathValue(hashMap: Record<string, galleryData[]>) {
//   for (const key in hashMap) {
//     hashMap[key].forEach((item) => {
//       const path = item.title.replace("_", "/");
//       item.path = `/${path}`;
//     });
//   }
// }
