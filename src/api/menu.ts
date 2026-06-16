import request from "@/utils/request";

export function getMenuList() {
  return request({
    url: "/api/menu/list",
    method: "get",
  });
}
