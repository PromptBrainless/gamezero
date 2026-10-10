/**
 * Turn whatever the user pasted (a bare ID or any common Drive folder URL)
 * into a Drive file ID.
 *
 * Accepted forms:
 *   1J7Ww5YBFyOVMgirT0AXXY_o2YVgH4jRv
 *   https://drive.google.com/drive/folders/<id>
 *   https://drive.google.com/drive/folders/<id>?usp=sharing
 *   https://drive.google.com/drive/u/0/folders/<id>
 *   https://drive.google.com/open?id=<id>
 *   https://drive.google.com/folderview?id=<id>
 *   https://drive.google.com/file/d/<id>/view
 *   https://docs.google.com/document/d/<id>/edit
 */

const ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export function isDriveId(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}

export function parseDriveId(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("A Drive folder ID or URL is required.");
  }
  const value = input.trim();
  if (isDriveId(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Not a Drive folder ID or URL: ${value}`);
  }
  const host = url.hostname.toLowerCase();
  if (host !== "drive.google.com" && host !== "docs.google.com") {
    throw new Error(`Not a Google Drive URL (host ${url.hostname}): ${value}`);
  }

  const queryId = url.searchParams.get("id");
  if (queryId && isDriveId(queryId)) return queryId;

  const segments = url.pathname.split("/").filter(Boolean);
  for (const marker of ["folders", "d"]) {
    const index = segments.indexOf(marker);
    if (index !== -1 && isDriveId(segments[index + 1] ?? "")) return segments[index + 1];
  }
  throw new Error(`Could not find a Drive ID in URL: ${value}`);
}

/**
 * Like parseDriveId but also returns the `resourcekey` query parameter that
 * older link-shared folders need ("...folders/<id>?resourcekey=0-abc").
 */
export function parseDriveLink(input) {
  const id = parseDriveId(input);
  let resourceKey;
  try {
    resourceKey = new URL(String(input).trim()).searchParams.get("resourcekey") ?? undefined;
  } catch {
    resourceKey = undefined;
  }
  return { id, resourceKey };
}

export function folderUrl(id) {
  return `https://drive.google.com/drive/folders/${id}`;
}
