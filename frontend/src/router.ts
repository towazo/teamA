import { createRouter, createWebHistory } from "vue-router";

import NotFoundView from "./views/NotFoundView.vue";
import TodoDetailView from "./views/TodoDetailView.vue";
import TodosView from "./views/TodosView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      redirect: "/tasks",
    },
    {
      path: "/tasks",
      name: "tasks",
      component: TodosView,
    },
    {
      path: "/tasks/:id",
      name: "task-detail",
      component: TodoDetailView,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundView,
    },
  ],
});
