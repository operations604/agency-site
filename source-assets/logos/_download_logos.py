#!/usr/bin/env python3
"""Download Activepieces piece logos; keep only real images > 500 bytes."""

from __future__ import annotations

import os
import ssl
import sys
import tempfile
import urllib.error
import urllib.request

DEST = os.path.dirname(os.path.abspath(__file__))
BASE = "https://cdn.activepieces.com/pieces"

SLUGS = [
    "openai",
    "anthropic",
    "slack",
    "stripe",
    "gmail",
    "google-sheets",
    "notion",
    "hubspot",
    "airtable",
    "discord",
    "github",
    "supabase",
    "pinecone",
    "hugging-face",
    "huggingface",
    "elevenlabs",
    "groq",
    "mistral-ai",
    "replicate",
    "twilio",
    "shopify",
    "linear",
    "asana",
    "cloudflare",
    "microsoft-teams",
    "google-drive",
    "google-calendar",
    "telegram",
    "zoom",
    "dropbox",
    "mailchimp",
    "sendgrid",
    "wordpress",
    "webflow",
    "vercel",
    "firebase",
    "mongodb",
    "postgresql",
    "aws",
    "azure-openai",
    "gemini",
    "google-gemini",
    "perplexity-ai",
    "perplexity",
    "stability-ai",
    "deepgram",
    "assemblyai",
    "together-ai",
    "fireworks-ai",
    "xai",
    "claude",
    "n8n",
    "activepieces",
    "intercom",
    "zendesk",
    "typeform",
    "figma",
    "canva",
    "salesforce",
    "whatsapp",
    "instagram",
    "linkedin",
    "youtube",
    "clickup",
    "jira",
    "confluence",
    "monday",
    "pipedrive",
    "klaviyo",
    "resend",
    "posthog",
    "segment",
    "mixpanel",
    "amplitude",
    "sentry",
    "datadog",
    "openai-assistant",
    "langchain",
    "cohere",
    "meta",
    "nvidia",
    "anthropic-claude",
]

VARIANTS = {
    "hugging-face": ["huggingface", "hugging_face", "hf"],
    "huggingface": ["hugging-face", "hugging_face"],
    "mistral-ai": ["mistral", "mistralai"],
    "microsoft-teams": ["microsoft_teams", "teams", "ms-teams"],
    "azure-openai": ["azure_openai", "azure"],
    "google-gemini": ["gemini", "google_gemini"],
    "gemini": ["google-gemini", "google_gemini"],
    "perplexity-ai": ["perplexity", "perplexityai"],
    "perplexity": ["perplexity-ai"],
    "stability-ai": ["stability", "stabilityai"],
    "together-ai": ["together", "togetherai"],
    "fireworks-ai": ["fireworks", "fireworksai"],
    "xai": ["x-ai", "grok"],
    "claude": ["anthropic", "anthropic-claude"],
    "anthropic-claude": ["anthropic", "claude"],
    "openai-assistant": ["openai", "assistant"],
    "google-sheets": ["google_sheets", "googlesheets"],
    "google-drive": ["google_drive"],
    "google-calendar": ["google_calendar"],
    "whatsapp": ["whatsapp-business", "whatsapp_business"],
    "monday": ["monday-com", "mondaycom"],
    "postgresql": ["postgres", "pg"],
    "meta": ["meta-ads", "facebook", "meta-developer"],
    "langchain": ["lang-chain", "langgraph"],
    "n8n": ["n-8-n"],
}

PNG_SIG = b"\x89PNG\r\n\x1a\n"
JPEG_SIG = b"\xff\xd8\xff"
GIF_SIG = b"GIF8"
WEBP_RIFF = b"RIFF"
WEBP_WEBP = b"WEBP"


def is_real_image(data: bytes) -> bool:
    if len(data) <= 500:
        return False
    if data.startswith(PNG_SIG):
        return True
    if data.startswith(JPEG_SIG):
        return True
    if data.startswith(GIF_SIG):
        return True
    if data.startswith(WEBP_RIFF) and WEBP_WEBP in data[:16]:
        return True
    return False


def fetch(url: str, ctx: ssl.SSLContext) -> tuple[int | None, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; logo-downloader/1.0)",
            "Accept": "image/png,image/*,*/*",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
            status = getattr(resp, "status", 200)
            data = resp.read()
            return status, data
    except urllib.error.HTTPError as exc:
        return exc.code, b""
    except Exception:
        return None, b""


def main() -> int:
    os.makedirs(DEST, exist_ok=True)
    ctx = ssl.create_default_context()
    saved: list[tuple[str, int]] = []
    failed: list[str] = []
    attempted: set[str] = set()

    def try_slug(slug: str) -> bool:
        if slug in attempted:
            return False
        attempted.add(slug)
        url = f"{BASE}/{slug}.png"
        status, data = fetch(url, ctx)
        if status != 200:
            print(f"FAIL {slug} status={status}")
            return False
        if not is_real_image(data):
            print(f"FAIL {slug} not-image size={len(data)}")
            return False
        dest = os.path.join(DEST, f"{slug}.png")
        tmp_fd, tmp_path = tempfile.mkstemp(prefix=f".{slug}.", suffix=".tmp", dir=DEST)
        try:
            os.write(tmp_fd, data)
            os.close(tmp_fd)
            os.replace(tmp_path, dest)
        except Exception:
            try:
                os.close(tmp_fd)
            except OSError:
                pass
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise
        print(f"OK {slug}.png {len(data)}")
        saved.append((f"{slug}.png", len(data)))
        return True

    for slug in SLUGS:
        if try_slug(slug):
            continue
        for variant in VARIANTS.get(slug, []):
            if try_slug(variant):
                break
        else:
            failed.append(slug)

    print("---SAVED---")
    for name, size in saved:
        print(f"{name}\t{size}")
    print(f"COUNT {len(saved)}")
    if failed:
        print("FAILED_PRIMARY " + ",".join(failed))
    return 0 if len(saved) >= 24 else 2


if __name__ == "__main__":
    sys.exit(main())
