/**
 * Minimal Google Drive v3 / Sheets v4 REST client built on fetch.
 *
 * - Pagination, shared-drive support, resource keys for link-shared files
 * - Retries with exponential backoff for rate limits, 5xx and network errors
 * - Streaming downloads/exports with sha256 + md5 verification
 */
import { createHash, randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export const FILE_FIELDS = [
  "id",
  "name",
  "mimeType",
  "parents",
  "modifiedTime",
  "createdTime",
  "size",
  "md5Checksum",
  "fileExtension",
  "webViewLink",
  "trashed",
  "driveId",
  "resourceKey",
  "description",
  "version",
  "exportLinks",
  "capabilities(canDownload)",
  "shortcutDetails(targetId,targetMimeType,targetResourceKey)",
  "imageMediaMetadata(width,height)",
  "videoMediaMetadata(width,height,durationMillis)",
].join(",");

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_REASONS = new Set([
  "rateLimitExceeded",
  "userRateLimitExceeded",
  "backendError",
  "internalError",
]);

export class DriveApiError extends Error {
  constructor(message, { status, reason, url } = {}) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
    this.reason = reason;
    this.url = url;
  }
}

class SizeLimitError extends Error {}
class ChecksumError extends Error {}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function errorFromResponse(response, url) {
  const text = await response.text().catch(() => "");
  let reason = "";
  let message = text.slice(0, 300);
  try {
    const body = JSON.parse(text);
    reason = body.error?.errors?.[0]?.reason ?? body.error?.status ?? "";
    message = body.error?.message ?? message;
  } catch {
    // Non-JSON error body; keep the text snippet.
  }
  const safeUrl = new URL(url);
  safeUrl.searchParams.delete("key");
  return new DriveApiError(
    `Drive API ${response.status}${reason ? ` ${reason}` : ""}: ${message}`,
    {
      status: response.status,
      reason,
      url: safeUrl.toString(),
    },
  );
}

function isRetryable(error) {
  if (error instanceof SizeLimitError) return false;
  if (error instanceof ChecksumError) return true;
  if (error instanceof DriveApiError) {
    return (
      RETRYABLE_STATUS.has(error.status) ||
      (error.status === 403 && RETRYABLE_REASONS.has(error.reason))
    );
  }
  // fetch() network failures surface as TypeError; stream resets as generic errors with a code.
  return (
    error instanceof TypeError ||
    Boolean(error?.code && /^(ECONNRESET|ETIMEDOUT|EPIPE|EAI_AGAIN|UND_ERR)/.test(error.code))
  );
}

export class DriveClient {
  /**
   * @param {{ auth: { apply(url: URL, headers: Headers): Promise<URL>, invalidate(): void, method: string },
   *   driveBaseUrl?: string, sheetsBaseUrl?: string, fetchImpl?: typeof fetch, maxRetries?: number,
   *   sleep?: (ms: number) => Promise<void>, log?: (message: string) => void }} options
   */
  constructor({
    auth,
    driveBaseUrl = "https://www.googleapis.com",
    sheetsBaseUrl = "https://sheets.googleapis.com",
    fetchImpl = fetch,
    maxRetries = 6,
    sleep = defaultSleep,
    log = () => {},
  }) {
    this.auth = auth;
    this.driveBaseUrl = driveBaseUrl.replace(/\/$/, "");
    this.sheetsBaseUrl = sheetsBaseUrl.replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.maxRetries = maxRetries;
    this.sleep = sleep;
    this.log = log;
    this.resourceKeys = new Map();
    this.stats = { requests: 0, retries: 0 };
  }

  rememberResourceKey(id, resourceKey) {
    if (id && resourceKey) this.resourceKeys.set(id, resourceKey);
  }

