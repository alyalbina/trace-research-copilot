/** Compare the browser Origin with the incoming Host, not an internal proxy URL. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.host === (request.headers.get("host") ?? new URL(request.url).host)
    );
  } catch {
    return false;
  }
}
