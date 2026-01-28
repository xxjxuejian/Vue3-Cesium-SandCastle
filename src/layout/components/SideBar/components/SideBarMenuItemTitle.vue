<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app.store";
const appStore = useAppStore();

const props = defineProps<{
  icon?: string;
  title?: string;
}>();

const elIconName = ref("Menu"); // el-icon的图标默认名称

// 判断是否是 element-plus 图标
function isElIcon() {
  if (props.icon) {
    if (props.icon?.startsWith("el-icon")) {
      elIconName.value = props.icon.replace("el-icon-", "");
      return true;
    }
    return false;
  }
  return false;
}
</script>

<template>
  <template v-if="icon">
    <el-icon v-if="isElIcon()">
      <component :is="elIconName" />
    </el-icon>
    <!-- 不是el-icon图标,使用本地的图标 -->
    <div v-else class="icon-wrapper" :class="appStore.isCollapse ? 'hiddenSidebar' : ''">
      <div :class="`i-svg:${icon}`"></div>
    </div>
  </template>
  <!-- 如果没有icon值，可以使用默认的一个图标，这里我们子级菜单没有给出icon值，默认不显示图标，所以不用设置 -->
  <!-- <template v-else>
    <div class="icon-wrapper">
      <div :class="`i-svg:api`"></div>
    </div>
  </template> -->

  <span v-if="title" class="truncate" :title="title">{{ title }}</span>
</template>

<style scoped lang="scss">
/* 假如不使用el-icon图标，这里设置图标的样式，为了和el-icon图标的样式保持一致 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--el-menu-icon-width);
  margin-right: 5px;
  font-size: 18px;
  vertical-align: middle;
  text-align: center;
  transition: none;

  /* 收缩侧边栏时， */
  &.hiddenSidebar {
    margin-right: 0;
  }
}
</style>
