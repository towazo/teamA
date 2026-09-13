export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: string;
  title: string;
  assignee: string;
  isCompleted: boolean;
  startDate: string;
  dueDate: string;
  completedAt: string | null;
  priority: Priority;
}

export interface CreateTodoInput {
  title: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
}

export interface UpdateTodoInput {
  title?: string;
  assignee?: string;
  startDate?: string;
  dueDate?: string;
  priority?: Priority;
  isCompleted?: boolean;
}

interface ApiErrorBody {
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

interface ListTodosResponse {
  data: {
    todos: Todo[];
  };
}

interface TodoResponse {
  data: {
    todo: Todo;
  };
}

interface TodoDetailResponse {
  todo: Todo;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.message ?? `API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function listTodos(): Promise<Todo[]> {
  const response = await request<ListTodosResponse>("/todos");
  return response.data.todos;
}

export async function getTodo(id: string): Promise<Todo> {
  const response = await request<TodoDetailResponse>(`/todos/${id}`);
  return response.todo;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await request<TodoResponse>("/todos", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.todo;
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  const response = await request<TodoResponse>(`/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  return response.data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  await request<{ data: { deletedId: string } }>(`/todos/${id}`, {
    method: "DELETE",
  });
}
