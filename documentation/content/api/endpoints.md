---
title: APIエンドポイント
description: Taskly APIの各エンドポイント、入力、応答を定義します。
---

# APIエンドポイント

共通の通信形式とエラーは[API共通規約](./conventions.md)、Todoの型と制約は[タスクモデル](../domain/todo.md)を参照してください。

## 一覧

| メソッド | パス         | 成功 | 操作           |
| -------- | ------------ | ---- | -------------- |
| `GET`    | `/health`    | 200  | ヘルスチェック |
| `GET`    | `/todos`     | 200  | タスク一覧取得 |
| `GET`    | `/todos/:id` | 200  | 単一タスク取得 |
| `POST`   | `/todos`     | 201  | タスク登録     |
| `PATCH`  | `/todos/:id` | 200  | タスク更新     |
| `DELETE` | `/todos/:id` | 200  | タスク削除     |

## ヘルスチェック

`GET /health`

```json
{
  "status": "ok",
  "service": "taskly-api",
  "time": "2026-09-11T00:00:00.000Z"
}
```

`time`はISO 8601形式の応答生成時刻です。

## タスク一覧取得

`GET /todos`

```json
{
  "data": {
    "todos": []
  }
}
```

`todos`はTodoの配列です。

## 単一タスク取得

`GET /todos/:id`

```json
{
  "data": {
    "todo": {}
  }
}
```

指定した`id`が存在しない場合は`NOT_FOUND`を返します。

## タスク登録

`POST /todos`

| 属性        | 必須 |
| ----------- | ---- |
| `title`     | 必須 |
| `assignee`  | 必須 |
| `startDate` | 任意 |
| `dueDate`   | 必須 |
| `priority`  | 必須 |

成功時は生成したTodoを`data.todo`に返します。`id`、`isCompleted`、`completedAt`はサーバーが設定します。

## タスク更新

`PATCH /todos/:id`

更新できる属性は`title`、`assignee`、`startDate`、`dueDate`、`priority`、`isCompleted`です。一つ以上の属性を指定します。成功時は更新後のTodoを`data.todo`に返します。

対象が存在しない場合は`NOT_FOUND`、入力が制約を満たさない場合は`VALIDATION_ERROR`を返します。

## タスク削除

`DELETE /todos/:id`

```json
{
  "data": {
    "deletedId": "TD-1042"
  }
}
```

対象が存在しない場合は`NOT_FOUND`を返します。
