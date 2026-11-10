# Deadline countdown

Angular countdown for `GET /api/deadline`, which returns `{ "secondsLeft": number }`. The deadline never changes, so the app requests it once, turns that value into an absolute timestamp, and updates the display locally.

The screen shows `Seconds left to deadline: X`, where X is the whole seconds remaining and refreshes when that second changes.

## Drop into another Angular app

Copy `src/app/deadline/` except the spec files. Provide `provideHttpClient()`, and put `<app-deadline-countdown>` in a template. Leave out `src/app/deadline-demo.interceptor.ts`; that file only lets this demo run without a backend.

The service shares one request and one timer across every countdown on the page. The timer runs only while a countdown is mounted, stays aligned to the deadline, and stops at zero. In an app that still uses Zone.js, the timer is scheduled outside `NgZone` so a tick does not change-detect the rest of the tree. This project itself is zoneless. Coming back to a backgrounded tab republishes the real remaining time immediately.

## Run this demo

```bash
npm install
npm test
npm start
```

The demo answers `/api/deadline` with about 90 seconds left from the moment the page loads.
