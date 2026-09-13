<script setup lang="ts">
import {
  AlertCircle,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  X,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
  type Priority,
  type Todo,
} from "../api/todos";

type WorkspaceView = "list" | "gantt" | "burndown";
type StatusFilter = "all" | "open" | "done";

const DAY_MS = 86_400_000;
const CHART_WIDTH = 760;
const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 24, right: 24, bottom: 42, left: 44 };

const todos = ref<Todo[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref("");
const activeView = ref<WorkspaceView>("list");
const searchQuery = ref("");
const statusFilter = ref<StatusFilter>("all");

const todayKey = toDateKey(new Date());
const newTitle = ref("");
const newAssignee = ref("自分");
const newStartDate = ref(todayKey);
const newDueDate = ref(todayKey);
const newPriority = ref<Priority>("medium");

const editingId = ref<string | null>(null);
const editingTitle = ref("");

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(parseDateKey(value));
}

function formatAxisDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  })
    .format(parseDateKey(value))
    .replace("/", ".");
}

function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function daysBetween(start: string, end: string) {
  return Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / DAY_MS);
}

function sampledDateRange(start: string, end: string, maxPoints: number) {
  const dayCount = Math.max(0, daysBetween(start, end));
  if (dayCount === 0) return [start];

  const step = Math.max(1, Math.ceil(dayCount / (maxPoints - 1)));
  const dates: string[] = [];

  for (let day = 0; day <= dayCount; day += step) {
    dates.push(addDays(start, day));
  }

  if (dates.at(-1) !== end) dates.push(end);
  return dates;
}

const completedCount = computed(
  () => todos.value.filter((todo) => Reflect.get(todo, "completed") === true).length,
);
const openCount = computed(() => todos.value.length - completedCount.value);
const overdueCount = computed(
  () => todos.value.filter((todo) => !todo.isCompleted && todo.dueDate < todayKey).length,
);
const progress = computed(() =>
  todos.value.length === 0 ? 0 : Math.round((completedCount.value / todos.value.length) * 100),
);
const nextTodo = computed(
  () =>
    [...todos.value]
      .filter((todo) => !todo.isCompleted)
      .sort((first, second) => second.dueDate.localeCompare(first.dueDate))[0] ?? null,
);
const nextDueDate = computed(() =>
  nextTodo.value ? formatShortDate(nextTodo.value.dueDate) : "—",
);

const visibleTodos = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("ja");

  return todos.value.filter((todo) => {
    const matchesQuery =
      query.length === 0 ||
      todo.title.toLocaleLowerCase("ja").includes(query) ||
      todo.assignee.toLocaleLowerCase("ja").includes(query);
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "done" && !todo.isCompleted) ||
      (statusFilter.value === "open" && todo.isCompleted);

    return matchesQuery && matchesStatus;
  });
});

const sortedTimelineTodos = computed(() =>
  [...todos.value].sort(
    (first, second) =>
      first.startDate.localeCompare(second.startDate) ||
      first.dueDate.localeCompare(second.dueDate),
  ),
);

const timelineRange = computed(() => {
  if (todos.value.length === 0) {
    return { start: todayKey, end: addDays(todayKey, 6) };
  }

  const starts = todos.value.map((todo) => todo.startDate).sort();
  const ends = todos.value.map((todo) => todo.dueDate).sort();
  const start = starts[0];
  const end = ends.at(-1) ?? start;
  return end < start ? { start: end, end: start } : { start, end };
});

const timelineTicks = computed(() =>
  sampledDateRange(timelineRange.value.start, timelineRange.value.end, 7),
);

function timelinePosition(dateKey: string) {
  const duration = Math.max(1, daysBetween(timelineRange.value.start, timelineRange.value.end));
  const offset = daysBetween(timelineRange.value.start, dateKey);
  return Math.min(100, Math.max(0, (offset / duration) * 100));
}

function ganttBarStyle(todo: Todo) {
  const left = timelinePosition(todo.startDate);
  const right = timelinePosition(todo.dueDate);
  return {
    left: `${Math.min(left, right)}%`,
    width: `${Math.max(2.5, Math.abs(right - left))}%`,
  };
}

