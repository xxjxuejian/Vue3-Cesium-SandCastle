/** 用户状态。 */
export type UserStatus = "enabled" | "disabled";

/** 用户性别。 */
export type UserGender = "male" | "female" | "unknown";

/** 用户列表查询条件。 */
export interface UserListQuery {
  /** 当前页码。 */
  page: number;
  /** 每页条数。 */
  pageSize: number;
  /** 用户名，支持模糊查询。 */
  username?: string;
  /** 昵称，支持模糊查询。 */
  nickname?: string;
  /** 用户状态。 */
  status?: UserStatus;
  /** 部门名称。 */
  department?: string;
  /** 手机号码，支持模糊查询。 */
  phone?: string;
}

/** 用户列表项。 */
export interface UserItem {
  /** 用户 ID。 */
  id: number;
  /** 登录用户名。 */
  username: string;
  /** 展示昵称。 */
  nickname: string;
  /** 用户状态。 */
  status: UserStatus;
  /** 性别。 */
  gender: UserGender;
  /** 所属部门。 */
  department: string;
  /** 用户角色。 */
  role: string;
  /** 手机号码。 */
  phone: string;
  /** 邮箱。 */
  email: string;
  /** 创建时间。 */
  createdAt: string;
}

/** 用户新增和编辑表单。 */
export interface UserFormModel {
  /** 用户 ID，新增时为空。 */
  id?: number;
  /** 登录用户名。 */
  username: string;
  /** 展示昵称。 */
  nickname: string;
  /** 用户状态。 */
  status: UserStatus;
  /** 性别。 */
  gender: UserGender;
  /** 所属部门。 */
  department: string;
  /** 用户角色。 */
  role: string;
  /** 手机号码。 */
  phone: string;
  /** 邮箱。 */
  email: string;
}

/** 下拉选项。 */
export interface UserOption {
  /** 选项展示文本。 */
  label: string;
  /** 选项值。 */
  value: string;
}

/** 用户管理页面下拉选项集合。 */
export interface UserOptionSet {
  /** 状态选项。 */
  statuses: Array<UserOption & { value: UserStatus }>;
  /** 性别选项。 */
  genders: Array<UserOption & { value: UserGender }>;
  /** 部门选项。 */
  departments: UserOption[];
  /** 角色选项。 */
  roles: UserOption[];
}

/** 用户列表接口数据。 */
export interface UserListResult {
  /** 列表数据。 */
  list: UserItem[];
  /** 总条数。 */
  total: number;
}

/** 用户表格向父组件发送的统一动作。 */
export type UserTableAction =
  | { type: "create" }
  | { type: "edit"; user: UserItem }
  | { type: "delete"; user: UserItem }
  | { type: "selection-change"; users: UserItem[] };

/** 通用 mock 接口响应。 */
export interface ApiResponse<T> {
  /** 业务状态码。 */
  code: number;
  /** 响应数据。 */
  data: T;
  /** 响应消息。 */
  msg: string;
}
