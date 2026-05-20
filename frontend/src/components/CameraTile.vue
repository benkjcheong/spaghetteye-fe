<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { frameUrl } from '../api/client';

const props = withDefaults(
  defineProps<{ intervalMs?: number }>(),
  { intervalMs: 5000 },
);

const src = ref(frameUrl());
const error = ref(false);
let timer: number | undefined;

function refresh() {
  src.value = frameUrl();
}

onMounted(() => {
  timer = window.setInterval(refresh, props.intervalMs);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <div class="w-full h-full bg-bg-tile rounded-xl ring-1 ring-line overflow-hidden flex items-center justify-center">
    <div
      v-if="error"
      class="text-text-muted font-mono text-sm text-center px-6"
    >
      No frame yet.
    </div>
    <img
      v-else
      :src="src"
      alt="printer camera"
      class="w-full h-full object-contain"
      @error="error = true"
      @load="error = false"
    />
  </div>
</template>
