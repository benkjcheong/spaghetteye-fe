import { createRouter, createWebHistory } from 'vue-router';
import PrinterStatus from '../views/PrinterStatus.vue';
import EventLog from '../views/EventLog.vue';
import CameraFrame from '../views/CameraFrame.vue';
import DetectorPanel from '../views/DetectorPanel.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'status', component: PrinterStatus, meta: { label: 'Status' } },
    { path: '/events', name: 'events', component: EventLog, meta: { label: 'Events' } },
    { path: '/camera', name: 'camera', component: CameraFrame, meta: { label: 'Camera' } },
    { path: '/detector', name: 'detector', component: DetectorPanel, meta: { label: 'Detector' } },
  ],
});
