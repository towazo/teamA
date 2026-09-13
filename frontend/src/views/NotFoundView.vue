<script setup lang="ts">
import { ArrowLeft, MapPinOff } from "lucide-vue-next";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <section class="not-found page-enter">
    <div class="error-code">404</div>
    <span class="error-icon"><MapPinOff :size="28" /></span>
    <p class="error-kicker">ページが見つかりません</p>
    <h1>お探しのページは<br />見つかりませんでした。</h1>
    <p>
      <code>{{ route.fullPath }}</code> は移動または削除された可能性があります。
    </p>
    <RouterLink class="secondary-button" to="/">
      <ArrowLeft :size="17" /> タスク一覧に戻る
    </RouterLink>
  </section>
</template>
