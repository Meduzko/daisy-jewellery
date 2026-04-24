/** Minimal req-like shape for facebookCapi (IncomingMessage-style headers). */
export function requestToCapiReq(request) {
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return { headers, socket: { remoteAddress: undefined } };
}
