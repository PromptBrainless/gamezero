#!/usr/bin/env python3
"""
Key Search Tool
===============
Searches for potential API keys / secrets in local files
and generates GitHub code search queries based on common patterns.

ETHICAL USE ONLY
----------------
- Only scan repositories / directories you own or have explicit permission to audit.
- Do not use found keys. Report leaks responsibly.
- Intended for defensive security reviews and your own projects.
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict
from urllib.parse import quote

# Common file extensions that often contain secrets (from the docs)
EXTENSIONS = {
    ".env", ".envrc", ".yml", ".yaml", ".json", ".xml", ".properties",
    ".ini", ".cfg", ".conf", ".config", ".toml", ".txt", ".log",
    ".key", ".pem", ".secret", ".private", ".prod", ".backup", ".bak"
}

# Key name patterns (case-insensitive)
KEY_NAMES = re.compile(
    r"(?i)(access[_-]?key|secret[_-]?key|access[_-]?token|api[_-]?key|"
    r"apikey|api[_-]?secret|app[_-]?secret|application[_-]?key|"
    r"app[_-]?key|auth[_-]?token|authsecret|client[_-]?secret|"
    r"private[_-]?key|refresh[_-]?token)"
)

# Signature / prefix patterns for known services
SIGNATURES: List[Tuple[str, re.Pattern]] = [
    ("OpenAI", re.compile(r"sk-[a-zA-Z0-9]{20,}")),
    ("GitHub Token", re.compile(r"(ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}")),
    ("Slack", re.compile(r"xox[baprs]-[a-zA-Z0-9-]{10,}")),
    ("Google API", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("AWS Access Key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("Stripe", re.compile(r"sk_live_[0-9a-zA-Z]{24}")),
    ("Shopify", re.compile(r"shp(ss|at|ca|pa)_[a-fA-F0-9]{32}")),
    ("Square", re.compile(r"sq0[a-z]{3}-[0-9A-Za-z\-_]{22,43}")),
    ("Generic Bearer/Token", re.compile(r"(?i)(bearer|token|key)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{20,}")),
]

# High-entropy string (rough heuristic for secrets)
HIGH_ENTROPY = re.compile(r"[A-Za-z0-9+/=_-]{32,}")


def is_text_file(path: Path) -> bool:
    """Quick check if file is likely text."""
    try:
        with open(path, "rb") as f:
            chunk = f.read(1024)
            if b"\x00" in chunk:
                return False
        return True
    except Exception:
        return False


def scan_file(path: Path) -> List[Dict]:
    """Scan a single file for potential keys."""
    findings = []
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    lines = content.splitlines()
    for i, line in enumerate(lines, 1):
        # Skip very long lines (likely minified)
        if len(line) > 500:
            continue

        # Check key names + nearby high entropy
        if KEY_NAMES.search(line):
            for name, pattern in SIGNATURES:
                m = pattern.search(line)
                if m:
                    findings.append({
                        "file": str(path),
                        "line": i,
                        "type": name,
                        "match": m.group(0)[:80] + ("..." if len(m.group(0)) > 80 else ""),
                        "context": line.strip()[:120]
                    })
                    break
            else:
                # Generic high-entropy after a key name
                if HIGH_ENTROPY.search(line) and len(line.strip()) < 200:
                    findings.append({
                        "file": str(path),
                        "line": i,
                        "type": "Possible key (name + entropy)",
                        "match": line.strip()[:100],
                        "context": line.strip()[:120]
                    })
    return findings


def scan_directory(root: Path, max_files: int = 5000) -> List[Dict]:
    """Recursively scan a directory."""
    findings = []
    count = 0
    for dirpath, _, filenames in os.walk(root):
        # Skip common noise
        if any(skip in dirpath for skip in (".git", "node_modules", "__pycache__", ".venv", "dist", "build")):
            continue
        for fname in filenames:
            if count >= max_files:
                return findings
            path = Path(dirpath) / fname
            if path.suffix.lower() not in EXTENSIONS and path.suffix.lower() not in {".py", ".js", ".ts", ".go", ".java", ".php"}:
                continue
            if not is_text_file(path):
                continue
            count += 1
            findings.extend(scan_file(path))
    return findings


def generate_github_queries() -> Dict[str, str]:
    """Generate ready-to-use GitHub search queries from the documented patterns."""
    base_ext = "(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.secret OR path:*.private OR path:*.key)"
    keynames = "(access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret)"

    queries = {
        "OpenAI": f'{base_ext} AND {keynames} AND ("sk-" AND (openai OR gpt))',
        "GitHub Token": f'{base_ext} AND {keynames} AND (("ghp_" OR "gho_" OR "ghu_" OR "ghs_" OR "ghr_") AND (Github OR OAuth))',
        "Slack": f'{base_ext} AND {keynames} AND (xox AND Slack)',
        "Google API": f'{base_ext} AND {keynames} AND (AIza AND Google)',
        "Shopify": f'{base_ext} AND {keynames} AND (("shpss_" OR "shpat_" OR "shpca_" OR "shppa_") AND Shopify)',
        "Square": f'{base_ext} AND {keynames} AND (("sq0atp-" OR "sq0csp-") AND (square OR OAuth))',
    }
    return queries


def main():
    parser = argparse.ArgumentParser(
        description="Search for potential API keys in local files or generate GitHub search queries."
    )
    parser.add_argument("path", nargs="?", help="Directory to scan (local mode)")
    parser.add_argument("--github", action="store_true", help="Print GitHub search queries instead of scanning")
    parser.add_argument("--max-files", type=int, default=3000, help="Max files to scan (default 3000)")
    args = parser.parse_args()

    print("=== Key Search Tool ===")
    print("ETHICAL USE ONLY – only audit code you own or have permission for.\n")

    if args.github or not args.path:
        print("GitHub Code Search Queries (copy into github.com/search?type=code):\n")
        for name, q in generate_github_queries().items():
            url = f"https://github.com/search?q={quote(q)}&type=code"
            print(f"--- {name} ---")
            print(q)
            print(f"URL: {url}\n")
        if not args.path:
            return

    root = Path(args.path).resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    print(f"Scanning {root} ...\n")
    findings = scan_directory(root, max_files=args.max_files)

    if not findings:
        print("No potential keys found.")
        return

    print(f"Found {len(findings)} potential matches:\n")
    for f in findings:
        print(f"[{f['type']}] {f['file']}:{f['line']}")
        print(f"  Match: {f['match']}")
        print(f"  Context: {f['context']}")
        print()


if __name__ == "__main__":
    main()
