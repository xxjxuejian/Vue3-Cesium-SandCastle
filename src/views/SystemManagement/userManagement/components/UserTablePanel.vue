<script setup lang="ts">
import { Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue";
import { getUserList } from "@/api/userManagement";
import type { UserItem, UserListQuery, UserOptionSet, UserStatus, UserTableAction } from "../types";

interface Props {
  options: UserOptionSet;
}

interface Emits {
  action: [action: UserTableAction];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const defaultQuery: UserListQuery = {
  page: 1,
  pageSize: 10,
};

const query = reactive<UserListQuery>({ ...defaultQuery });
const users = shallowRef<UserItem[]>([]);
const selectedUsers = shallowRef<UserItem[]>([]);
const total = shallowRef(0);
const loading = shallowRef(false);

const statusTextMap: Record<UserStatus, string> = {
  enabled: "启用",
  disabled: "停用",
};

async function fetchUsers(nextQuery: UserListQuery = query) {
  Object.assign(query, nextQuery);
  loading.value = true;

  try {
    const response = await getUserList({ ...query });
    const nextUsers = response.data.list;
    const nextTotal = response.data.total;

    if (nextUsers.length === 0 && nextTotal > 0 && query.page > 1) {
      const lastPage = Math.max(1, Math.ceil(nextTotal / query.pageSize));

      if (lastPage !== query.page) {
        await fetchUsers({ ...query, page: lastPage });
        return;
      }
    }

    users.value = nextUsers;
    total.value = nextTotal;
  } finally {
    loading.value = false;
  }
}

function refresh() {
  return fetchUsers();
}

function handleSearch() {
  fetchUsers({ ...query, page: 1 });
}

function handleReset() {
  fetchUsers({ ...defaultQuery, pageSize: query.pageSize });
}

function handleSizeChange(pageSize: number) {
  fetchUsers({ ...query, page: 1, pageSize });
}

function handleCurrentChange(page: number) {
  fetchUsers({ ...query, page });
}

function handleSelectionChange(nextSelectedUsers: UserItem[]) {
  selectedUsers.value = nextSelectedUsers;
  emit("action", { type: "selection-change", users: nextSelectedUsers });
}

onMounted(() => {
  fetchUsers();
});

defineExpose({ refresh });
</script>

<template>
  <section class="user-table-panel">
    <div class="query-panel">
      <el-form :model="query" label-width="76px" class="query-form">
        <el-form-item label="用户名">
          <el-input
            v-model="query.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="query.nickname"
            placeholder="请输入昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in options.statuses"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="query.department" placeholder="请选择部门" clearable>
            <el-option
              v-for="item in options.departments"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="query.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-toolbar">
      <el-button type="primary" :icon="Plus" @click="emit('action', { type: 'create' })">
        新增用户
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="users"
      height="100%"
      border
      class="user-table"
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column prop="username" label="用户名" min-width="110" show-overflow-tooltip />
      <el-table-column prop="nickname" label="昵称" min-width="110" show-overflow-tooltip />
      <el-table-column label="状态" width="88" align="center">
        <template #default="{ row }: { row: UserItem }">
          <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" effect="light">
            {{ statusTextMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="性别" width="78" align="center">
        <template #default="{ row }: { row: UserItem }">
          {{ options.genders.find((item) => item.value === row.gender)?.label ?? "未知" }}
        </template>
      </el-table-column>
      <el-table-column prop="department" label="部门" min-width="120" show-overflow-tooltip />
      <el-table-column prop="role" label="角色" min-width="120" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号码" min-width="130" show-overflow-tooltip />
      <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }: { row: UserItem }">
          <el-button type="primary" link :icon="Edit" @click="emit('action', { type: 'edit', user: row })">
            编辑
          </el-button>
          <el-button type="danger" link :icon="Delete" @click="emit('action', { type: 'delete', user: row })">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <span class="selection-hint">已加载 {{ users.length }} 条</span>
      <el-pagination
        :current-page="query.page"
        :page-size="query.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.user-table-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.query-panel,
.table-toolbar,
.user-table,
.pagination-bar {
  border: 1px solid #dce5f2;
  border-radius: 6px;
  background: #ffffff;
}

.query-panel {
  padding: 18px 18px 2px;
}

.query-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  column-gap: 16px;
}

.query-actions {
  :deep(.el-form-item__content) {
    justify-content: flex-end;
  }
}

.table-toolbar {
  display: flex;
  justify-content: flex-start;
  padding: 12px 14px;
}

.user-table {
  flex: 1;
  min-height: 260px;
  width: 100%;
}

.pagination-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.selection-hint {
  color: #68758a;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .query-form {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 720px) {
  .query-form {
    grid-template-columns: 1fr;
  }

  .pagination-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .user-table {
    min-height: 220px;
  }
}
</style>
