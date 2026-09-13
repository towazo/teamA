# Taskly

毎日のタスクを登録・確認・更新・削除できる、シンプルなToDoアプリです。Vizeでコンパイル・静的解析するVueフロントエンドとHonoのREST APIを、独立したViteアプリとして構成しています。

## 起動

```bash
vp install
vp run dev:all
```

- フロントエンド: <http://127.0.0.1:5173>
- バックエンド: <http://127.0.0.1:8787>
- ヘルスチェック: <http://127.0.0.1:8787/api/health>
- システム仕様書: `vp run docs:dev`で<http://127.0.0.1:4174>

APIのデータはインメモリです。バックエンドを再起動すると初期状態に戻ります。

## 主な機能

- タスクリスト・ガントチャート・バーンダウンチャートの表示
- 全タスクを基準にした進捗・期限サマリー
- キーワードと完了状態による絞り込み
- 開始日・期限を含むタスクの追加
- タスク名と完了状態の更新
- タスクの削除
- タスク詳細の表示

## コマンド

```bash
# フロントエンドとバックエンドを同時起動
vp run dev:all

# アプリと仕様書をビルド
vp run build:all

# Ox Contentで仕様書を起動・ビルド
vp run docs:dev
vp run docs:build

# Vite+によるワークスペース共通チェック
vp check

# Vizeを含む全チェック
vp run check:all

# VizeによるVueフロントエンドのフォーマット・Lint・型チェック
vp run -F @taskly/frontend vize:fmt
vp run -F @taskly/frontend vize:fmt:fix
vp run -F @taskly/frontend vize:lint
vp run -F @taskly/frontend vize:check

# テスト
vp test
```

## 構成

```text
.
├── frontend/       # Vue + Vue Router + Vize
├── backend/        # Hono REST API
└── documentation/  # Ox Contentによるシステム仕様書
```