  async withRetries(url, operation) {
    const label = new URL(url).pathname;
    let authRetried = false;
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (
          error instanceof DriveApiError &&
          error.status === 401 &&
          !authRetried &&
          this.auth.method !== "api-key"
        ) {
          authRetried = true;
          this.auth.invalidate();
          continue;
        }
        if (attempt >= this.maxRetries || !isRetryable(error)) throw error;
        const retryAfter = Number(error.retryAfterSeconds);
        const delay =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(32_000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
        this.stats.retries += 1;
        this.log(
          `retry ${attempt + 1}/${this.maxRetries} for ${label} in ${delay} ms (${error.message})`,
        );
        await this.sleep(delay);
      }
    }
  }

  async fetchOnce(url, { resourceIds = [] } = {}) {
    const headers = new Headers();
    const keys = resourceIds
      .filter((id) => this.resourceKeys.has(id))
      .map((id) => `${id}/${this.resourceKeys.get(id)}`);
    if (keys.length > 0) headers.set("x-goog-drive-resource-keys", keys.join(","));
    const target = await this.auth.apply(new URL(url), headers);
    this.stats.requests += 1;
    let response;
    try {
      response = await this.fetchImpl(target, { headers, redirect: "follow" });
    } catch (error) {
      const cause = error.cause?.code ?? error.cause?.message ?? error.message;
      throw new TypeError(`network error reaching ${target.host}: ${cause}`, { cause: error });
    }
    if (!response.ok) {
      const error = await errorFromResponse(response, target.toString());
      error.retryAfterSeconds = response.headers.get("retry-after");
      throw error;
    }
    return response;
  }

  async getJson(url, options) {
    return this.withRetries(url, async () => (await this.fetchOnce(url, options)).json());
  }

  driveUrl(path, query = {}) {
    const url = new URL(`${this.driveBaseUrl}/drive/v3/${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async getFile(id) {
    return this.getJson(
      this.driveUrl(`files/${encodeURIComponent(id)}`, {
        fields: FILE_FIELDS,
        supportsAllDrives: true,
      }),
      {
        resourceIds: [id],
      },
    );
  }

  /** All non-trashed children of a folder (follows nextPageToken). */
  async listChildren(folderId) {
    const children = [];
    let pageToken;
    do {
      const url = this.driveUrl("files", {
        q: `'${folderId.replace(/['\\]/g, "\\$&")}' in parents and trashed = false`,
        fields: `nextPageToken,files(${FILE_FIELDS})`,
        pageSize: 1000,
        orderBy: "folder,name",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageToken,
      });
      const page = await this.getJson(url, { resourceIds: [folderId] });
      for (const file of page.files ?? []) {
        this.rememberResourceKey(file.id, file.resourceKey);
        children.push(file);
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
    return children;
  }

  /** Stream a response body to disk atomically, hashing as it goes. */
  async streamToFile(
    url,
    destination,
    { resourceIds = [], maxBytes = Number.POSITIVE_INFINITY, expectedMd5 } = {},
  ) {
    return this.withRetries(url, async () => {
      const response = await this.fetchOnce(url, { resourceIds });
      await mkdir(dirname(destination), { recursive: true });
      const temp = `${destination}.part-${randomBytes(4).toString("hex")}`;
      const sha256 = createHash("sha256");
      const md5 = createHash("md5");
      let bytes = 0;
      const meter = new Transform({
        transform(chunk, _encoding, callback) {
          bytes += chunk.length;
          if (bytes > maxBytes) {
            callback(new SizeLimitError(`exceeds the size limit of ${maxBytes} bytes`));
            return;
          }
          sha256.update(chunk);
          md5.update(chunk);
          callback(null, chunk);
        },
      });
      try {
        if (!response.body)
          throw new DriveApiError("Empty response body", { status: response.status, url });
        await pipeline(
          Readable.fromWeb(response.body),
          meter,
          createWriteStream(temp, { flags: "wx" }),
        );
        const md5Hex = md5.digest("hex");
        if (expectedMd5 && md5Hex !== expectedMd5) {
          throw new ChecksumError(`checksum mismatch (md5 ${md5Hex}, Drive says ${expectedMd5})`);
        }
        await rename(temp, destination);
        return { bytes, sha256: sha256.digest("hex"), md5: md5Hex };
      } catch (error) {
        await rm(temp, { force: true });
        throw error;
      }
    });
  }

  async download(entry, destination, options = {}) {
    const url = this.driveUrl(`files/${encodeURIComponent(entry.id)}`, {
      alt: "media",
      supportsAllDrives: true,
    });
    return this.streamToFile(url, destination, {
      ...options,
      resourceIds: [entry.id],
      expectedMd5: entry.md5Checksum,
    });
  }

  /**
   * Export a Google-native file. Falls back to the file's exportLinks when the
   * export endpoint refuses large documents (exportSizeLimitExceeded).
   */
  async export(entry, mimeType, destination, options = {}) {
    const url = this.driveUrl(`files/${encodeURIComponent(entry.id)}/export`, { mimeType });
    try {
      return await this.streamToFile(url, destination, { ...options, resourceIds: [entry.id] });
    } catch (error) {
      const link = entry.exportLinks?.[mimeType];
      if (error instanceof DriveApiError && error.reason === "exportSizeLimitExceeded" && link) {
        this.log(`export of ${entry.name} is over the API limit; using its export link`);
        return this.streamToFile(link, destination, { ...options, resourceIds: [entry.id] });
      }
      throw error;
    }
  }

  /** Grid tabs of a Google Sheet, in display order. */
  async sheetTabs(spreadsheetId) {
    const url = new URL(
      `${this.sheetsBaseUrl}/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
    );
    url.searchParams.set("fields", "sheets.properties(sheetId,title,index,sheetType)");
    const body = await this.getJson(url.toString(), { resourceIds: [spreadsheetId] });
    return (body.sheets ?? [])
      .map((sheet) => sheet.properties)
      .filter((properties) => (properties.sheetType ?? "GRID") === "GRID")
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }

  /** Formatted cell values of one tab as an array of rows. */
  async sheetValues(spreadsheetId, title) {
    const range = `'${title.replace(/'/g, "''")}'`;
    const url = new URL(
      `${this.sheetsBaseUrl}/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
    );
    url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
    url.searchParams.set("majorDimension", "ROWS");
    const body = await this.getJson(url.toString(), { resourceIds: [spreadsheetId] });
    return body.values ?? [];
  }
}

/** RFC 4180 CSV with CRLF-free "\n" line endings and padded rows. */
export function toCsv(rows) {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const cell = (value) => {
    const text = value === undefined || value === null ? "" : String(value);
    return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows
    .map((row) => Array.from({ length: width }, (_, index) => cell(row[index])).join(","))
    .join("\n")
    .concat(rows.length > 0 ? "\n" : "");
}
