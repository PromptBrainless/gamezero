/**
 * Media-kind detection for Drive entries. A "kind" is the coarse file family
 * that mapping rules match on (image, audio, document, spreadsheet, ...).
 */
import { splitExtension } from "./paths.mjs";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";
export const GOOGLE_APPS_PREFIX = "application/vnd.google-apps.";

export const GOOGLE_NATIVE_KINDS = {
  "application/vnd.google-apps.document": "document",
  "application/vnd.google-apps.spreadsheet": "spreadsheet",
  "application/vnd.google-apps.presentation": "presentation",
  "application/vnd.google-apps.drawing": "image",
  "application/vnd.google-apps.script": "code",
  "application/vnd.google-apps.jam": "presentation",
  "application/vnd.google-apps.form": "form",
  "application/vnd.google-apps.site": "site",
  "application/vnd.google-apps.map": "map",
  "application/vnd.google-apps.fusiontable": "spreadsheet",
  "application/vnd.google-apps.vid": "video",
};

export const KIND_EXTENSIONS = {
  image: [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tga",
    "svg",
    "tif",
    "tiff",
    "exr",
    "hdr",
    "dds",
    "ktx",
    "avif",
    "heic",
  ],
  art_source: [
    "psd",
    "psb",
    "kra",
    "xcf",
    "aseprite",
    "ase",
    "clip",
    "procreate",
    "ai",
    "sai",
    "pdn",
    "afphoto",
    "afdesign",
    "pxo",
    "tmx",
    "tsx",
    "ldtk",
    "ogmo",
  ],
  audio: [
    "wav",
    "ogg",
    "mp3",
    "flac",
    "aif",
    "aiff",
    "m4a",
    "opus",
    "wma",
    "mid",
    "midi",
    "xm",
    "mod",
    "it",
    "s3m",
  ],
  audio_project: [
    "flp",
    "als",
    "logicx",
    "ptx",
    "rpp",
    "cpr",
    "mmpz",
    "aup",
    "aup3",
    "sesx",
    "band",
  ],
  video: ["mp4", "webm", "mov", "avi", "mkv", "ogv", "m4v"],
  document: [
    "md",
    "markdown",
    "txt",
    "rtf",
    "doc",
    "docx",
    "odt",
    "pdf",
    "html",
    "htm",
    "pages",
    "epub",
  ],
  presentation: ["ppt", "pptx", "odp", "key"],
  spreadsheet: ["xls", "xlsx", "xlsm", "ods", "numbers", "csv", "tsv"],
  data: [
    "json",
    "yaml",
    "yml",
    "xml",
    "toml",
    "ini",
    "cfg",
    "tres",
    "res",
    "po",
    "pot",
    "ink",
    "yarn",
    "dlg",
    "dialogue",
  ],
  font: ["ttf", "otf", "woff", "woff2", "fnt"],
  model: ["glb", "gltf", "obj", "fbx", "dae", "blend", "vox", "stl", "3ds", "max", "ma", "mb"],
  code: [
    "gd",
    "gdshader",
    "cs",
    "js",
    "mjs",
    "ts",
    "py",
    "lua",
    "sh",
    "tscn",
    "scn",
    "godot",
    "gdextension",
  ],
  archive: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"],
};

const EXTENSION_TO_KIND = new Map();
for (const [kind, extensions] of Object.entries(KIND_EXTENSIONS)) {
  for (const ext of extensions) if (!EXTENSION_TO_KIND.has(ext)) EXTENSION_TO_KIND.set(ext, kind);
}

const MIME_TO_EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tif",
  "image/vnd.adobe.photoshop": "psd",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/flac": "flac",
  "audio/midi": "mid",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "application/json": "json",
  "application/zip": "zip",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "text/tab-separated-values": "tsv",
  "text/html": "html",
  "application/rtf": "rtf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.oasis.opendocument.presentation": "odp",
  "font/ttf": "ttf",
  "font/otf": "otf",
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
};

export function isFolder(entry) {
  return entry.mimeType === FOLDER_MIME;
}

export function isGoogleNative(mimeType) {
  return typeof mimeType === "string" && mimeType.startsWith(GOOGLE_APPS_PREFIX);
}

export function extensionForMime(mimeType) {
  return MIME_TO_EXTENSION[mimeType] ?? "";
}

/** File extension of a binary Drive file: its name first, then Drive's own field, then the MIME type. */
export function binaryExtension(entry) {
  const fromName = splitExtension(entry.name).ext;
  if (fromName && (EXTENSION_TO_KIND.has(fromName) || !entry.fileExtension)) return fromName;
  if (entry.fileExtension) return String(entry.fileExtension).toLowerCase();
  return extensionForMime(entry.mimeType);
}

/** Coarse media kind used by mapping rules. */
export function detectKind(entry) {
  if (entry.mimeType === FOLDER_MIME) return "folder";
  if (entry.mimeType === SHORTCUT_MIME) return "shortcut";
  if (isGoogleNative(entry.mimeType)) return GOOGLE_NATIVE_KINDS[entry.mimeType] ?? "google_other";

  const ext = binaryExtension(entry);
  if (ext && EXTENSION_TO_KIND.has(ext)) return EXTENSION_TO_KIND.get(ext);

  const mime = String(entry.mimeType ?? "");
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("font/")) return "font";
  if (mime.startsWith("model/")) return "model";
  if (mime.startsWith("text/")) return "document";
  if (mime === "application/pdf") return "document";
  if (mime === "application/json") return "data";
  return "other";
}
