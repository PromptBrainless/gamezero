/**
 * Google authentication without third-party dependencies.
 *
 * Supported methods (all read-only, scope drive.readonly):
 *   oauth            Desktop-app OAuth client + refresh token cached outside the repo
 *   service-account  Service-account JSON key (share the Drive folder with its e-mail)
 *   access-token     Short-lived bearer token, e.g. `gcloud auth print-access-token`
 *   api-key          API key, only for folders shared as "Anyone with the link"
 */
import { createHash, createSign, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { resolveUserPath } from "./config.mjs";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const DEFAULT_AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth";
const EXPIRY_MARGIN_MS = 60_000;
const LOGIN_TIMEOUT_MS = 5 * 60_000;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function readJsonFile(file, label) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${label} ${file}: ${error.message}`);
  }
}

async function postForm(fetchImpl, url, form) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: text.slice(0, 200) };
  }
  if (!response.ok) {
    const detail = body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(`Token request to ${new URL(url).host} failed: ${detail}`);
  }
  return body;
}

/** Load a Desktop/Web OAuth client file as downloaded from Google Cloud Console. */
export function readOAuthClient(file) {
  const raw = readJsonFile(file, "OAuth client file");
  const client = raw.installed ?? raw.web ?? raw;
  if (!client.client_id) throw new Error(`OAuth client file ${file} has no client_id.`);
  return {
    clientId: client.client_id,
    clientSecret: client.client_secret ?? "",
    authUri: client.auth_uri ?? DEFAULT_AUTH_URI,
    tokenUri: client.token_uri ?? DEFAULT_TOKEN_URI,
  };
}

/** Write a token file with owner-only permissions (atomic rename). */
export function writeTokenFile(file, data) {
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, file);
  try {
    chmodSync(file, 0o600);
  } catch {
    // Not supported on every filesystem (e.g. Windows); the file still lives outside the repo.
  }
}

/** Bearer-token auth that caches the access token until shortly before expiry. */
class BearerAuth {
  constructor(method, description, fetchToken) {
    this.method = method;
    this.description = description;
    this.fetchToken = fetchToken;
    this.token = null;
    this.expiresAt = 0;
  }

  async accessToken() {
    if (!this.token || Date.now() >= this.expiresAt - EXPIRY_MARGIN_MS) {
      const { token, expiresIn } = await this.fetchToken();
      this.token = token;
      this.expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : Number.POSITIVE_INFINITY;
    }
    return this.token;
  }

  invalidate() {
    this.token = null;
    this.expiresAt = 0;
  }

  async apply(url, headers) {
    headers.set("authorization", `Bearer ${await this.accessToken()}`);
    return url;
  }
}

class ApiKeyAuth {
  constructor(key) {
    this.method = "api-key";
    this.description = "API key (public 'Anyone with the link' folders only)";
    this.key = key;
  }

  invalidate() {}

  async apply(url) {
    url.searchParams.set("key", this.key);
    return url;
  }
}

export function serviceAccountAuth(keyFile, fetchImpl = fetch) {
  const key = readJsonFile(keyFile, "service-account key");
  if (key.type !== "service_account" || !key.client_email || !key.private_key) {
    throw new Error(`${keyFile} is not a service-account key (expected type "service_account").`);
  }
  const tokenUri = key.token_uri ?? DEFAULT_TOKEN_URI;
  return new BearerAuth("service-account", `service account ${key.client_email}`, async () => {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: key.private_key_id }));
    const claims = base64url(
      JSON.stringify({
        iss: key.client_email,
        scope: DRIVE_SCOPE,
        aud: tokenUri,
        iat: now,
        exp: now + 3600,
      }),
    );
    const signature = createSign("RSA-SHA256")
      .update(`${header}.${claims}`)
      .sign(key.private_key, "base64url");
    const body = await postForm(fetchImpl, tokenUri, {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    });
    return { token: body.access_token, expiresIn: body.expires_in };
  });
}

export function oauthAuth(clientFile, tokenFile, fetchImpl = fetch) {
  const client = readOAuthClient(clientFile);
  const stored = readJsonFile(tokenFile, "OAuth token file");
  if (!stored.refresh_token)
    throw new Error(`${tokenFile} has no refresh_token; run "auth login" again.`);
  return new BearerAuth("oauth", `OAuth user token (${tokenFile})`, async () => {
    const body = await postForm(fetchImpl, client.tokenUri, {
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: client.clientId,
      client_secret: client.clientSecret,
    });
    return { token: body.access_token, expiresIn: body.expires_in };
  });
}

export function accessTokenAuth(token) {
  return new BearerAuth(
    "access-token",
    "static access token (GOOGLE_DRIVE_ACCESS_TOKEN)",
    async () => ({
      token,
      expiresIn: 0,
    }),
  );
}

export function apiKeyAuth(key) {
  return new ApiKeyAuth(key);
}

/**
 * Pick an auth provider for the configured method.
 * @param {object} authConfig config.auth
 * @param {{ env?: NodeJS.ProcessEnv, fetchImpl?: typeof fetch, accessToken?: string, apiKey?: string }} options
 */
export function createAuth(
  authConfig,
  { env = process.env, fetchImpl = fetch, accessToken, apiKey } = {},
) {
  const method = authConfig.method;
  const token = accessToken || env.GOOGLE_DRIVE_ACCESS_TOKEN;
  const key = apiKey || env.GOOGLE_DRIVE_API_KEY;
  const serviceAccountFile = resolveUserPath(authConfig.serviceAccountKeyFile);
  const clientFile = resolveUserPath(authConfig.oauthClientFile);
  const tokenFile = resolveUserPath(authConfig.tokenFile);

  const available = {
    "access-token": () => (token ? accessTokenAuth(token) : null),
    "service-account": () =>
      serviceAccountFile && existsSync(serviceAccountFile)
        ? serviceAccountAuth(serviceAccountFile, fetchImpl)
        : null,
    oauth: () =>
      clientFile && tokenFile && existsSync(clientFile) && existsSync(tokenFile)
        ? oauthAuth(clientFile, tokenFile, fetchImpl)
        : null,
    "api-key": () => (key ? apiKeyAuth(key) : null),
  };

  if (method !== "auto") {
    const provider = available[method]?.();
    if (provider) return provider;
    const hints = {
      "access-token": "set GOOGLE_DRIVE_ACCESS_TOKEN or pass --access-token",
      "service-account": `put the key at ${serviceAccountFile || "auth.serviceAccountKeyFile"} or set GOOGLE_APPLICATION_CREDENTIALS`,
      oauth: `place the OAuth client at ${clientFile} and run "npm run drive:auth"`,
      "api-key": "set GOOGLE_DRIVE_API_KEY",
    };
    throw new Error(`Auth method "${method}" is not configured: ${hints[method]}.`);
  }

  for (const candidate of ["access-token", "service-account", "oauth", "api-key"]) {
    const provider = available[candidate]();
    if (provider) return provider;
  }
  throw new Error(
    [
      "No Google credentials found. Configure one of:",
      `  - OAuth (recommended): save the Desktop OAuth client JSON to ${clientFile} and run "npm run drive:auth"`,
      "  - Service account: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json and share the folder with its e-mail",
      "  - Access token: GOOGLE_DRIVE_ACCESS_TOKEN=$(gcloud auth print-access-token)",
      "  - API key (public link-shared folders only): GOOGLE_DRIVE_API_KEY=...",
      "See tools/import/README.md#authentication.",
    ].join("\n"),
  );
}

function openBrowser(url) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // Opening a browser is best effort; the URL is always printed.
  }
}

function buildAuthUrl(client, redirectUri, challenge, state) {
  const url = new URL(client.authUri);
  url.search = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  }).toString();
  return url.toString();
}

/**
 * Start a one-shot loopback HTTP server for the OAuth redirect.
 * Resolves with { port, code } where code is a promise of the authorisation code.
 */
export function startLoopbackReceiver(expectedState, timeoutMs = LOGIN_TIMEOUT_MS) {
  return new Promise((resolveStart, rejectStart) => {
    let settle;
    const code = new Promise((resolveCode, rejectCode) => {
      settle = { resolveCode, rejectCode };
    });
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const received = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const state = url.searchParams.get("state");
      if (!received && !error) {
        response.writeHead(404).end();
        return;
      }
      const ok = Boolean(received) && state === expectedState;
      response.writeHead(ok ? 200 : 400, { "content-type": "text/plain; charset=utf-8" });
      response.end(
        ok
          ? "GameZero Drive import: authorised. You can close this tab."
          : "Authorisation failed. Check the terminal.",
      );
      clearTimeout(timer);
      server.close();
      if (error) settle.rejectCode(new Error(`Google returned an error: ${error}`));
      else if (state !== expectedState)
        settle.rejectCode(new Error("OAuth state mismatch; aborting."));
      else settle.resolveCode(received);
    });
    const timer = setTimeout(() => {
      server.close();
      settle.rejectCode(new Error("Timed out waiting for the browser authorisation (5 minutes)."));
    }, timeoutMs);
    timer.unref?.();
    server.once("error", (error) => {
      clearTimeout(timer);
      rejectStart(error);
    });
    server.listen(0, "127.0.0.1", () => resolveStart({ port: server.address().port, code }));
  });
}

/**
 * Interactive OAuth consent for a Desktop OAuth client. Stores the refresh
 * token in tokenFile (outside the repository by default).
 */
export async function oauthLogin({
  clientFile,
  tokenFile,
  manual = false,
  openUrl = true,
  log = console.log,
  fetchImpl = fetch,
}) {
  const client = readOAuthClient(clientFile);
  const verifier = base64url(randomBytes(48));
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = base64url(randomBytes(24));

  let code;
  let redirectUri;
  if (manual) {
    redirectUri = "http://127.0.0.1:8085";
    log("Open this URL in any browser, approve access, then copy the full address of the page it");
    log("redirects to (it will fail to load - that is expected) and paste it here:\n");
    log(buildAuthUrl(client, redirectUri, challenge, state));
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const pasted = (await rl.question("\nRedirected URL: ")).trim();
    rl.close();
    const url = new URL(pasted);
    if (url.searchParams.get("state") !== state) throw new Error("OAuth state mismatch; aborting.");
    code = url.searchParams.get("code");
    if (!code) throw new Error(`No authorisation code in ${pasted}`);
  } else {
    const receiver = await startLoopbackReceiver(state);
    redirectUri = `http://127.0.0.1:${receiver.port}`;
    const authUrl = buildAuthUrl(client, redirectUri, challenge, state);
    log("Opening your browser for Google sign-in. If it does not open, visit:\n");
    log(authUrl);
    log("\nWaiting for authorisation...");
    if (openUrl) openBrowser(authUrl);
    code = await receiver.code;
  }

  const body = await postForm(fetchImpl, client.tokenUri, {
    grant_type: "authorization_code",
    code,
    client_id: client.clientId,
    client_secret: client.clientSecret,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  if (!body.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Remove the app's access at https://myaccount.google.com/permissions and retry.",
    );
  }
  writeTokenFile(tokenFile, {
    type: "authorized_user",
    client_id: client.clientId,
    refresh_token: body.refresh_token,
    scope: body.scope ?? DRIVE_SCOPE,
    created_at: new Date().toISOString(),
  });
  log(`\nSaved refresh token to ${tokenFile} (permissions 600, outside git).`);
}
