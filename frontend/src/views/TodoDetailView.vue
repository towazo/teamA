<script setup lang="ts">
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  RefreshCw,
  UserRound,
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { getTodo, type Todo } from "../api/todos";

const route = useRoute();
const todo = ref<Todo | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

async function loadTodo() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    todo.value = await getTodo(String(route.params.id));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "タスクを取得できませんでした。";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadTodo);
</script>

<template>
  <section class="detail-view page-enter">
    <RouterLink class="back-link" to="/tasks"><ArrowLeft :size="17" /> タスク一覧</RouterLink>
    <div v-if="isLoading" class="detail-state">
      <RefreshCw :size="24" class="spinning" />
      <p>タスクを読み込んでいます</p>
    </div>
    <div v-else-if="errorMessage || !todo" class="detail-state detail-error">
      <p>{{ errorMessage || "タスクが見つかりませんでした。" }}</p>
    </div>
    <article v-else class="detail-card">
      <div class="detail-status">
        <CheckCircle2 v-if="todo.isCompleted" :size="23" />
        <Circle v-else :size="23" />
        {{ todo.isCompleted ? "完了済み" : "未完了" }}
      </div>
      <h1>{{ todo.title }}</h1>
      <div class="detail-meta">
        <div>
          <UserRound :size="18" /><span>担当者</span><strong>{{ todo.assignee }}</strong>
        </div>
        <div>
          <CalendarRange :size="18" /><span>開始日</span><strong>{{ todo.startDate }}</strong>
        </div>
        <div>
          <CalendarDays :size="18" /><span>期限</span><strong>{{ todo.dueDate }}</strong>
        </div>
      </div>
    </article>
  </section>
</template>
