<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { fetchSnapshot, type PrinterSnapshot } from '../api/client';

const snapshot = ref<PrinterSnapshot>({});
const lastUpdate = ref<number | null>(null);
const error = ref<string | null>(null);
let timer: number | undefined;

async function tick() {
  try {
    snapshot.value = await fetchSnapshot();
    lastUpdate.value = Date.now();
    error.value = null;
  } catch (e) {
    error.value = (e as Error).message;
  }
}

onMounted(() => {
  tick();
  timer = window.setInterval(tick, 2000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

const stateColor = computed(() => {
  switch (snapshot.value.gcode_state) {
    case 'RUNNING':
      return 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40';
    case 'PAUSE':
      return 'bg-amber-500/20 text-amber-300 ring-amber-500/40';
    case 'FAILED':
      return 'bg-rose-500/20 text-rose-300 ring-rose-500/40';
    case 'FINISH':
      return 'bg-sky-500/20 text-sky-300 ring-sky-500/40';
    default:
      return 'bg-slate-700/40 text-slate-300 ring-slate-600/40';
  }
});

function formatRemaining(min?: number) {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-baseline justify-between">
      <h2 class="font-mono text-xl">Printer Status</h2>
      <span class="text-xs text-slate-500 font-mono">
        {{ lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'waiting…' }}
      </span>
    </div>

    <div v-if="error" class="rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-2 text-sm font-mono">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">State</div>
        <div
          class="mt-2 inline-flex px-3 py-1 rounded ring-1 font-mono text-sm"
          :class="stateColor"
        >
          {{ snapshot.gcode_state ?? '—' }}
        </div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Progress</div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-mono">{{ snapshot.mc_percent ?? 0 }}</span>
          <span class="text-slate-500">%</span>
        </div>
        <div class="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            class="h-full bg-accent"
            :style="{ width: `${Math.min(100, snapshot.mc_percent ?? 0)}%` }"
          ></div>
        </div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Time Remaining</div>
        <div class="mt-2 text-3xl font-mono">{{ formatRemaining(snapshot.mc_remaining_time) }}</div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800 md:col-span-2">
        <div class="text-xs uppercase text-slate-500 font-mono">Current File</div>
        <div class="mt-2 font-mono text-sm break-all">
          {{ snapshot.subtask_name ?? '—' }}
        </div>
        <div class="mt-3 text-xs text-slate-400 font-mono">
          Layer
          <span class="text-slate-100">{{ snapshot.layer_num ?? '—' }}</span>
          /
          <span class="text-slate-100">{{ snapshot.total_layer_num ?? '—' }}</span>
        </div>
      </div>

      <div class="bg-panel rounded-lg p-5 ring-1 ring-slate-800">
        <div class="text-xs uppercase text-slate-500 font-mono">Temps</div>
        <div class="mt-2 grid grid-cols-2 gap-3 font-mono text-sm">
          <div>
            <div class="text-slate-500 text-xs">Nozzle</div>
            <div>{{ snapshot.nozzle_temper ?? '—' }}°C</div>
          </div>
          <div>
            <div class="text-slate-500 text-xs">Bed</div>
            <div>{{ snapshot.bed_temper ?? '—' }}°C</div>
          </div>
        </div>
      </div>
    </div>

    <details class="bg-panel rounded-lg ring-1 ring-slate-800">
      <summary class="cursor-pointer px-5 py-3 text-sm font-mono text-slate-400">
        Raw snapshot
      </summary>
      <pre class="px-5 pb-5 text-xs font-mono text-slate-300 overflow-auto max-h-96">{{ JSON.stringify(snapshot, null, 2) }}</pre>
    </details>
  </section>
</template>
