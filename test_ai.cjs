async function test() {
  const resp = await fetch("https://grsaehpmaihrztusehkb.supabase.co/functions/v1/ai-helper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "debug:list-models", history: [] })
  });
  const text = await resp.text();
  console.log(text);
}
test();
