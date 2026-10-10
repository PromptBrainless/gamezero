/**
 * Recursive Drive folder traversal producing a flat, ordered list of entries
 * with full metadata and their path inside the Drive tree.
 */
import { FOLDER_MIME, SHORTCUT_MIME, detectKind } from "./media.mjs";

function compareChildren(a, b) {
  const aFolder = a.mimeType === FOLDER_MIME ? 0 : 1;
  const bFolder = b.mimeType === FOLDER_MIME ? 0 : 1;
  if (aFolder !== bFolder) return aFolder - bFolder;
  const byName = a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true });
  return byName !== 0 ? byName : a.id.localeCompare(b.id);
}

function toEntry(file, { parentId, folders, depth, shortcut }) {
  const name = shortcut?.name ?? file.name;
  const drivePath = [...folders, name].join("/");
  return {
    id: file.id,
    name,
    originalName: file.name,
    mimeType: file.mimeType,
    kind: detectKind(file),
    isFolder: file.mimeType === FOLDER_MIME,
    parentId,
    parents: file.parents ?? [],
    drivePath,
    folders,
    depth,
    modifiedTime: file.modifiedTime ?? null,
    createdTime: file.createdTime ?? null,
    size: file.size !== undefined ? Number(file.size) : null,
    md5Checksum: file.md5Checksum ?? null,
    fileExtension: file.fileExtension ?? null,
    webViewLink: file.webViewLink ?? null,
    description: file.description ?? null,
    version: file.version ?? null,
    driveId: file.driveId ?? null,
    canDownload: file.capabilities?.canDownload ?? true,
    image: file.imageMediaMetadata ?? null,
    video: file.videoMediaMetadata ?? null,
    exportLinks: file.exportLinks ?? null,
    shortcut: shortcut ? { id: shortcut.id, name: shortcut.name, targetId: file.id } : null,
    duplicateOf: null,
    error: null,
  };
}

/**
 * Walk the folder tree below rootId.
 * @param {import("./drive-client.mjs").DriveClient} client
 * @returns {Promise<{ root: object, entries: object[] }>}
 */
export async function traverseFolder(
  client,
  rootId,
  { followShortcuts = true, log = () => {}, resourceKey } = {},
) {
  client.rememberResourceKey(rootId, resourceKey);
  const root = await client.getFile(rootId);
  if (root.mimeType === SHORTCUT_MIME && root.shortcutDetails?.targetMimeType === FOLDER_MIME) {
    return traverseFolder(client, root.shortcutDetails.targetId, {
      followShortcuts,
      log,
      resourceKey: root.shortcutDetails.targetResourceKey,
    });
  }
  if (root.mimeType !== FOLDER_MIME) {
    throw new Error(
      `${root.name} (${rootId}) is not a folder but ${root.mimeType}. Pass a Drive folder URL or ID.`,
    );
  }

  const entries = [];
  const seenFiles = new Map();
  const seenFolders = new Set([root.id]);
  let folderCount = 0;

  async function walk(folderId, folders, depth) {
    folderCount += 1;
    if (folderCount % 25 === 0)
      log(`scanned ${folderCount} folders, ${entries.length} entries so far`);
    const children = (await client.listChildren(folderId)).sort(compareChildren);

    for (const child of children) {
      let file = child;
      let shortcut = null;

      if (child.mimeType === SHORTCUT_MIME) {
        if (!followShortcuts || !child.shortcutDetails?.targetId) {
          const entry = toEntry(child, { parentId: folderId, folders, depth });
          entry.error = followShortcuts ? "shortcut without target" : null;
          entries.push(entry);
          continue;
        }
        shortcut = { id: child.id, name: child.name };
        client.rememberResourceKey(
          child.shortcutDetails.targetId,
          child.shortcutDetails.targetResourceKey,
        );
        try {
          file = await client.getFile(child.shortcutDetails.targetId);
        } catch (error) {
          const entry = toEntry(child, { parentId: folderId, folders, depth });
          entry.error = `shortcut target not accessible: ${error.message}`;
          entries.push(entry);
          continue;
        }
      }

      const entry = toEntry(file, { parentId: folderId, folders, depth, shortcut });

      if (entry.isFolder) {
        if (seenFolders.has(file.id)) {
          entry.duplicateOf = file.id;
          entry.error = "folder already traversed (shortcut cycle or duplicate link)";
          entries.push(entry);
          continue;
        }
        seenFolders.add(file.id);
        entries.push(entry);
        await walk(file.id, [...folders, entry.name], depth + 1);
        continue;
      }

      if (seenFiles.has(file.id)) entry.duplicateOf = seenFiles.get(file.id);
      else seenFiles.set(file.id, entry.drivePath);
      entries.push(entry);
    }
  }

  await walk(root.id, [], 0);
  return {
    root: {
      id: root.id,
      name: root.name,
      mimeType: root.mimeType,
      modifiedTime: root.modifiedTime ?? null,
      webViewLink: root.webViewLink ?? null,
      driveId: root.driveId ?? null,
    },
    entries,
  };
}
