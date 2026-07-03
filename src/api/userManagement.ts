import request from "@/utils/request";
import type {
  ApiResponse,
  UserFormModel,
  UserItem,
  UserListQuery,
  UserListResult,
  UserOptionSet,
} from "@/views/SystemManagement/userManagement/types";

/** 获取用户分页列表。 */
export function getUserList(params: UserListQuery) {
  return request({
    url: "/api/system/users",
    method: "get",
    params,
  }) as Promise<ApiResponse<UserListResult>>;
}

/** 获取用户管理筛选和表单选项。 */
export function getUserOptions() {
  return request({
    url: "/api/system/user-options",
    method: "get",
  }) as Promise<ApiResponse<UserOptionSet>>;
}

/** 新增用户。 */
export function createUser(data: UserFormModel) {
  return request({
    url: "/api/system/users",
    method: "post",
    data,
  }) as Promise<ApiResponse<UserItem>>;
}

/** 编辑用户。 */
export function updateUser(id: number, data: UserFormModel) {
  return request({
    url: `/api/system/users/${id}`,
    method: "put",
    data,
  }) as Promise<ApiResponse<UserItem>>;
}

/** 删除用户。 */
export function deleteUser(id: number) {
  return request({
    url: `/api/system/users/${id}`,
    method: "delete",
  }) as Promise<ApiResponse<null>>;
}
