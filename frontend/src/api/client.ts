export type PrinterSnapshot = Record<string, unknown> & {
  gcode_state?: string;
  subtask_name?: string;
  layer_num?: number;
  total_layer_num?: number;
  mc_percent?: number;
  mc_remaining_time?: number;
  nozzle_temper?: number;
  bed_temper?: number;
  print_error?: number;
};

export interface EventRecord {
  ts: number;
  kind: string;
  title: string;
  detail: string;
  file: string | null;
  layer: number | null;
  layer_total: number | null;
  percent: number | null;
  hms_code: string | null;
}

export interface DetectorStatus {
  enabled: boolean;
  last_tick_ts: number | null;
  last_confidence: number | null;
  last_summary: string | null;
  failure_detected: boolean | null;
  consecutive_hits: number;
  alerted: boolean;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchSnapshot(): Promise<PrinterSnapshot> {
  const data = await getJSON<{ snapshot: PrinterSnapshot }>('/api/snapshot');
  return data.snapshot ?? {};
}

export async function fetchEvents(limit = 50): Promise<EventRecord[]> {
  const data = await getJSON<{ events: EventRecord[] }>(`/api/events?limit=${limit}`);
  return data.events ?? [];
}

export async function fetchDetector(): Promise<DetectorStatus> {
  return getJSON<DetectorStatus>('/api/detector');
}

export function frameUrl(): string {
  return `/api/frame.jpg?ts=${Date.now()}`;
}

export function openEventStream(onMessage: (ev: EventRecord) => void): EventSource {
  const es = new EventSource('/api/stream');
  es.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data) as EventRecord);
    } catch {
      /* ignore malformed */
    }
  };
  return es;
}
