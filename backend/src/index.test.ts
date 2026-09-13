import { describe, expect, it } from "vite-plus/test";

import app from "./index";

describe("TODO API", () => {
  it("タスクの取得・作成・更新・削除ができる", async () => {
    const listResponse = await app.request("/api/todos");
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.data.todos).toHaveLength(5);
    expect(Object.keys(listBody.data.todos[0]).sort()).toEqual(
      [
        "assignee",
        "completedAt",
        "dueDate",
        "id",
        "isCompleted",
        "priority",
        "startDate",
        "title",
      ].sort(),
    );

    const createResponse = await app.request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "明日の予定を確認する",
        assignee: "自分",
        dueDate: "2026-09-10",
        priority: "medium",
      }),
    });
    const createBody = await createResponse.json();
    const createdId = createBody.data.todo.id as string;

    expect(createResponse.status).toBe(201);
    expect(createBody.data.todo.title).toBe("明日の予定を確認する");
    expect(createBody.data.todo.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createBody.data.todo.completedAt).toBeNull();

    const updateResponse = await app.request(`/api/todos/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.todo.isCompleted).toBe(true);
    expect(updateBody.data.todo.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const deleteResponse = await app.request(`/api/todos/${createdId}`, {
      method: "DELETE",
    });
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody.data.deletedId).toBe(createdId);

    const missingResponse = await app.request(`/api/todos/${createdId}`);
    expect(missingResponse.status).toBe(404);
  });

  it("不正な入力を422で拒否する", async () => {
    const response = await app.request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: 123,
        assignee: "自分",
        dueDate: "2026-09-10",
        priority: "medium",
      }),
    });

    expect(response.status).toBe(422);
  });
});
