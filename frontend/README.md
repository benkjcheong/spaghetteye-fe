# spaghettimonster frontend

Vue 3 + Vite + TailwindCSS dashboard for the spaghettimonster backend.

## Dev

```bash
npm install
npm run dev
```

By default `/api/*` is proxied to `http://localhost:8000` (the FastAPI server
embedded in the Python backend). Override with `VITE_API_TARGET`:

```bash
VITE_API_TARGET=http://192.168.1.50:8000 npm run dev
```

## Views

- `/` — live printer snapshot (state, progress, layer, temps)
- `/events` — event log with SSE live updates
- `/camera` — latest captured camera frame
- `/detector` — AI failure detector status

## Build

```bash
npm run build
```

Outputs to `dist/`. Serve statically alongside the backend or via any static
host. Set `VITE_API_TARGET` only matters in dev; production builds call
`/api/*` directly, so the static host needs to reverse-proxy `/api` to the
backend.