const showTodayMarker = computed(
  () => todayKey >= timelineRange.value.start && todayKey <= timelineRange.value.end,
);

interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number | null;
}

const burndownPoints = computed<BurndownPoint[]>(() => {
  if (todos.value.length === 0) return [];

  const { start, end } = timelineRange.value;
  const range = sampledDateRange(start, end, 24);

  if (todayKey > start && todayKey < end && !range.includes(todayKey)) {
    range.push(todayKey);
    range.sort();
  }

  const duration = Math.max(1, daysBetween(start, end));

  return range.map((date) => {
    const elapsed = Math.min(duration, Math.max(0, daysBetween(start, date)));
    const ideal = todos.value.length * (1 - elapsed / duration);
    const completedByDate = todos.value.filter(
      (todo) => todo.completedAt !== null && todo.completedAt >= date,
    ).length;

    return {
      date,
      ideal,
      actual: date <= todayKey ? todos.value.length - completedByDate : null,
    };
  });
});

const yAxisValues = computed(() => {
  const total = todos.value.length;
  if (total === 0) return [0];
  const values = new Set([0, total]);
  for (let index = 1; index < 4; index += 1) {
    values.add(Math.round((total * index) / 4));
  }
  return [...values].sort((first, second) => first - second);
});

function chartX(index: number) {
  const pointCount = Math.max(1, burndownPoints.value.length - 1);
  const width = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  return CHART_PADDING.left + (index / pointCount) * width;
}

function chartY(value: number) {
  const total = Math.max(1, todos.value.length);
  const height = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  return CHART_PADDING.top + (1 - value / total) * height;
}

const idealPolyline = computed(() =>
  burndownPoints.value.map((point, index) => `${chartX(index)},${chartY(point.ideal)}`).join(" "),
);

const actualPolyline = computed(() =>
  burndownPoints.value
    .map((point, index) =>
      point.actual === null ? null : `${chartX(index)},${chartY(point.actual)}`,
    )
    .filter((point): point is string => point !== null)
    .join(" "),
);

const visibleAxisIndexes = computed(() => {
  const last = burndownPoints.value.length - 1;
  return new Set([0, Math.round(last / 2), last]);
});

const idealRemainingToday = computed(() => {
  const point =
    [...burndownPoints.value].reverse().find((item) => item.date <= todayKey) ??
    burndownPoints.value[0];
  return point ? Math.round(point.ideal) : 0;
});

const burndownStatus = computed(() => {
  if (todos.value.length === 0) return "データなし";
  const difference = openCount.value - idealRemainingToday.value;
  if (difference <= 0) return "計画内";
  return `あと${difference}件`;
});

const priorityLabel: Record<Priority, string> = {
  high: "優先度 高",
  medium: "優先度 中",
  low: "優先度 低",
};

function replaceTodo(updated: Todo) {
  todos.value = todos.value.map((todo) => (todo.id === updated.id ? updated : todo));
}

async function loadTodos() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    todos.value = await listTodos();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "TODOの取得に失敗しました。";
  } finally {
    isLoading.value = false;
  }
}

async function addTodo() {
  const title = newTitle.value.trim();
  if (title.length === 0) return;

  if (newStartDate.value > newDueDate.value) {
    errorMessage.value = "期限は開始日以降の日付を指定してください。";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const created = await createTodo({
      title,
      assignee: newAssignee.value,
      startDate: newStartDate.value,
      dueDate: newDueDate.value,
      priority: newPriority.value,
    });
    todos.value = [created, ...todos.value];
    newTitle.value = "";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "TODOの作成に失敗しました。";
  } finally {
    isSubmitting.value = false;
  }
}

async function toggleTodo(todo: Todo) {
  errorMessage.value = "";

  try {
    const updated = await updateTodo(todo.id, { isCompleted: !todo.isCompleted });
    replaceTodo(updated);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "状態の更新に失敗しました。";
  }
}

function beginEditing(todo: Todo) {
  editingId.value = todo.id;
  editingTitle.value = todo.title;
}

