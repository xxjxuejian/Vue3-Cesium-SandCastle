<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { createUser, deleteUser, getUserOptions, updateUser } from "@/api/userManagement";
import UserFormDialog from "./components/UserFormDialog.vue";
import UserTablePanel from "./components/UserTablePanel.vue";
import type { UserFormModel, UserItem, UserOptionSet, UserTableAction } from "./types";

const defaultOptions: UserOptionSet = {
  statuses: [
    { label: "启用", value: "enabled" },
    { label: "停用", value: "disabled" },
  ],
  genders: [
    { label: "男", value: "male" },
    { label: "女", value: "female" },
    { label: "未知", value: "unknown" },
  ],
  departments: [],
  roles: [],
};

const selectedUsers = shallowRef<UserItem[]>([]);
const options = reactive<UserOptionSet>({ ...defaultOptions });
const submitting = shallowRef(false);
const dialogVisible = shallowRef(false);
const dialogMode = shallowRef<"create" | "edit">("create");
const editingUser = shallowRef<UserItem | null>(null);
const tablePanelRef = useTemplateRef<InstanceType<typeof UserTablePanel>>("tablePanelRef");

function isCancelAction(error: unknown) {
  return error === "cancel" || error === "close";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { msg?: string } } }).response;
    return response?.data?.msg ?? fallback;
  }

  return fallback;
}

async function fetchOptions() {
  const response = await getUserOptions();
  Object.assign(options, response.data);
}

function handleCreate() {
  dialogMode.value = "create";
  editingUser.value = null;
  dialogVisible.value = true;
}

function handleEdit(user: UserItem) {
  dialogMode.value = "edit";
  editingUser.value = user;
  dialogVisible.value = true;
}

async function handleDelete(user: UserItem) {
  try {
    await ElMessageBox.confirm(`确认删除用户“${user.nickname}”吗？`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });

    await deleteUser(user.id);
    ElMessage.success("用户已删除");
    await tablePanelRef.value?.refresh();
  } catch (error) {
    if (isCancelAction(error)) {
      return;
    }

    ElMessage.error(getErrorMessage(error, "用户删除失败"));
  }
}

function handleTableAction(action: UserTableAction) {
  switch (action.type) {
    case "create":
      handleCreate();
      break;
    case "edit":
      handleEdit(action.user);
      break;
    case "delete":
      handleDelete(action.user);
      break;
    case "selection-change":
      selectedUsers.value = action.users;
      break;
  }
}

async function handleSubmit(form: UserFormModel) {
  submitting.value = true;

  try {
    if (dialogMode.value === "create") {
      await createUser(form);
      ElMessage.success("用户已新增");
    } else if (editingUser.value) {
      await updateUser(editingUser.value.id, form);
      ElMessage.success("用户已更新");
    }

    dialogVisible.value = false;
    await tablePanelRef.value?.refresh();
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await fetchOptions();
});
</script>

<template>
  <div class="page-container">
    <UserTablePanel
      ref="tablePanelRef"
      :options="options"
      @action="handleTableAction"
    />

    <UserFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :user="editingUser"
      :options="options"
      :submitting="submitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.page-container {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  background:
    linear-gradient(135deg, rgb(36 91 168 / 8%), transparent 34%),
    linear-gradient(315deg, rgb(42 157 143 / 8%), transparent 38%), #f4f7fb;
}
</style>
