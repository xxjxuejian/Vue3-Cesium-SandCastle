<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app.store";
import { useI18n } from "vue-i18n";

defineProps({
  size: {
    type: String,
    required: false,
    default: "text-base",
  },
});

const langOptions = [
  { label: "中文", value: "zh-cn" },
  { label: "English", value: "en" },
];

const appStore = useAppStore();
const { locale, t } = useI18n();

/**
 * 处理语言切换
 *
 * @param lang  语言（zh-cn、en�?
 */
function handleLanguageChange(lang: string) {
  locale.value = lang;
  appStore.changeLanguage(lang);

  ElMessage.success(t("langSelect.message.success"));
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <div class="wh-full flex-center">
      <div class="i-svg:language" :class="size" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :disabled="appStore.language === item.value"
          :command="item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
