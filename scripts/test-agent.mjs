/** @typedef {import('../types/agent').AgentStreamEvent} AgentStreamEvent */

import { config } from "dotenv";
config({ path: ".env.local" });

import { runAgent } from "../services/agent/orchestrator.js";

async function main() {
  /** @type {AgentStreamEvent[]} */
  const events = [];
  for await (const event of runAgent({
    messages: [{ role: "user", content: "Bandingkan React vs Vue (chart)" }],
    timezone: "Asia/Jakarta",
  })) {
    events.push(event);
    if (event.type === "error") {
      console.error("\n=== ERROR ===");
      console.error(event.message);
    }
    if (event.type === "done") {
      console.log("\n=== DONE (first 300 chars) ===");
      console.log(event.content.slice(0, 300));
    }
  }
  console.log("\nPipeline:", events.map((e) => e.type).join(" → "));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
