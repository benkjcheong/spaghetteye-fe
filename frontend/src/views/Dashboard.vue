<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import StatusPill from '../components/StatusPill.vue';
import CameraTile from '../components/CameraTile.vue';
import { useSnapshot } from '../composables/useSnapshot';
import { useDetector } from '../composables/useDetector';

const snap = useSnapshot();
const det = useDetector();

onUnmounted(() => {
  snap.release();
  det.release();
});

const { snapshot } = snap;
const detector = det.status;

const state = computed(() => snapshot.value.gcode_state ?? 'IDLE');
const file = computed(() => snapshot.value.subtask_name ?? '—');
const percent = computed(() => Math.max(0, Math.min(100, snapshot.value.mc_percent ?? 0)));

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
</script>

<template>
  <div class="h-screen w-screen p-6 grid grid-cols-12 gap-6 bg-white">
    <!-- Status (left) -->
    <aside class="panel col-span-3 justify-between">
      <div class="space-y-6">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">State</div>
          <div class="mt-2"><StatusPill :state="state" size="md" /></div>
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">File</div>
          <div class="mt-2 font-mono text-sm break-all">{{ file }}</div>
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">Progress</div>
          <div class="mt-2 font-mono text-5xl">
            {{ percent }}<span class="text-text-muted text-2xl">%</span>
          </div>
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">ETA</div>
          <div class="mt-2 font-mono text-3xl">{{ eta }}</div>
        </div>
      </div>
    </aside>

    <!-- Camera (center) -->
    <main class="col-span-6 flex">
      <CameraTile class="flex-1" />
    </main>

    <!-- Detector (right) -->
    <aside class="panel col-span-3 justify-between">
      <div class="space-y-6">
        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">Spaghetti Detector</div>
          <div class="mt-2">
            <span
              class="pill"
              :class="detector?.enabled ? 'text-brand ring-brand/40 bg-brand-soft' : 'text-text-muted ring-line bg-bg-tile'"
            >
              {{ detector?.enabled ? 'enabled' : 'disabled' }}
            </span>
          </div>
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">Confidence</div>
          <div class="mt-2 font-mono text-5xl">{{ confidence }}</div>
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-wider text-text-muted">Alert</div>
          <div class="mt-2">
            <span
              class="pill"
              :class="detector?.alerted ? 'text-state-fail ring-state-fail/40 bg-state-fail/10' : 'text-text-muted ring-line bg-bg-tile'"
            >
              {{ detector?.alerted ? 'FIRED' : 'clear' }}
            </span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
