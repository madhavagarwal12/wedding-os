// Ramping read-heavy load test: ramps 0 -> 500 VUs, holds, then spikes to
// 1000 VUs, hitting the pages a staff member actually spends time on
// (dashboard, leads list, tasks, a wedding detail page, reports). Run against
// a `npm run build && npm run start` (production) instance, not `npm run
// dev` (dev mode recompiles on the fly and its numbers aren't representative
// of anything).
//
//   BASE_URL=http://localhost:3000 k6 run load-tests/ramping-load.js
//
// See load-tests/README.md for the full explanation of these thresholds,
// what was actually run on this machine, and honest caveats about running
// this at full scale on a laptop.
import http from "k6/http";
import { check, group, sleep } from "k6";
import { BASE_URL, login } from "./common.js";

export const options = {
  scenarios: {
    ramp_then_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 200 }, // warm-up ramp
        { duration: "3m", target: 500 }, // to steady target load
        { duration: "5m", target: 500 }, // hold at target load
        { duration: "1m", target: 1000 }, // spike to peak burst
        { duration: "2m", target: 1000 }, // hold at peak
        { duration: "2m", target: 0 }, // ramp down
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    // p95 < 1s for reads is a reasonable bar for an internal ops tool where
    // staff expect near-instant page loads but this isn't a consumer-facing
    // product with SLA-grade latency requirements. Login (a POST with a
    // bcrypt compare — deliberately slow, ~50-150ms hashing cost) is
    // tracked separately with a looser bound so it doesn't skew the read
    // thresholds.
    http_req_duration: ["p(95)<1000"],
    "http_req_duration{name:login}": ["p(95)<2000"],
    // < 1% error rate: a handful of transient errors under a 1000-VU spike
    // against a single laptop-class Postgres instance is expected and not
    // itself a failure signal, but a sustained higher rate would indicate
    // real exhaustion (connection pool, memory, etc).
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  // Discover a real wedding id to hit /weddings/[id] with, rather than
  // hardcoding one that may not exist in whatever DB this is pointed at.
  const jar = login();
  const listRes = http.get(`${BASE_URL}/weddings`, { jar });
  const match = listRes.body.match(/\/weddings\/([a-z0-9]+)/);
  const weddingId = match ? match[1] : null;
  return { weddingId };
}

export default function rampingLoadScenario(data) {
  const jar = login();

  group("dashboard", () => {
    const res = http.get(`${BASE_URL}/dashboard`, { jar, tags: { name: "dashboard" } });
    check(res, { "dashboard 200": (r) => r.status === 200 });
  });
  sleep(1);

  group("leads list", () => {
    const res = http.get(`${BASE_URL}/leads`, { jar, tags: { name: "leads_list" } });
    check(res, { "leads 200": (r) => r.status === 200 });
  });
  sleep(1);

  group("tasks", () => {
    const res = http.get(`${BASE_URL}/tasks`, { jar, tags: { name: "tasks_list" } });
    check(res, { "tasks 200": (r) => r.status === 200 });
  });
  sleep(1);

  if (data.weddingId) {
    group("wedding detail", () => {
      const res = http.get(`${BASE_URL}/weddings/${data.weddingId}`, {
        jar,
        tags: { name: "wedding_detail" },
      });
      check(res, { "wedding detail 200": (r) => r.status === 200 });
    });
    sleep(1);
  }

  group("reports", () => {
    const res = http.get(`${BASE_URL}/reports`, { jar, tags: { name: "reports" } });
    check(res, { "reports 200": (r) => r.status === 200 });
  });
  sleep(1);

  group("calendar", () => {
    const res = http.get(`${BASE_URL}/calendar`, { jar, tags: { name: "calendar" } });
    check(res, { "calendar 200": (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 1);
}
