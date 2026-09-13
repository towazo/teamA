---
title: API共通規約
description: Taskly APIのURL、JSON応答、エラー、CORSの共通仕様を定義します。
---

# API共通規約

## 基本情報

| 項目        | 値                          |
| ----------- | --------------------------- |
| ローカルURL | `http://127.0.0.1:8787/api` |
| データ形式  | JSON                        |
| 文字コード  | UTF-8                       |
| 日付形式    | `YYYY-MM-DD`                |
| 日付基準    | 日本標準時（Asia/Tokyo）    |

JSONを送信するリクエストは`Content-Type: application/json`を指定します。

## 成功応答

成功した業務データは`data`に格納します。

```json
{
  "data": {}
}
```

応答には、該当操作の利用者が必要とする公開データだけを含めます。

## エラー応答

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容がAPIの仕様と一致しません。",
    "issues": []
  }
}
```

| コード             | HTTP状態 | 用途                                       |
| ------------------ | -------- | ------------------------------------------ |
| `VALIDATION_ERROR` | 422      | 入力がスキーマまたは不変条件を満たさない   |
| `NOT_FOUND`        | 404      | 対象タスクまたはエンドポイントが存在しない |

`issues`は入力検証でのみ返し、項目ごとの詳細を格納します。画面は`error.message`を利用者向けの主メッセージとして表示します。

## CORS

開発環境では次のオリジンを許可します。

- `http://127.0.0.1:5173`
- `http://localhost:5173`

許可メソッドは`GET`、`POST`、`PATCH`、`DELETE`、`OPTIONS`、許可ヘッダーは`Content-Type`です。
