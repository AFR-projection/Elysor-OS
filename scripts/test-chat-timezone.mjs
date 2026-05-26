const badTz = "pnhomphen cambodia";

const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "HALOI" }],
    timezone: badTz,
    conversationId: null,
  }),
});

const text = await res.text();
const hasDone = text.includes('"type":"done"');
const hasError = text.includes('"type":"error"');
const doneMatch = text.match(/"type":"done"[^}]*"content":"([^"]*)/);
const errorMatch = text.match(/"type":"error"[^}]*"message":"([^"]*)/);

console.log(
  JSON.stringify(
    {
      status: res.status,
      hasDone,
      hasError,
      content: doneMatch?.[1] ?? null,
      error: errorMatch?.[1] ?? null,
      eventCount: text.split("data:").length - 1,
    },
    null,
    2
  )
);

process.exit(hasDone && !hasError ? 0 : 1);
