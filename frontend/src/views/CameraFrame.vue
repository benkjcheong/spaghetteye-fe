<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { frameUrl } from '../api/client';

const src = ref(frameUrl());
const updatedAt = ref<number | null>(null);
const error = ref(false);
let timer: number | undefined;

function refresh() {
  src.value = frameUrl();
}

function onLoad() {
  updatedAt.value = Date.now();
  error.value = false;
}

function onError() {
  error.value = true;
}

onMounted(() => {
  timer = window.setInterval(refresh, 5000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-mono text-xl">Camera Frame</h2>
      <div class="flex items-center gap-3 text-xs font-mono text-slate-400">
        <span v-if="updatedAt">updated {{ new Date(updatedAt).toLocaleTimeString() }}</span>
        <button
          @click="refresh"
          class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          refresh
        </button>
      </div>
    </div>

    <div class="bg-panel rounded-lg ring-1 ring-slate-800 p-3">
      <div v-if="error" class="aspect-video flex items-center justify-center text-slate-500 font-mono text-sm">
        No frame available yet. Detector must capture one first (printer must be RUNNING and AI enabled).
      </div>
      <img
        v-else
        :src="src"
        alt="latest printer camera frame"
        class="w-full rounded"
        @load="onLoad"
        @error="onError"
      />
    </div>

    <p class="text-xs text-slate-500 font-mono">
      Polls /api/frame.jpg every 5s. Frame updates only while the AI detector is enabled and a print is RUNNING.
    </p>
  </section>
</template>
