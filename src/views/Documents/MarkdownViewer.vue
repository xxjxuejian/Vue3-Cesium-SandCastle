<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { translateRouteTitle } from "@/lang/utils";

type MarkdownModule = () => Promise<string>;

const route = useRoute();

const markdownModules = import.meta.glob("@/documents/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, MarkdownModule>;

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const loading = ref(false);
const errorMessage = ref("");
const renderedHtml = ref("");

const routeTitle = computed(() => {
  const title = route.meta.title;
  return typeof title === "string" ? translateRouteTitle(title) : "";
});

const documentPath = computed(() => {
  const document = route.meta.document;
  return typeof document === "string" ? document : "";
});

const loadMarkdown = async () => {
  loading.value = true;
  errorMessage.value = "";
  renderedHtml.value = "";

  try {
    if (!documentPath.value) {
      errorMessage.value = "当前路由未配置 Markdown 文档。";
      return;
    }

    const modulePath = `/src/documents/${documentPath.value}`;
    const loader = markdownModules[modulePath];

    if (!loader) {
      errorMessage.value = `未找到文档：${documentPath.value}`;
      return;
    }

    const content = await loader();
    renderedHtml.value = md.render(content);
  } catch (error) {
    console.error("[MarkdownViewer] 渲染文档失败", error);
    errorMessage.value = "文档渲染失败，请查看控制台错误。";
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.fullPath,
  () => {
    void loadMarkdown();
  },
  { immediate: true },
);
</script>

<template>
  <section class="markdown-viewer">
    <header class="markdown-viewer__header">
      <h1>{{ routeTitle }}</h1>
    </header>

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-empty v-else-if="errorMessage" :description="errorMessage" />

    <article v-else class="markdown-body" v-html="renderedHtml"></article>
  </section>
</template>

<style scoped lang="scss">
.markdown-viewer {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
  color: #1f2937;
  background: #f8fafc;
}

.markdown-viewer__header {
  max-width: 980px;
  margin: 0 auto 16px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
  }
}

.markdown-body {
  max-width: 980px;
  padding: 28px;
  margin: 0 auto;
  line-height: 1.75;
  color: #24292f;
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 8px;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 24px 0 12px;
    line-height: 1.35;
  }

  :deep(h1) {
    padding-bottom: 12px;
    font-size: 28px;
    border-bottom: 1px solid #d8dee4;
  }

  :deep(h2) {
    padding-bottom: 8px;
    font-size: 22px;
    border-bottom: 1px solid #d8dee4;
  }

  :deep(h3) {
    font-size: 18px;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(blockquote),
  :deep(pre),
  :deep(table) {
    margin: 0 0 16px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
  }

  :deep(a) {
    color: #0969da;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(code) {
    padding: 2px 5px;
    font-family:
      ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.9em;
    background: rgba(175, 184, 193, 0.2);
    border-radius: 4px;
  }

  :deep(pre) {
    padding: 16px;
    overflow: auto;
    background: #f6f8fa;
    border-radius: 6px;

    code {
      padding: 0;
      background: transparent;
    }
  }

  :deep(blockquote) {
    padding: 0 16px;
    color: #57606a;
    border-left: 4px solid #d0d7de;
  }

  :deep(table) {
    display: block;
    width: 100%;
    overflow: auto;
    border-spacing: 0;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 8px 12px;
    border: 1px solid #d0d7de;
  }

  :deep(img) {
    max-width: 100%;
  }
}
</style>
