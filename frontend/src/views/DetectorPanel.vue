<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { fetchDetector, type DetectorStatus } from '../api/client';

const status = ref<DetectorStatus | null>(null);
const error = ref<string | null>(null);
let timer: number | undefined;

async function tick() {
  try {
    status.value = await fetchDetector();
    error.value = null;
  } catch (e) {
    error.value = (e as Error).message;
  }
}

onMounted(() => {
  tick();
  timer = window.setInterval(tick, 3000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

const enabledBadge = computed(() => {
  if (!status.value) return 'bg-slate-700/40 text-slate-300 ring-slate-600/40';
  return status.value.enabled
    ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
    : 'bg-slate-700/40 text-slate-400 ring-slate-600/40';
});

const alertBadge = computed(() => {
  if (!status.value?.alerted) return 'bg-slate-700/40 text-slate-400 ring-slate-600/40';
  return 'bg-rose-500/20 text-rose-300 ring-rose-500/40';
});

function fmtConf(v: number | null) {
  return v === null ? '—' : `${(v * 100).toFixed(1)}%`;
}

function fmtTick(ts: number | null) {
  if (!ts) return '—';
  const ago = Math.max(0, Math.round(Date.now() / 1000 - ts));
  return `${ago}s ago`;
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-baseline justify-between">
      <h2 class="font-mono text-xl">Spaghetti Detector</h2>
      <span
        class="inline-flex px-2 py-0.5 rounded text-xs ring-1 font-mono"
        :class="enabledBadge"
      >
        {{ status?.enabled ? 'enabled' : 'disabled' }}
      </span>
    </div>

    <div v-if="error" class="rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-2 text-sm font-mono">
      {{ error }}
    </div>

    <div v-if="!status?.enabled" class="bg-panel rounded-lg ring-1 ring-slate-800 px-5 py-4 text-sm text-slate-400">
      AI detection is off. Set <code class="font-mono text-slate-200">SPAGHETTI_AI_ENABLED=true</code> in your backend
      <code class="font-mono text-slate-200">.env</code> and restart the daemon.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Last Tick</div>
        <div class="mt-2 text-2xl font-mono">{{ fmtTick(status?.last_tick_ts ?? null) }}</div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Last Confidence</div>
        <div class="mt-2 text-2xl font-mono">{{ fmtConf(status?.last_confidence ?? null) }}</div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Consecutive Hits</div>
        <div class="mt-2 text-2xl font-mono">{{ status?.consecutive_hits ?? 0 }}</div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Alert Fired</div>
        <span
          class="mt-2 inline-flex px-2 py-0.5 rounded text-xs ring-1 font-mono"
          :class="alertBadge"
        >
          {{ status?.alerted ? 'YES' : 'no' }}
        </span>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800 md:col-span-2">
        <div class="text-xs uppercase text-slate-500 font-mono">Last Detector Summary</div>
        <div class="mt-2 text-sm font-mono text-slate-300 break-words">
          {{ status?.last_summary ?? '—' }}
        </div>
      </div>
    </div>
  </section>
</template>
