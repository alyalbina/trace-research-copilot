const base = process.env.TRACE_BASE_URL || "http://localhost:5173";
const response = await fetch(base + "/api/workspace", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "seed" }),
});
const data = await response.json();
console.log(response.ok ? data.message : data.error);
if (!response.ok) process.exitCode = 1;
