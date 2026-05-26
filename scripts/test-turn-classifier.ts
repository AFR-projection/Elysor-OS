/**

 * Turn classifier smoke tests

 * Usage: npx tsx scripts/test-turn-classifier.ts

 */

import { classifyTurn } from "../services/agent/turn-classifier";



const cases: Array<{

  msg: string;

  expect: "casual" | "standard" | "complex";

  mode?: "hemat" | "sedang" | "max";

}> = [

  { msg: "halo bro", expect: "casual" },

  { msg: "apa kabar?", expect: "casual", mode: "sedang" },

  { msg: "apa kabar?", expect: "casual", mode: "hemat" },

  { msg: "jelaskan cara deploy nextjs", expect: "standard", mode: "sedang" },

  { msg: "jelaskan cara deploy nextjs", expect: "standard", mode: "hemat" },

  { msg: "buatkan pdf sederhana buat testing", expect: "standard" },

  {

    msg: "Prediksi harga emas 2 bulan ke depan lengkap kapan jual beli kirim PDF",

    expect: "complex",

  },

  { msg: "bandingkan React vs Vue dan buat chart statistiknya", expect: "complex" },

];



let failed = 0;

for (const c of cases) {

  const tier = classifyTurn(c.msg, false, c.mode ?? "sedang").tier;

  const ok = tier === c.expect;

  const modeLabel = c.mode ?? "sedang";

  console.log(

    `${ok ? "PASS" : "FAIL"} · [${modeLabel}] "${c.msg.slice(0, 40)}…" → ${tier} (expected ${c.expect})`

  );

  if (!ok) failed++;

}



const maxBoost = classifyTurn(

  "Analisa langkah-langkah optimasi SEO untuk blog pribadi saya",

  false,

  "max"

);

if (maxBoost.tier !== "complex" && maxBoost.maxToolRounds < 6) {

  console.log("FAIL · max mode should boost depth for analytical questions");

  failed++;

} else {

  console.log("PASS · max mode boosts analytical depth");

}



if (failed > 0) process.exit(1);

console.log("All turn classifier tests passed");

