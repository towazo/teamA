import { oxContent, type SsgNavigationGroup } from "@ox-content/vite-plugin";
import { defineConfig } from "vite-plus";

import { documentationTheme } from "./theme";

const navigation: SsgNavigationGroup[] = [
  {
    title: "はじめに",
    items: [
      { title: "仕様書トップ", path: "/", href: "/index.html" },
      { title: "プロダクト概要", path: "/product/overview", href: "/product/overview.html" },
    ],
  },
  {
    title: "モデルとルール",
    items: [
      { title: "タスクモデル", path: "/domain/todo", href: "/domain/todo.html" },
      { title: "表示・集計ルール", path: "/rules/presentation", href: "/rules/presentation.html" },
    ],
  },
  {
    title: "画面",
    items: [
      { title: "画面遷移", path: "/ui/navigation", href: "/ui/navigation.html" },
      { title: "タスク一覧", path: "/ui/task-list", href: "/ui/task-list.html" },
      { title: "タスク詳細", path: "/ui/task-detail", href: "/ui/task-detail.html" },
    ],
  },
  {
    title: "外部仕様",
    items: [
      { title: "API共通規約", path: "/api/conventions", href: "/api/conventions.html" },
      { title: "APIエンドポイント", path: "/api/endpoints", href: "/api/endpoints.html" },
      { title: "実行環境", path: "/operations/runtime", href: "/operations/runtime.html" },
    ],
  },
  {
    title: "検証",
    items: [
      {
        title: "受入条件",
        path: "/verification/acceptance",
        href: "/verification/acceptance.html",
      },
    ],
  },
];

export default defineConfig({
  plugins: [
    oxContent({
      srcDir: "content",
      outDir: "dist",
      docs: false,
      i18n: {
        enabled: true,
        defaultLocale: "ja",
        locales: [{ code: "ja", name: "日本語" }],
        hideDefaultLocale: true,
        check: false,
      },
      highlight: true,
      headingPermalinks: true,
      search: true,
      ogImage: false,
      ssg: {
        clean: true,
        siteName: "Taskly システム仕様書",
        lang: "ja",
        generateOgImage: false,
        pagination: true,
        breadcrumbs: true,
        a11y: { skipLinkLabel: "本文へ移動" },
        navigation,
        theme: documentationTheme,
      },
    }),
  ],
  build: {
    write: false,
    rolldownOptions: {
      input: "content/index.md",
    },
  },
});
