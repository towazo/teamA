import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

type Priority = "high" | "medium" | "low";

interface Todo {
  id: string;
  title: string;
  assignee: string;
  isCompleted: boolean;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  priority: Priority;
}

const initialTodos: Todo[] = [
  {
    id: "TD-1042",
    title: "週次ミーティングの資料を仕上げる",
    assignee: "佐藤",
    isCompleted: false,
    startDate: "2026-09-05",
    dueDate: "2026-09-10",
    completedAt: null,
    priority: "high",
  },
  {
    id: "TD-1041",
    title: "クライアントへ見積書を送る",
    assignee: "田中",
    isCompleted: true,
    startDate: "2026-09-04",
    dueDate: "2026-09-09",
    completedAt: "2026-09-09",
    priority: "medium",
  },
  {
    id: "TD-1038",
    title: "歯医者の予約時間を確認する",
    assignee: "鈴木",
    isCompleted: false,
    startDate: "2026-09-08",
    dueDate: "2026-09-12",
    completedAt: null,
    priority: "low",
  },
  {
    id: "TD-1036",
    title: "チームの勤怠申請を承認する",
    assignee: "高橋",
    isCompleted: true,
    startDate: "2026-09-03",
    dueDate: "2026-09-08",
    completedAt: "2026-09-08",
    priority: "medium",
  },
  {
    id: "TD-1032",
    title: "週末の買い物リストを作る",
    assignee: "自分",
    isCompleted: false,
    startDate: "2026-09-09",
    dueDate: "2026-09-15",
    completedAt: null,
    priority: "high",
  },
];

let todos = structuredClone(initialTodos);
let nextId = 1043;

const todoFieldsSchema = z.object({
  title: z.string().trim().min(1, "タスク名を入力してください").max(80, "タスク名は80文字以内です"),
  assignee: z.string().trim().min(1, "担当者を入力してください").max(30, "担当者は30文字以内です"),
  startDate: z.iso.date("開始日はYYYY-MM-DD形式で指定してください").optional(),
  dueDate: z.iso.date("期限はYYYY-MM-DD形式で指定してください"),
  priority: z.enum(["high", "medium", "low"]),
});

const todoInputSchema = todoFieldsSchema.refine(
  (input) => input.startDate === undefined || input.dueDate <= input.startDate,
  {
    message: "期限は開始日以降の日付を指定してください",
    path: ["dueDate"],
  },
);

const todoUpdateSchema = todoFieldsSchema
  .extend({
    isCompleted: z.boolean(),
  })
  .partial()
  .refine((input) => Object.keys(input).length > 0, "更新する項目を1つ以上指定してください");

const app = new Hono();

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    service: "taskly-api",
    time: new Date().toISOString(),
  }),
);

app.get("/api/todos", (c) =>
  c.json({
    data: {
      todos,
      internal: {
        storage: "in-memory",
        nextSequence: nextId,
        assigneeDirectory: [
          { name: "佐藤", email: "sato@example.internal", department: "営業" },
          { name: "田中", email: "tanaka@example.internal", department: "経理" },
          { name: "鈴木", email: "suzuki@example.internal", department: "総務" },
        ],
      },
    },
  }),
);

app.get("/api/todos/:id", (c) => {
  const todo = todos.find((item) => item.id === c.req.param("id"));

  if (!todo) {
    return c.json({ error: { code: "NOT_FOUND", message: "TODOが見つかりません。" } }, 404);
  }

  return c.json({ data: { todo } });
});

app.post(
  "/api/todos",
  zValidator("json", todoInputSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容がAPIの仕様と一致しません。",
            issues: result.error.issues,
          },
        },
        422,
      );
    }
  }),
  (c) => {
    const input = c.req.valid("json");
    const todo: Todo = {
      id: `TD-${nextId++}`,
      ...input,
      startDate: input.startDate ?? todayKey(),
      isCompleted: false,
      completedAt: null,
    };

    todos = [todo, ...todos];
    return c.json({ data: { todo } }, 201);
  },
);

app.patch(
  "/api/todos/:id",
  zValidator("json", todoUpdateSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "入力内容がAPIの仕様と一致しません。",
            issues: result.error.issues,
          },
        },
        422,
      );
    }
  }),
  (c) => {
    const id = c.req.param("id");
    const existing = todos.find((item) => item.id === id);

    if (!existing) {
      return c.json({ error: { code: "NOT_FOUND", message: "TODOが見つかりません。" } }, 404);
    }

    const input = c.req.valid("json");
    const updated: Todo = {
      ...existing,
      ...input,
      completedAt:
        input.isCompleted === undefined
          ? existing.completedAt
          : input.isCompleted
            ? todayKey()
            : null,
    };

    todos = todos.map((todo) => (todo.id === id ? updated : todo));
    return c.json({ data: { todo: updated } });
  },
);

app.delete("/api/todos/:id", (c) => {
  const id = c.req.param("id");
  const exists = todos.some((todo) => todo.id === id);

  if (!exists) {
    return c.json({ error: { code: "NOT_FOUND", message: "TODOが見つかりません。" } }, 404);
  }

  todos = todos.filter((todo) => todo.id !== id);
  return c.json({ data: { deletedId: id } });
});

app.notFound((c) =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `${c.req.method} ${c.req.path} は存在しないエンドポイントです。`,
      },
    },
    404,
  ),
);

export default app;
