<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

type Snapshot = {
  gcode_state?: string;
  subtask_name?: string;
  mc_remaining_time?: number;
};

type Detector = {
  last_confidence: number | null;
  alerted: boolean;
};

const snapshot = ref<Snapshot>({});
const detector = ref<Detector | null>(null);
const frameSrc = ref(`/api/frame.jpg?ts=${Date.now()}`);
const frameError = ref(false);

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(path);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function tickSnapshot() {
  const data = await fetchJSON<{ snapshot: Snapshot }>('/api/snapshot');
  if (data?.snapshot) snapshot.value = data.snapshot;
}

async function tickDetector() {
  const data = await fetchJSON<Detector>('/api/detector');
  if (data) detector.value = data;
}

function tickFrame() {
  frameSrc.value = `/api/frame.jpg?ts=${Date.now()}`;
}

let snapTimer: number | undefined;
let detTimer: number | undefined;
let frameTimer: number | undefined;

onMounted(() => {
  tickSnapshot();
  tickDetector();
  snapTimer = window.setInterval(tickSnapshot, 2000);
  detTimer = window.setInterval(tickDetector, 3000);
  frameTimer = window.setInterval(tickFrame, 5000);
});

onUnmounted(() => {
  if (snapTimer) clearInterval(snapTimer);
  if (detTimer) clearInterval(detTimer);
  if (frameTimer) clearInterval(frameTimer);
});

const state = computed(() => (snapshot.value.gcode_state ?? 'IDLE').toUpperCase());
const file = computed(() => snapshot.value.subtask_name ?? '—');

const eta = computed(() => {
  const m = snapshot.value.mc_remaining_time;
  if (!m || m <= 0) return '—';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
});

const confidence = computed(() => {
  const c = detector.value?.last_confidence;
  return c === null || c === undefined ? '—' : `${(c * 100).toFixed(1)}%`;
});

const GREEN_CLS = 'text-state-running ring-state-running/40 bg-state-running/10';
const RED_CLS = 'text-state-fail ring-state-fail/40 bg-state-fail/10';
const GREEN_STATES = new Set(['RUNNING', 'PREPARE', 'FINISH', 'IDLE']);

const stateLabels: Record<string, string> = {
  RUNNING: 'Printing',
  PAUSE: 'Paused',
  PREPARE: 'Preparing',
  FINISH: 'Finished',
  FAILED: 'Failed',
  IDLE: 'Idle',
};

const stateView = computed(() => ({
  label: stateLabels[state.value] ?? state.value,
  cls: GREEN_STATES.has(state.value) ? GREEN_CLS : RED_CLS,
}));
</script>

<template>
  <div class="h-screen w-screen p-6 grid grid-cols-12 gap-6 bg-white">
    <aside class="panel col-span-3 justify-between">
      <div class="space-y-6">
        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">State</div>
          <div class="mt-2">
            <span class="pill px-3 py-1.5 text-sm" :class="stateView.cls">
              {{ stateView.label }}
            </span>
          </div>
        </div>

        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">File</div>
          <div class="mt-2 font-mono text-xl break-all">{{ file }}</div>
        </div>

        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">ETA</div>
          <div class="mt-2 font-mono text-xl">{{ eta }}</div>
        </div>
      </div>
    </aside>

    <main class="col-span-6 flex">
      <div class="w-full h-full bg-bg-tile rounded-xl ring-1 ring-line overflow-hidden flex items-center justify-center">
        <div v-if="frameError" class="text-text-muted font-mono text-sm text-center px-6">No frame yet.</div>
        <img
          v-else
          :src="frameSrc"
          alt="printer camera"
          class="w-full h-full object-contain"
          @error="frameError = true"
          @load="frameError = false"
        />
      </div>
    </main>

    <aside class="panel col-span-3 justify-between">
      <div class="space-y-6">
        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">Alert</div>
          <div class="mt-2">
            <span
              class="pill px-3 py-1.5 text-sm"
              :class="detector?.alerted ? RED_CLS : GREEN_CLS"
            >
              {{ detector?.alerted ? 'Spaghetti detected' : 'No issues' }}
            </span>
          </div>
        </div>

        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">Confidence</div>
          <div class="mt-2 font-mono text-xl">{{ confidence }}</div>
        </div>
      </div>
    </aside>
  </div>
</template>
