<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import type { UserFormModel, UserItem, UserOptionSet } from "../types";

interface Props {
  mode: "create" | "edit";
  user: UserItem | null;
  options: UserOptionSet;
  submitting: boolean;
}

interface Emits {
  submit: [form: UserFormModel];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = defineModel<boolean>({ default: false });
const formRef = useTemplateRef<FormInstance>("formRef");

const defaultForm: UserFormModel = {
  username: "",
  nickname: "",
  status: "enabled",
  gender: "unknown",
  department: "",
  role: "",
  phone: "",
  email: "",
};

const form = reactive<UserFormModel>({ ...defaultForm });

const title = computed(() => (props.mode === "create" ? "新增用户" : "编辑用户"));

const rules: FormRules<UserFormModel> = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  department: [{ required: true, message: "请选择部门", trigger: "change" }],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入 11 位手机号码", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱", trigger: "blur" },
  ],
};

watch(
  () => visible.value,
  (isVisible) => {
    if (!isVisible) {
      return;
    }

    Object.assign(form, props.user ?? defaultForm);
    nextTick(() => formRef.value?.clearValidate());
  }
);

async function handleSubmit() {
  const isValid = await formRef.value?.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  emit("submit", { ...form });
}
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="620px" align-center destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px" class="user-form">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button
            v-for="item in options.statuses"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="form.gender" placeholder="请选择性别">
          <el-option
            v-for="item in options.genders"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="部门" prop="department">
        <el-select v-model="form.department" placeholder="请选择部门">
          <el-option
            v-for="item in options.departments"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色">
          <el-option
            v-for="item in options.roles"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.user-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;

  :deep(.el-select) {
    width: 100%;
  }
}

@media (max-width: 680px) {
  .user-form {
    grid-template-columns: 1fr;
  }
}
</style>
