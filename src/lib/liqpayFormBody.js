/** LiqPay server_url posts application/x-www-form-urlencoded; + in base64 must not become space. */
export function parseFormUrlEncoded(raw) {
  const out = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = decodeURIComponent(part.slice(0, i));
    const value = decodeURIComponent(part.slice(i + 1));
    out[key] = value;
  }
  return out;
}
