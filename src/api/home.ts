import request from "@/utils/request";

export function getGalleryList() {
  return request({
    url: "/api/gallery/list",
    method: "get",
  });
}
