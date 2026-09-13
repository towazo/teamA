<script setup lang="ts">
import { CalendarDays } from "lucide-vue-next";
import { RouterView } from "vue-router";

const today = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());
</script>

<template>
  <div class="app-shell">
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="today-label"><CalendarDays :size="18" /> {{ today }}</div>
        </div>
      </header>
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
