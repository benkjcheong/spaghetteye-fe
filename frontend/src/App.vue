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

type Action = 'pause' | 'resume' | 'stop';

const canPause = computed(() => state.value === 'RUNNING');
const canResume = computed(() => state.value === 'PAUSE');
const canStop = computed(() => state.value === 'RUNNING' || state.value === 'PAUSE');

const confirmStop = ref(false);
const toast = ref<{ msg: string; kind: 'ok' | 'err' } | null>(null);
const sending = ref<Action | null>(null);
let toastTimer: number | undefined;

function showToast(msg: string, kind: 'ok' | 'err') {
  toast.value = { msg, kind };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), 3500);
}

async function sendControl(action: Action) {
  sending.value = action;
  try {
    const r = await fetch(`/api/print/${action}`, { method: 'POST' });
    const body = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (r.ok && body.ok) {
      showToast(`${action} sent`, 'ok');
      tickSnapshot();
    } else {
      showToast(`${action} failed: ${body.error ?? r.status}`, 'err');
    }
  } catch (e) {
    showToast(`${action} error: ${(e as Error).message}`, 'err');
  } finally {
    sending.value = null;
  }
}

function requestStop() {
  confirmStop.value = true;
}

async function confirmStopYes() {
  confirmStop.value = false;
  await sendControl('stop');
}
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

        <div>
          <div class="text-xs uppercase tracking-wider text-text-muted">Control</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              class="pill px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-tile"
              :disabled="!canPause || sending !== null"
              @click="sendControl('pause')"
            >
              {{ sending === 'pause' ? '…' : 'Pause' }}
            </button>
            <button
              class="pill px-3 py-1.5 text-sm ring-1 ring-line disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-tile"
              :disabled="!canResume || sending !== null"
              @click="sendControl('resume')"
            >
              {{ sending === 'resume' ? '…' : 'Resume' }}
            </button>
            <button
              class="pill px-3 py-1.5 text-sm ring-1 ring-state-fail/40 text-state-fail bg-state-fail/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-state-fail/20"
              :disabled="!canStop || sending !== null"
              @click="requestStop"
            >
              {{ sending === 'stop' ? '…' : 'Stop' }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <div
      v-if="confirmStop"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="confirmStop = false"
    >
      <div class="bg-white rounded-xl ring-1 ring-line p-6 max-w-sm shadow-xl">
        <div class="text-lg font-semibold">Stop print?</div>
        <div class="mt-2 text-sm text-text-muted">
          This cancels the current print on the printer. The print cannot be resumed afterwards.
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            class="pill px-3 py-1.5 text-sm ring-1 ring-line hover:bg-bg-tile"
            @click="confirmStop = false"
          >
            Cancel
          </button>
          <button
            class="pill px-3 py-1.5 text-sm ring-1 ring-state-fail/40 text-state-fail bg-state-fail/10 hover:bg-state-fail/20"
            @click="confirmStopYes"
          >
            Stop print
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="toast"
      class="fixed top-4 right-4 z-50 pill px-3 py-1.5 text-sm ring-1 shadow-md"
      :class="toast.kind === 'ok' ? GREEN_CLS : RED_CLS"
    >
      {{ toast.msg }}
    </div>

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
