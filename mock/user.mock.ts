import type { MockMethod } from "vite-plugin-mock";
import type {
  UserFormModel,
  UserGender,
  UserItem,
  UserListQuery,
  UserOptionSet,
  UserStatus,
} from "../src/views/SystemManagement/userManagement/types";

interface MockRequest {
  url?: string;
  query?: Partial<Record<keyof UserListQuery, string>>;
  body?: Partial<UserFormModel>;
}

interface MockResponseContext {
  res: {
    statusCode: number;
  };
}

const userOptions: UserOptionSet = {
  statuses: [
    { label: "启用", value: "enabled" },
    { label: "停用", value: "disabled" },
  ],
  genders: [
    { label: "男", value: "male" },
    { label: "女", value: "female" },
    { label: "未知", value: "unknown" },
  ],
  departments: [
    { label: "总经办", value: "总经办" },
    { label: "低空安全部", value: "低空安全部" },
    { label: "飞行运营部", value: "飞行运营部" },
    { label: "数据平台部", value: "数据平台部" },
    { label: "系统运维部", value: "系统运维部" },
  ],
  roles: [
    { label: "超级管理员", value: "超级管理员" },
    { label: "系统管理员", value: "系统管理员" },
    { label: "运营人员", value: "运营人员" },
    { label: "安全员", value: "安全员" },
    { label: "访客", value: "访客" },
  ],
};

let users: UserItem[] = [
  {
    id: 1001,
    username: "admin",
    nickname: "平台管理员",
    status: "enabled",
    gender: "unknown",
    department: "总经办",
    role: "超级管理员",
    phone: "13800000001",
    email: "admin@example.com",
    createdAt: "2026-06-01 09:12:24",
  },
  {
    id: 1002,
    username: "flight_ops",
    nickname: "飞行调度员",
    status: "enabled",
    gender: "male",
    department: "飞行运营部",
    role: "运营人员",
    phone: "13800000002",
    email: "flight.ops@example.com",
    createdAt: "2026-06-03 10:20:16",
  },
  {
    id: 1003,
    username: "safety_audit",
    nickname: "安全审核员",
    status: "enabled",
    gender: "female",
    department: "低空安全部",
    role: "安全员",
    phone: "13800000003",
    email: "safety@example.com",
    createdAt: "2026-06-08 14:31:40",
  },
  {
    id: 1004,
    username: "data_viewer",
    nickname: "数据观察员",
    status: "disabled",
    gender: "unknown",
    department: "数据平台部",
    role: "访客",
    phone: "13800000004",
    email: "viewer@example.com",
    createdAt: "2026-06-12 16:45:02",
  },
  {
    id: 1005,
    username: "ops_admin",
    nickname: "运维管理员",
    status: "enabled",
    gender: "male",
    department: "系统运维部",
    role: "系统管理员",
    phone: "13800000005",
    email: "ops.admin@example.com",
    createdAt: "2026-06-15 11:18:36",
  },
  {
    id: 1006,
    username: "route_planner",
    nickname: "航线规划员",
    status: "enabled",
    gender: "female",
    department: "飞行运营部",
    role: "运营人员",
    phone: "13800000006",
    email: "route@example.com",
    createdAt: "2026-06-18 09:08:51",
  },
  {
    id: 1007,
    username: "warning_guard",
    nickname: "告警值守员",
    status: "disabled",
    gender: "male",
    department: "低空安全部",
    role: "安全员",
    phone: "13800000007",
    email: "warning@example.com",
    createdAt: "2026-06-20 13:26:11",
  },
  {
    id: 1008,
    username: "map_operator",
    nickname: "地图操作员",
    status: "enabled",
    gender: "female",
    department: "数据平台部",
    role: "运营人员",
    phone: "13800000008",
    email: "map@example.com",
    createdAt: "2026-06-22 17:52:09",
  },
  {
    id: 1009,
    username: "demo_guest",
    nickname: "演示访客",
    status: "enabled",
    gender: "unknown",
    department: "总经办",
    role: "访客",
    phone: "13800000009",
    email: "guest@example.com",
    createdAt: "2026-06-25 08:42:33",
  },
  {
    id: 1010,
    username: "maintenance",
    nickname: "设备维护员",
    status: "enabled",
    gender: "male",
    department: "系统运维部",
    role: "系统管理员",
    phone: "13800000010",
    email: "maintenance@example.com",
    createdAt: "2026-06-28 15:09:47",
  },
  {
    id: 1011,
    username: "airspace_admin",
    nickname: "空域管理员",
    status: "enabled",
    gender: "female",
    department: "低空安全部",
    role: "系统管理员",
    phone: "13800000011",
    email: "airspace@example.com",
    createdAt: "2026-06-30 10:30:19",
  },
  {
    id: 1012,
    username: "log_reader",
    nickname: "日志审阅员",
    status: "disabled",
    gender: "unknown",
    department: "数据平台部",
    role: "访客",
    phone: "13800000012",
    email: "log.reader@example.com",
    createdAt: "2026-07-01 12:03:55",
  },
];

