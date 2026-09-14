// One-time: get a Google refresh token for YOUR calendar.
//
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node server/google-auth.mjs
//
// Prints GOOGLE_REFRESH_TOKEN. Put that in Coolify. Do not commit it.

import { createServer } from "node:http";

const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const port = 4280;
const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
const scope = "https://www.googleapis.com/auth/calendar";

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then rerun.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end();
    return;
  }
  const err = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (err || !code) {
    res.writeHead(400);
    res.end(String(err || "missing code"));
    server.close();
    process.exit(1);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json = await tokenRes.json();
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });

  if (!json.refresh_token) {
    res.end(
      "No refresh_token. On the OAuth client, add this redirect URI, use prompt=consent, and sign in again.",
    );
    console.error(json);
    server.close();
    process.exit(1);
  }

  res.end("Got the refresh token. You can close this tab and go back to the terminal.");
  console.log("\nAdd this to Coolify (runtime env, not VITE_):\n");
  console.log(`GOOGLE_REFRESH_TOKEN=${json.refresh_token}\n`);
  server.close();
  process.exit(0);
});

server.listen(port, "127.0.0.1", () => {
  console.log("Authorized redirect URI to add in Google Cloud:");
  console.log(`  ${redirectUri}\n`);
  console.log("Open this URL, sign in with the Google account that owns the calendar:\n");
  console.log(authUrl.toString());
});
