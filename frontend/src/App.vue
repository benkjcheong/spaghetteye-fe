<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { onMounted, ref } from 'vue';

const apiOnline = ref<boolean | null>(null);

async function pingHealth() {
  try {
    const res = await fetch('/api/health');
    apiOnline.value = res.ok;
  } catch {
    apiOnline.value = false;
  }
}

onMounted(() => {
  pingHealth();
  setInterval(pingHealth, 10_000);
});

const nav = [
  { to: '/', label: 'Status' },
  { to: '/events', label: 'Events' },
  { to: '/camera', label: 'Camera' },
  { to: '/detector', label: 'Detector' },
];
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-slate-800 bg-panel/60 backdrop-blur sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🍝</span>
          <h1 class="font-mono text-lg tracking-wider">spaghetti monster</h1>
        </div>
        <nav class="flex items-center gap-1">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="px-3 py-1.5 rounded text-sm font-mono text-slate-400 hover:text-slate-100"
            active-class="!text-accent bg-slate-800/60"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="flex items-center gap-2 font-mono text-xs">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="apiOnline === null ? 'bg-slate-500' : apiOnline ? 'bg-emerald-400' : 'bg-rose-500'"
          ></span>
          <span class="text-slate-400">
            {{ apiOnline === null ? 'checking' : apiOnline ? 'api online' : 'api offline' }}
          </span>
        </div>
      </div>
    </header>
    <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-6">
      <RouterView />
    </main>
  </div>
</template>
