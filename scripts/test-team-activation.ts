/**
 * Team activation gate tests
 * Usage: npx tsx scripts/test-team-activation.ts
 */
import {
  scoreTeamMissionNeed,
  shouldActivateTeamMode,
} from "../services/agent/team-planner";
import type { AgentPlan } from "../types/plan";

const basePlan = (
  complexity: AgentPlan["complexity"],
  tools: string[] = []
): AgentPlan => ({
  summary: "Test",
  intent: "general",
  complexity,
  tools_needed: tools,
  steps: tools.map((t, i) => ({
    id: String(i + 1),
    title: t,
    tool: t,
    status: "pending",
  })),
});

const cases: Array<{
  msg: string;
  plan: AgentPlan;
  mode?: "hemat" | "sedang" | "max";
  expect: boolean;
}> = [
  {
    msg: "apa itu React?",
    plan: basePlan("moderate"),
    expect: false,
  },
  {
    msg: "search berita AI hari ini dan ringkas",
    plan: basePlan("moderate", ["web_search"]),
    expect: false,
  },
  {
    msg: "jelaskan cara deploy nextjs",
    plan: basePlan("moderate"),
    expect: false,
  },
  {
    msg: "bandingkan React vs Vue dan buat chart statistiknya",
    plan: basePlan("complex", ["web_search"]),
    mode: "sedang",
    expect: true,
  },
  {
    msg: "Prediksi harga emas 2 bulan ke depan lengkap kapan jual beli kirim PDF",
    plan: basePlan("complex", ["web_search", "file_export"]),
    mode: "sedang",
    expect: true,
  },
  {
    msg: "halo bro",
    plan: basePlan("simple"),
    expect: false,
  },
];

let failed = 0;
for (const c of cases) {
  const ok =
    shouldActivateTeamMode(c.msg, c.plan, false, c.mode ?? "sedang") ===
    c.expect;
  console.log(
    `${ok ? "PASS" : "FAIL"} · "${c.msg.slice(0, 45)}…" → team=${c.expect ? "on" : "off"} (score=${scoreTeamMissionNeed(c.msg, c.plan)})`
  );
  if (!ok) failed++;
}

if (failed > 0) process.exit(1);
console.log("All team activation tests passed");
