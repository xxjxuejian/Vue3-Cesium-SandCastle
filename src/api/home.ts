import request from "@/utils/request";

export function getSandCastleListApi() {
  return request({
    url: "/gallery/list.json",
    method: "get",
  });
}
