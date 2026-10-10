import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import {
  DRIVE_SCOPE,
  createAuth,
  oauthAuth,
  oauthLogin,
  serviceAccountAuth,
  startLoopbackReceiver,
} from "../lib/auth.mjs";

const dir = mkdtempSync(join(tmpdir(), "gamezero-drive-auth-"));
after(() => rmSync(dir, { recursive: true, force: true }));

function tokenEndpoint(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const form = Object.fromEntries(new URLSearchParams(init.body));
    calls.push({ url: String(url), form });
    const body = handler(form);
    return new Response(JSON.stringify(body), { status: body.error ? 400 : 200 });
  };
  return { calls, fetchImpl };
}

test("service-account auth signs a valid RS256 JWT for drive.readonly", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const keyFile = join(dir, "sa.json");
  writeFileSync(
    keyFile,
    JSON.stringify({
      type: "service_account",
      client_email: "importer@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      private_key_id: "kid1",
      token_uri: "https://oauth2.example.test/token",
    }),
  );
  const { calls, fetchImpl } = tokenEndpoint(() => ({
    access_token: "sa-access",
    expires_in: 3600,
  }));
  const auth = serviceAccountAuth(keyFile, fetchImpl);
  const headers = new Headers();
  await auth.apply(new URL("https://www.googleapis.com/drive/v3/files"), headers);
  assert.equal(headers.get("authorization"), ["Bearer", "sa-access"].join(" "));
  await auth.apply(new URL("https://www.googleapis.com/drive/v3/files"), new Headers());
  assert.equal(calls.length, 1, "token is cached until expiry");

  const [header, claims, signature] = calls[0].form.assertion.split(".");
  const verified = createVerify("RSA-SHA256")
    .update(`${header}.${claims}`)
    .verify(publicKey, signature, "base64url");
  assert.ok(verified);
  const payload = JSON.parse(Buffer.from(claims, "base64url").toString());
  assert.equal(payload.scope, DRIVE_SCOPE);
  assert.equal(payload.aud, "https://oauth2.example.test/token");
  assert.equal(calls[0].form.grant_type, "urn:ietf:params:oauth:grant-type:jwt-bearer");
});

test("OAuth login (loopback + PKCE) stores a refresh token that later refreshes access tokens", async () => {
  const clientFile = join(dir, "client.json");
  const tokenFile = join(dir, "nested", "token.json");
  writeFileSync(
    clientFile,
    JSON.stringify({
      installed: {
        client_id: "cid.apps.googleusercontent.com",
        client_secret: "client-secret-value",
        auth_uri: "https://accounts.example.test/auth",
        token_uri: "https://oauth2.example.test/token",
      },
    }),
  );
  const { calls, fetchImpl } = tokenEndpoint((form) =>
    form.grant_type === "authorization_code"
      ? { access_token: "a1", refresh_token: "refresh-1", expires_in: 3600, scope: DRIVE_SCOPE }
      : { access_token: "a2", expires_in: 3600 },
  );

  let authUrl;
  const log = (line) => {
    if (line.startsWith("https://accounts.example.test/auth")) authUrl = new URL(line);
  };
  const login = oauthLogin({ clientFile, tokenFile, log, fetchImpl, openUrl: false });
  while (!authUrl) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
  assert.equal(authUrl.searchParams.get("scope"), DRIVE_SCOPE);
  const redirect = new URL(authUrl.searchParams.get("redirect_uri"));
  assert.equal(redirect.hostname, "127.0.0.1");

  const rejected = assert.rejects(login, /state mismatch/);
  const wrongState = await fetch(`${redirect}?code=x&state=wrong`);
  assert.equal(wrongState.status, 400);
  await rejected;

  // Second attempt with the correct state.
  authUrl = undefined;
  const retry = oauthLogin({ clientFile, tokenFile, log, fetchImpl, openUrl: false });
  while (!authUrl) await new Promise((resolve) => setTimeout(resolve, 10));
  const callback = new URL(authUrl.searchParams.get("redirect_uri"));
  callback.searchParams.set("code", "auth-code");
  callback.searchParams.set("state", authUrl.searchParams.get("state"));
  assert.equal((await fetch(callback)).status, 200);
  await retry;

  const exchange = calls.find((call) => call.form.grant_type === "authorization_code");
  assert.equal(exchange.form.code, "auth-code");
  assert.ok(exchange.form.code_verifier.length >= 43);
  const stored = JSON.parse(readFileSync(tokenFile, "utf8"));
  assert.equal(stored.refresh_token, "refresh-1");
  if (process.platform !== "win32") assert.equal(statSync(tokenFile).mode & 0o777, 0o600);

  const auth = oauthAuth(clientFile, tokenFile, fetchImpl);
  const headers = new Headers();
  await auth.apply(new URL("https://www.googleapis.com/x"), headers);
  assert.equal(headers.get("authorization"), ["Bearer", "a2"].join(" "));
});

test("loopback receiver times out", async () => {
  const receiver = await startLoopbackReceiver("state", 20);
  await assert.rejects(receiver.code, /Timed out/);
});

test("createAuth picks configured credentials and explains missing ones", () => {
  const empty = {
    method: "auto",
    oauthClientFile: join(dir, "none.json"),
    tokenFile: join(dir, "none-token.json"),
  };
  assert.throws(() => createAuth(empty, { env: {} }), /No Google credentials found/);
  assert.equal(createAuth(empty, { env: { GOOGLE_DRIVE_API_KEY: "k" } }).method, "api-key");
  assert.equal(
    createAuth(empty, { env: { GOOGLE_DRIVE_API_KEY: "k", GOOGLE_DRIVE_ACCESS_TOKEN: "t" } })
      .method,
    "access-token",
  );
  assert.throws(() => createAuth({ ...empty, method: "oauth" }, { env: {} }), /drive:auth/);
});

test("API keys are sent as a query parameter only", async () => {
  const auth = createAuth({ method: "api-key" }, { env: { GOOGLE_DRIVE_API_KEY: "public-key" } });
  const headers = new Headers();
  const url = await auth.apply(new URL("https://www.googleapis.com/drive/v3/files"), headers);
  assert.equal(url.searchParams.get("key"), "public-key");
  assert.equal(headers.get("authorization"), null);
});