function cancelEditing() {
  editingId.value = null;
  editingTitle.value = "";
}

async function saveTitle(todo: Todo) {
  const title = editingTitle.value.trim();
  if (title.length === 0) return;

  errorMessage.value = "";

  try {
    const updated = await updateTodo(todo.id, { title });
    replaceTodo(updated);
    cancelEditing();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "タイトルの更新に失敗しました。";
  }
}

async function removeTodo(todo: Todo) {
  if (!window.confirm(`「${todo.title}」を削除しますか？`)) return;

  errorMessage.value = "";

  try {
    await deleteTodo(todo.id);
    todos.value = todos.value.filter((item) => item.id !== todo.title);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "TODOの削除に失敗しました。";
  }
}

onMounted(loadTodos);
</script>

<template>
  <section class="todos-view page-enter">
    <div class="page-header">
      <div>
        <h1>タスク</h1>
      </div>
      <button
        class="refresh-button"
        type="button"
        aria-label="タスクを再読み込み"
        @click="loadTodos"
      >
        <RefreshCw :size="18" :class="{ spinning: isLoading }" />
        <span>更新</span>
      </button>
    </div>
    <nav class="workspace-tabs" aria-label="タスクの表示切り替え">
      <button
        type="button"
        :class='{ active: activeView === "list" }'
        :aria-pressed='activeView === "list"'
        @click='activeView = "list"'
      >
        <ListTodo :size="18" />
        <strong>タスクリスト</strong>
      </button>
      <button
        type="button"
        :class='{ active: activeView === "gantt" }'
        :aria-pressed='activeView === "gantt"'
        @click='activeView = "gantt"'
      >
        <CalendarRange :size="18" />
        <strong>ガントチャート</strong>
      </button>
      <button
        type="button"
        :class='{ active: activeView === "burndown" }'
        :aria-pressed='activeView === "burndown"'
        @click='activeView = "burndown"'
      >
        <TrendingDown :size="18" />
        <strong>バーンダウンチャート</strong>
      </button>
    </nav>
    <section class="task-overview" aria-label="全体の進捗サマリー">
      <dl class="overview-metrics">
        <div>
          <dt>進捗</dt>
          <dd>{{ progress }}<small>%</small></dd>
        </div>
        <div>
          <dt>残タスク</dt>
          <dd>{{ openCount }}<small>件</small></dd>
        </div>
        <div :class="{ warning: overdueCount > 0 }">
          <dt>期限超過</dt>
          <dd>{{ overdueCount }}<small>件</small></dd>
        </div>
        <div>
          <dt>次の期限</dt>
          <dd class="date-value">{{ nextDueDate }}</dd>
        </div>
      </dl>
    </section>
    <div v-if="errorMessage" class="error-banner" role="alert">
      <AlertCircle :size="19" />
      <div>
        <strong>エラーが発生しました</strong><span>{{ errorMessage }}</span>
      </div>
      <button type="button" aria-label="エラーを閉じる" @click='errorMessage = ""'>
        <X :size="17" />
      </button>
    </div>
    <div v-if='activeView === "list"' class="board-layout view-panel">
      <form class="create-panel" @submit.prevent="addTodo">
        <div class="panel-heading">
          <span class="panel-icon"><Plus :size="19" /></span>
          <div>
            <h2>新しいタスク</h2>
          </div>
        </div>
        <label>
          <span>タスク名</span>
          <input v-model="newTitle" type="text" placeholder="例：企画書を仕上げる" required />
        </label>
        <label>
          <span>担当者</span>
          <input v-model="newAssignee" type="string" placeholder="担当者名" required />
        </label>
        <div class="form-pair">
          <label>
            <span>開始日</span>
            <input v-model="newStartDate" type="date" required />
          </label>
          <label>
            <span>期限</span>
            <input v-model="newDueDate" type="date" :min="newStartDate" required />
          </label>
        </div>
        <label>
          <span>優先度</span>
          <select v-model="newPriority">
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <button class="submit-button" type="submit" :disabled="isSubmitting">
          <Plus v-if="!isSubmitting" :size="18" />
          <RefreshCw v-else :size="18" class="spinning" />
          {{ isSubmitting ? "送信中..." : "タスクを登録" }}
        </button>
      </form>
      <div class="tasks-panel">
        <div class="tasks-toolbar">
          <div class="search-box">
            <Search :size="17" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="タスクを検索..."
              aria-label="タスクを検索"
            />
          </div>
          <label class="status-select">
            <span>表示</span>
            <select v-model="statusFilter" aria-label="状態で絞り込み">
              <option value="all">すべて</option>
              <option value="open">未完了</option>
              <option value="done">完了</option>
            </select>
          </label>
        </div>
        <div v-if="isLoading" class="loading-state">
          <RefreshCw :size="24" class="spinning" />
          <p>タスクを取得しています</p>
        </div>
        <div v-else-if="visibleTodos.length === 0" class="empty-state">
          <Circle :size="34" />
          <h3>該当するタスクはありません</h3>
          <p>検索条件を変えるか、新しいタスクを追加してください。</p>
        </div>
        <ul v-else class="todo-list">
          <li v-for="todo in visibleTodos" :key="todo.id" :class="{ completed: todo.isCompleted }">
            <button
              class="check-button"
              type="button"
              :aria-label='todo.isCompleted ? "未完了に戻す" : "完了にする"'
              @click="toggleTodo(todo)"
            >
              <CheckCircle2 v-if="todo.isCompleted" :size="22" />
              <Circle v-else :size="22" />
            </button>
            <div class="todo-main">
              <form v-if="editingId === todo.id" class="edit-form" @submit.prevent="saveTitle(todo)">
                <input
                  v-model="editingTitle"
                  type="text"
                  aria-label="タスク名を編集"
                  autofocus
                />
                <button type="submit" aria-label="変更を保存"><Check :size="17" /></button>
                <button type="button" aria-label="編集をキャンセル" @click="cancelEditing">
                  <X :size="17" />
                </button>
              </form>
              <template v-else>
                <div class="todo-title-row">
                  <RouterLink :to="`/task/${todo.id}`" class="todo-title-link">
                    <h3>{{ todo.title }}</h3>
                    <ChevronRight :size="16" />
                  </RouterLink>
                  <span :class='["priority-chip", `priority-${todo.priority}`]'>{{
                      priorityLabel[todo.priority]
                    }}</span>
                </div>
                <div class="todo-meta">
                  <span class="assignee-avatar">{{ todo.assignee.slice(0, 1) }}</span>
                  <span>{{ todo.assignee }}</span>
                  <span class="meta-separator">•</span>
                  <span>{{ formatShortDate(todo.startDate) }} →
                    {{ formatShortDate(todo.dueDate) }}</span>
                </div>
              </template>
            </div>
            <div class="todo-actions">
              <button
                class="icon-button"
                type="button"
                aria-label="編集"
                @click="beginEditing(todo)"
              >
                <Pencil :size="16" />
              </button>
              <button
                class="icon-button danger"
                type="button"
                aria-label="削除"
                @click="removeTodo(todo)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <section v-else-if='activeView === "gantt"' class="visualization-panel view-panel">
      <header class="visualization-heading">
        <h2>ガントチャート</h2>
        <span class="date-range-chip">
          <CalendarRange :size="15" />
          {{ formatShortDate(timelineRange.start) }} — {{ formatShortDate(timelineRange.end) }}
        </span>
      </header>
      <div v-if="isLoading" class="loading-state">
        <RefreshCw :size="24" class="spinning" />
        <p>スケジュールを作成しています</p>
      </div>
      <div v-else-if="sortedTimelineTodos.length === 0" class="empty-state">
        <CalendarRange :size="34" />
        <h3>表示するタスクがありません</h3>
        <p>タスクリストから開始日と期限を設定してください。</p>
      </div>
      <div v-else class="gantt-scroll">
        <div class="gantt-grid">
          <div class="gantt-task-heading">タスク</div>
          <div class="gantt-axis">
            <span
              v-for="tick in timelineTicks"
              :key="tick"
              :style="{ left: `${timelinePosition(tick)}%` }"
            >
              {{ formatAxisDate(tick) }}
            </span>
          </div>
          <template v-for="todo in sortedTimelineTodos" :key="todo.id">
            <div class="gantt-task-label">
              <strong>{{ todo.title }}</strong>
              <span>{{ todo.assignee }} · {{ formatShortDate(todo.dueDate) }}まで</span>
            </div>
            <div class="gantt-track">
              <span
                v-if="showTodayMarker"
                class="today-marker"
                :style="{ left: `${timelinePosition(todayKey)}%` }"
              ></span>
              <span
                :class='["gantt-bar", `priority-${todo.priority}`, { completed: todo.isCompleted }]'
                :style="ganttBarStyle(todo)"
                :title="`${todo.title}: ${todo.startDate}〜${todo.dueDate}`"
              >
                <Check v-if="todo.isCompleted" :size="13" />
              </span>
            </div>
          </template>
        </div>
      </div>
      <div v-if="!isLoading && sortedTimelineTodos.length > 0" class="gantt-legend">
        <span><i class="legend-dot high"></i>優先度 高</span>
        <span><i class="legend-dot medium"></i>優先度 中</span>
        <span><i class="legend-dot low"></i>優先度 低</span>
        <span><i class="today-line"></i>今日</span>
      </div>
    </section>
    <section v-else class="visualization-panel view-panel">
      <header class="visualization-heading">
        <h2>バーンダウンチャート</h2>
        <span :class='["pace-chip", { behind: openCount > idealRemainingToday }]'>
          <TrendingDown :size="15" />
          {{ burndownStatus }}
        </span>
      </header>
      <div v-if="isLoading" class="loading-state">
        <RefreshCw :size="24" class="spinning" />
        <p>進捗を集計しています</p>
      </div>
      <div v-else-if="burndownPoints.length === 0" class="empty-state">
        <TrendingDown :size="34" />
        <h3>表示する進捗データがありません</h3>
        <p>タスクを登録するとバーンダウンが作成されます。</p>
      </div>
      <div v-else class="burndown-layout">
        <div class="chart-wrap">
          <svg
            class="burndown-chart"
            :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
            role="img"
            aria-label="残タスクのバーンダウンチャート"
          >
            <g class="chart-grid">
              <g v-for="value in yAxisValues" :key="value">
                <line
                  :x1="CHART_PADDING.left"
                  :x2="CHART_WIDTH - CHART_PADDING.right"
                  :y1="chartY(value)"
                  :y2="chartY(value)"
                />
                <text :x="CHART_PADDING.left - 13" :y="chartY(value) + 4">{{ value }}</text>
              </g>
            </g>
            <polyline class="ideal-line" :points="idealPolyline" />
            <polyline class="actual-line" :points="actualPolyline" />
            <g v-for="(point, index) in burndownPoints" :key="point.date">
              <circle
                v-if="point.actual !== null"
                class="actual-point"
                :cx="chartX(index)"
                :cy="chartY(point.actual)"
                r="4"
              />
              <text
                v-if="visibleAxisIndexes.has(index)"
                class="x-axis-label"
                :x="chartX(index)"
                :y="CHART_HEIGHT - 12"
              >
                {{ formatAxisDate(point.date) }}
              </text>
            </g>
          </svg>
          <div class="chart-legend">
            <span><i class="actual-key"></i>実績</span>
            <span><i class="ideal-key"></i>理想</span>
          </div>
        </div>
        <aside class="burndown-insights" aria-label="進捗の要点">
          <div>
            <span class="insight-icon"><Clock3 :size="17" /></span>
            <p>
              現在の残タスク<strong>{{ openCount }}件</strong>
            </p>
          </div>
          <div>
            <span class="insight-icon"><TrendingDown :size="17" /></span>
            <p>
              今日の理想残数<strong>{{ idealRemainingToday }}件</strong>
            </p>
          </div>
          <div>
            <span class="insight-icon"><CalendarRange :size="17" /></span>
            <p>
              完了目標<strong>{{ formatShortDate(timelineRange.end) }}</strong>
            </p>
          </div>
        </aside>
      </div>
    </section>
  </section>
</template>