function includesText(source: string, keyword?: string) {
  return !keyword || source.includes(keyword);
}

function getNextId() {
  return Math.max(1000, ...users.map((user) => user.id)) + 1;
}

function getNowText() {
  const date = new Date();
  const pad = (value: number) => `${value}`.padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toUserItem(form: UserFormModel, fallback?: UserItem): UserItem {
  return {
    id: fallback?.id ?? getNextId(),
    username: form.username,
    nickname: form.nickname,
    status: form.status as UserStatus,
    gender: form.gender as UserGender,
    department: form.department,
    role: form.role,
    phone: form.phone,
    email: form.email,
    createdAt: fallback?.createdAt ?? getNowText(),
  };
}

function getUserId(url?: string) {
  const idText = url?.match(/\/api\/system\/users\/(\d+)/)?.[1];
  return idText ? Number(idText) : 0;
}

function notFoundResponse(message: string) {
  return {
    code: 404,
    data: null,
    msg: message,
  };
}

export default [
  {
    url: "/api/system/user-options",
    method: "get",
    response: () => {
      return {
        code: 200,
        data: userOptions,
        msg: "success",
      };
    },
  },
  {
    url: "/api/system/users",
    method: "get",
    response: ({ query }: MockRequest) => {
      const page = Number(query?.page ?? 1);
      const pageSize = Number(query?.pageSize ?? 10);
      const filteredUsers = users.filter((user) => {
        const matchesStatus = !query?.status || user.status === query.status;
        const matchesDepartment = !query?.department || user.department === query.department;

        return (
          includesText(user.username, query?.username) &&
          includesText(user.nickname, query?.nickname) &&
          includesText(user.phone, query?.phone) &&
          matchesStatus &&
          matchesDepartment
        );
      });
      const start = (page - 1) * pageSize;

      return {
        code: 200,
        data: {
          list: filteredUsers.slice(start, start + pageSize),
          total: filteredUsers.length,
        },
        msg: "success",
      };
    },
  },
  {
    url: "/api/system/users",
    method: "post",
    response: ({ body }: MockRequest) => {
      const user = toUserItem(body as UserFormModel);
      users = [user, ...users];

      return {
        code: 200,
        data: user,
        msg: "success",
      };
    },
  },
  {
    url: /\/api\/system\/users\/\d+/,
    method: "put",
    response(this: MockResponseContext, { url, body }: MockRequest) {
      const id = getUserId(url);
      const currentUser = users.find((user) => user.id === id);

      if (!currentUser) {
        this.res.statusCode = 404;
        return notFoundResponse("用户不存在");
      }

      const nextUser = toUserItem(body as UserFormModel, currentUser);

      users = users.map((user) => (user.id === id ? nextUser : user));

      return {
        code: 200,
        data: nextUser,
        msg: "success",
      };
    },
  },
  {
    url: /\/api\/system\/users\/\d+/,
    method: "delete",
    response(this: MockResponseContext, { url }: MockRequest) {
      const id = getUserId(url);
      const hasUser = users.some((user) => user.id === id);

      if (!hasUser) {
        this.res.statusCode = 404;
        return notFoundResponse("用户不存在");
      }

      users = users.filter((user) => user.id !== id);

      return {
        code: 200,
        data: null,
        msg: "success",
      };
    },
  },
] as MockMethod[];
