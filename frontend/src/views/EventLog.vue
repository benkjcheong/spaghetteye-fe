<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { fetchEvents, openEventStream, type EventRecord } from '../api/client';

const events = ref<EventRecord[]>([]);
const streaming = ref(false);
const error = ref<string | null>(null);
let source: EventSource | null = null;

const kindStyle: Record<string, string> = {
  print_start: 'bg-sky-500/20 text-sky-300 ring-sky-500/40',
  print_resume: 'bg-sky-500/20 text-sky-300 ring-sky-500/40',
  print_pause: 'bg-amber-500/20 text-amber-300 ring-amber-500/40',
  print_finish: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40',
  print_fail: 'bg-rose-500/20 text-rose-300 ring-rose-500/40',
  print_error: 'bg-rose-500/20 text-rose-300 ring-rose-500/40',
  hms: 'bg-amber-500/20 text-amber-300 ring-amber-500/40',
  spaghetti_detected: 'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-500/40',
};

function kindClass(kind: string) {
  return kindStyle[kind] ?? 'bg-slate-600/20 text-slate-300 ring-slate-500/40';
}

function fmtTs(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

onMounted(async () => {
  try {
    events.value = (await fetchEvents(100)).reverse();
  } catch (e) {
    error.value = (e as Error).message;
  }
  source = openEventStream((ev) => {
    events.value.unshift(ev);
    if (events.value.length > 200) events.value.length = 200;
  });
  source.onopen = () => (streaming.value = true);
  source.onerror = () => (streaming.value = false);
});

onUnmounted(() => {
  source?.close();
});
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-mono text-xl">Event Log</h2>
      <div class="flex items-center gap-2 text-xs font-mono">
        <span
          class="inline-block w-2 h-2 rounded-full"
          :class="streaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"
        ></span>
        <span class="text-slate-400">{{ streaming ? 'live' : 'disconnected' }}</span>
      </div>
    </div>

    <div v-if="error" class="rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-2 text-sm font-mono">
      {{ error }}
    </div>

    <div v-if="!events.length" class="text-slate-500 text-sm font-mono">
      No events yet. Events show up here when the printer state changes.
    </div>

    <ul class="space-y-2">
      <li
        v-for="ev in events"
        :key="`${ev.ts}-${ev.kind}-${ev.title}`"
        class="bg-panel rounded-lg ring-1 ring-slate-800 px-4 py-3"
      >
        <div class="flex items-center justify-between gap-3">
          <span
            class="inline-flex px-2 py-0.5 rounded text-xs ring-1 font-mono"
            :class="kindClass(ev.kind)"
          >
            {{ ev.kind }}
          </span>
          <span class="text-xs text-slate-500 font-mono">{{ fmtTs(ev.ts) }}</span>
        </div>
        <div class="mt-1.5 text-sm">{{ ev.title }}</div>
        <div v-if="ev.detail" class="text-xs text-slate-400 mt-1 font-mono">{{ ev.detail }}</div>
        <div v-if="ev.file" class="text-xs text-slate-500 mt-1 font-mono truncate">
          file: {{ ev.file }}
        </div>
        <div v-if="ev.layer !== null && ev.layer_total !== null" class="text-xs text-slate-500 font-mono">
          layer {{ ev.layer }} / {{ ev.layer_total }}
          <span v-if="ev.percent !== null">({{ ev.percent }}%)</span>
        </div>
        <div v-if="ev.hms_code" class="text-xs text-amber-300 font-mono">HMS: {{ ev.hms_code }}</div>
      </li>
    </ul>
  </section>
</template>
