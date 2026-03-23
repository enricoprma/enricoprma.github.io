# Minimal Frontend

Dieses Frontend ist absichtlich minimal:

- eine statische Seite
- kein Build-Step
- liest `public.club_dashboard` direkt ueber die Supabase REST API

## Setup

1. Konfiguration kopieren:

```bash
cp frontend/config.example.js frontend/config.js
```

2. `frontend/config.js` befuellen:

```js
window.CLUB_VIEW_CONFIG = {
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your_public_anon_key',
  clubTag: '#808Q2UGJV',
  refreshMs: 60000,
};
```

Wichtig:

- hier kommt der **anon key** rein, nicht der `service_role` key
- der anon key ist fuer Browser-Code gedacht

## Lokal starten

Einfach den `frontend`-Ordner statisch ausliefern.

Mit Python:

```bash
cd frontend
python3 -m http.server 8080
```

Dann im Browser:

```text
http://localhost:8080
```

## Auf Hetzner deployen

Das Frontend kann spaeter ueber nginx, caddy oder jeden anderen statischen Webserver ausgeliefert werden. Fuer das MVP reicht auch erstmal ein einfacher statischer Host.
