# for mac bash : export MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/?retryWrites=true&w=majority"
# for windows cmd : $env:MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/?retryWrites=true&w=majority"

#!/usr/bin/env python3
"""
scrape_full_and_save.py

- Scrapes full articles (13 RSS sources)
- Extracts main content (trafilatura / readability / newspaper3k fallbacks)
- Produces full_text, content_html, canonical_url, word_count, language, scrape_meta
- Chunks text by tokens (uses tiktoken if installed, else word-heuristic)
- Saves JSON: articles_full_<session_id>.json
- Optionally seeds sources, creates a session and inserts articles into MongoDB (if MONGODB_URI env var set)

This version uses a lenient 24-hour filter:
- Keep article if published_at is within last 24 hours OR
- If published_at is missing, keep if created_at (scrape time) is within last 24 hours.
"""

from __future__ import annotations
import os
import sys
import argparse
import json
import uuid
import logging
import re
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

import feedparser
import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
import trafilatura
from readability import Document
from newspaper import Article as NewsArticle
from langdetect import detect, LangDetectException

# optional precise chunker
try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except Exception:
    TIKTOKEN_AVAILABLE = False

# optional pymongo
try:
    from pymongo import MongoClient, ReplaceOne, ASCENDING, errors
except Exception:
    MongoClient = None

# requests retry helpers
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("scraper_full")

# ====== CLEAN SOURCE LIST (403-free) ======
SOURCES = [
    {
        "_id": "src_techcrunch",
        "name": "TechCrunch",
        "type": "rss",
        "url": "https://techcrunch.com/feed/",
        "category": "Technology",
        "active": True
    },
    {
        "_id": "src_mittr",
        "name": "MIT Technology Review",
        "type": "rss",
        "url": "https://www.technologyreview.com/feed/",
        "category": "Technology",
        "active": True
    },
    {
        "_id": "src_wired",
        "name": "Wired",
        "type": "rss",
        "url": "https://www.wired.com/feed/rss",
        "category": "Technology",
        "active": True
    },
    {
        "_id": "src_theverge",
        "name": "The Verge",
        "type": "rss",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "Technology",
        "active": True
    },

    {
        "_id": "src_hbr",
        "name": "Harvard Business Review",
        "type": "rss",
        "url": "https://hbr.org/feed",
        "category": "Business",
        "active": True
    },
    {
        "_id": "src_forbes",
        "name": "Forbes (Leadership)",
        "type": "rss",
        "url": "https://www.forbes.com/leadership/feed/",
        "category": "Business",
        "active": True
    },

    {
        "_id": "src_venturebeat",
        "name": "VentureBeat (AI)",
        "type": "rss",
        "url": "https://venturebeat.com/category/ai/feed/",
        "category": "AI",
        "active": True
    },
    {
        "_id": "src_towardsds",
        "name": "Towards Data Science",
        "type": "rss",
        "url": "https://towardsdatascience.com/feed",
        "category": "AI",
        "active": True
    },

    {
        "_id": "src_bleeping",
        "name": "Bleeping Computer",
        "type": "rss",
        "url": "https://www.bleepingcomputer.com/feed/",
        "category": "Cybersecurity",
        "active": True
    },

    {
        "_id": "src_hubspot",
        "name": "HubSpot Blog (Marketing)",
        "type": "rss",
        "url": "https://blog.hubspot.com/marketing/rss.xml",
        "category": "Marketing",
        "active": True
    }
]

# ----- Include uploaded project files as local pseudo-articles -----
# Use the uploaded file paths as 'url' so downstream can transform them to serveable URLs.
PROJECT_FILES = [
    "/mnt/data/Team1_Agentic AI for LinkedIn Personal Brand Builder_ Post Generator_Feasibility Report.pdf",
    "/mnt/data/Team1_Agentic AI for LinkedIn Personal Brand Builder_ Post Generator_SRS.pdf",
    "/mnt/data/Team1_AgenticAIForLinkedInPersonalBrandBuilder_PostGeneration_ActivityDiagram.pdf",
    "/mnt/data/Team1_AgenticAIForLinkedInPersonalBrandBuilder_PostGeneration_Class Diagram.pdf",
    "/mnt/data/Team1_AgenticAIForLinkedInPersonalBrandBuilder_PostGeneration_ProjectWriteUp.pdf",
    "/mnt/data/Team1_AgenticAIForLinkedInPersonalBrandBuilder_PostGeneration_UseCaseDiagram.pdf",
]

# ----- Mongo config -----
DEFAULT_DB = "agentic_ai_db"
SESSIONS_COLL = "sessions"
SOURCES_COLL = "sources"
ARTICLES_COLL = "articles"

# ----- Utilities -----
def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def parse_date_to_iso(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        dt = dateparser.parse(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return None

def _extract_canonical(html: str) -> Optional[str]:
    try:
        soup = BeautifulSoup(html, "html.parser")
        tag = soup.find("link", rel="canonical")
        if tag and tag.get("href"):
            return tag.get("href")
        og = soup.find("meta", property="og:url")
        if og and og.get("content"):
            return og.get("content")
    except Exception:
        pass
    return None

# ----- Requests session factory (global) -----
def make_session(timeout: int = 12):
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Connection": "keep-alive",
    })
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[429,500,502,503,504], allowed_methods=["GET","HEAD"])
    adapter = HTTPAdapter(max_retries=retries)
    s.mount("https://", adapter)
    s.mount("http://", adapter)

    proxy = os.environ.get("SCRAPER_PROXY")
    if proxy:
        s.proxies.update({"http": proxy, "https": proxy})

    s.request_timeout = timeout
    return s

GLOBAL_SESSION = make_session()

# ----- Full-article fetcher (uses GLOBAL_SESSION and optional ScrapingBee) -----
def fetch_full_text(url: str, timeout: int = 12) -> Dict[str, Optional[Any]]:
    """
    Returns dict:
      { full_text, content_html, canonical_url, fetch_method, success, error }
    Uses ScrapingBee if SCRAPINGBEE_API_KEY env var set (helps avoid 403s).
    """
    scraping_api_key = os.environ.get("SCRAPINGBEE_API_KEY", "").strip()
    try:
        if scraping_api_key:
            api_url = "https://app.scrapingbee.com/api/v1/"
            params = {"api_key": scraping_api_key, "url": url, "render_js": "false"}
            r = GLOBAL_SESSION.get(api_url, params=params, timeout=timeout)
        else:
            r = GLOBAL_SESSION.get(url, timeout=timeout)
        r.raise_for_status()
        html = r.text
    except Exception as e:
        status = getattr(getattr(e, "response", None), "status_code", None)
        logger.warning("GET failed for %s: %s (status=%s)", url, e, status)
        return {"full_text": None, "content_html": None, "canonical_url": None, "fetch_method": None, "success": False, "error": str(e)}

    # polite small delay to avoid bursts
    time.sleep(0.35)

    # Strategy A: trafilatura
    try:
        txt = trafilatura.extract(html, include_comments=False, include_tables=False)
        if txt and len(txt.strip()) > 200:
            canonical = _extract_canonical(html)
            return {"full_text": txt.strip(), "content_html": None, "canonical_url": canonical, "fetch_method": "trafilatura", "success": True}
    except Exception:
        pass

    # Strategy B: readability
    try:
        doc = Document(html)
        content_html = doc.summary()
        text = BeautifulSoup(content_html, "html.parser").get_text(separator="\n", strip=True)
        if text and len(text.strip()) > 120:
            canonical = _extract_canonical(html)
            return {"full_text": text.strip(), "content_html": content_html, "canonical_url": canonical, "fetch_method": "readability", "success": True}
    except Exception:
        pass

    # Strategy C: newspaper3k
    try:
        news = NewsArticle(url)
        news.download()
        news.parse()
        text = news.text
        if text and len(text.strip()) > 100:
            canonical = _extract_canonical(html)
            return {"full_text": text.strip(), "content_html": None, "canonical_url": canonical, "fetch_method": "newspaper3k", "success": True}
    except Exception:
        pass

    # Fallback: naive text
    try:
        soup = BeautifulSoup(html, "html.parser")
        for s in soup(["script", "style", "noscript"]):
            s.extract()
        text = soup.get_text(separator="\n", strip=True)
        canonical = _extract_canonical(html)
        return {"full_text": text.strip()[:20000] if text else None, "content_html": None, "canonical_url": canonical, "fetch_method": "naive", "success": bool(text)}
    except Exception as e:
        return {"full_text": None, "content_html": None, "canonical_url": None, "fetch_method": None, "success": False, "error": str(e)}

# ----- Chunker -----
def chunk_text_by_tokens(text: str, max_tokens: int = 900, overlap: int = 150, tokenizer_name: str = "gpt2") -> List[Dict[str, Any]]:
    if not text or not text.strip():
        return []

    if TIKTOKEN_AVAILABLE:
        try:
            try:
                enc = tiktoken.get_encoding(tokenizer_name)
            except Exception:
                enc = tiktoken.encoding_for_model("gpt-4o-mini")
            tokens = enc.encode(text)
            n = len(tokens)
            chunks = []
            i = 0
            chunk_id = 0
            while i < n:
                end = min(i + max_tokens, n)
                chunk_tokens = tokens[i:end]
                chunk_text = enc.decode(chunk_tokens)
                chunks.append({"chunk_id": chunk_id, "text": chunk_text, "token_count": len(chunk_tokens)})
                chunk_id += 1
                i = end - overlap if end - overlap > i else end
            return chunks
        except Exception:
            pass

    # fallback heuristic
    approx_tokens_per_word = 0.75
    max_words = int(max_tokens / approx_tokens_per_word)
    overlap_words = int(overlap / approx_tokens_per_word)
    words = re.sub(r"\s+", " ", text).strip().split(" ")
    chunks = []
    i = 0
    chunk_id = 0
    n = len(words)
    while i < n:
        end = min(i + max_words, n)
        chunk_words = words[i:end]
        chunk_text = " ".join(chunk_words).strip()
        token_est = int(len(chunk_words) * approx_tokens_per_word)
        chunks.append({"chunk_id": chunk_id, "text": chunk_text, "token_count": token_est})
        chunk_id += 1
        i = end - overlap_words
        if i <= end and i < 0:
            i = end
    return chunks

# ----- Normalize RSS entry with full-text attempt and RSS fallback -----
def normalize_entry_with_full(entry, source_id: str, session_id: str) -> Dict[str, Any]:
    title = getattr(entry, "title", "") or ""
    link = getattr(entry, "link", "") or ""
    summary = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
    published = None
    if hasattr(entry, "published"):
        published = parse_date_to_iso(getattr(entry, "published", None))
    if not published and hasattr(entry, "updated"):
        published = parse_date_to_iso(getattr(entry, "updated", None))
    if not published and hasattr(entry, "published_parsed"):
        try:
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
        except Exception:
            published = None

    article = {
        "session_id": session_id,
        "source_id": source_id,
        "title": title.strip(),
        "url": link.strip(),
        "summary": summary.strip(),
        "published_at": published,
        "created_at": iso_now(),
        "content_html": None,
        "full_text": None,
        "canonical_url": None,
        "word_count": None,
        "text_chunks": [],
        "language": None,
        "scrape_meta": {}
    }

    # Only attempt fetch for http(s) links
    if link and (link.startswith("http://") or link.startswith("https://")):
        fetched = fetch_full_text(link)
        article["scrape_meta"] = {
            "fetch_method": fetched.get("fetch_method"),
            "success": bool(fetched.get("success")),
            "error": fetched.get("error", None)
        }
        if fetched.get("content_html"):
            article["content_html"] = fetched.get("content_html")
        if fetched.get("full_text"):
            full = fetched.get("full_text")
            article["full_text"] = full
            article["canonical_url"] = fetched.get("canonical_url")
            words = re.sub(r"\s+", " ", full).strip().split(" ")
            article["word_count"] = len(words)
            # language detection best-effort
            try:
                article["language"] = detect(full[:5000]) if len(full) > 50 else None
            except LangDetectException:
                article["language"] = None
            # chunk
            article["text_chunks"] = chunk_text_by_tokens(full, max_tokens=900, overlap=150)
        else:
            # fallback: use RSS summary as minimal full_text so downstream AI always has something
            fallback_text = article["summary"] or ""
            article["full_text"] = fallback_text
            article["word_count"] = len(fallback_text.split())
            article["text_chunks"] = chunk_text_by_tokens(fallback_text, max_tokens=400, overlap=50)
            article["scrape_meta"]["note"] = "fallback_to_rss"
    else:
        # non-http (local file etc.) keep summary only
        fallback_text = article["summary"] or ""
        article["full_text"] = fallback_text
        article["word_count"] = len(fallback_text.split())
        article["text_chunks"] = chunk_text_by_tokens(fallback_text, max_tokens=400, overlap=50)
        article["scrape_meta"]["note"] = "non_http_link_or_local"

    return article

# ----- RSS feed reader -----
def fetch_feed_entries(feed_url: str):
    parsed = feedparser.parse(feed_url)
    if getattr(parsed, "bozo", False):
        logger.debug("Feedparser bozo for %s: %s", feed_url, getattr(parsed, "bozo_exception", None))
    return getattr(parsed, "entries", []) or []

# ----- Mongo helpers -----
def get_mongo_db():
    uri = os.environ.get("MONGODB_URI", "").strip()
    if not uri:
        return None
    if MongoClient is None:
        raise RuntimeError("pymongo not installed but MONGODB_URI was set.")
    client = MongoClient(uri)
    return client, client[DEFAULT_DB]

def seed_sources_to_db(db, sources_list: List[Dict[str, Any]]):
    coll = db[SOURCES_COLL]
    ops = [ReplaceOne({"_id": s["_id"]}, s, upsert=True) for s in sources_list]
    if ops:
        try:
            coll.bulk_write(ops)
            logger.info("Seeded sources into DB.")
        except Exception as e:
            logger.debug("Seed sources error: %s", e)
    try:
        coll.create_index("active")
        coll.create_index("category")
    except Exception:
        pass

def create_or_update_session(db, session_id: str, user_id: str, topic: str, selected_sources: List[str]):
    now = iso_now()
    doc = {
        "_id": session_id,
        "user_id": user_id,
        "topic": topic,
        "selected_sources": selected_sources,
        "status": "created",
        "created_at": now
    }
    db[SESSIONS_COLL].replace_one({"_id": session_id}, doc, upsert=True)
    try:
        db[SESSIONS_COLL].create_index("status")
    except Exception:
        pass

def insert_articles_to_db(db, articles: List[Dict[str, Any]]) -> List[str]:
    if not articles:
        return []
    try:
        db[ARTICLES_COLL].create_index([("session_id", ASCENDING), ("url", ASCENDING)], unique=True)
    except Exception:
        pass

    inserted_ids = []
    try:
        res = db[ARTICLES_COLL].insert_many(articles, ordered=False)
        inserted_ids = [str(_id) for _id in res.inserted_ids]
    except Exception as e:
        logger.warning("bulk insert failed: %s. Falling back to single inserts.", e)
        for a in articles:
            try:
                r = db[ARTICLES_COLL].insert_one(a)
                inserted_ids.append(str(r.inserted_id))
            except Exception:
                logger.debug("skip duplicate insert: %s", a.get("url"))
    return inserted_ids

# ----- Main -----
def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("--session-id", type=str, help="Optional session id (if omitted, generated).")
    parser.add_argument("--user-id", type=str, default="user_local", help="User id for session.")
    parser.add_argument("--topic", type=str, default="AI for Personal Branding", help="Session topic.")
    parser.add_argument("--selected", type=str, help="Comma-separated source ids to use (max 5). If omitted, defaults to all active sources.")
    parser.add_argument("--no-db", action="store_true", help="Skip MongoDB writes even if MONGODB_URI set.")
    parser.add_argument("--output-dir", type=str, default=".", help="Where JSON output will be written.")
    args = parser.parse_args(argv)

    session_id = args.session_id or f"sess_{uuid.uuid4().hex[:8]}"
    user_id = args.user_id
    topic = args.topic
    selected = None
    if args.selected:
        selected = [s.strip() for s in args.selected.split(",") if s.strip()]
        if len(selected) > 5:
            logger.info("Selected more than 5 sources; truncating to first 5.")
            selected = selected[:5]

    logger.info("Starting full scrape. session_id=%s selected=%s", session_id, selected or "ALL")

    # Choose sources
    if selected:
        sources_to_use = [s for s in SOURCES if s["_id"] in selected and s.get("active", True)]
    else:
        sources_to_use = [s for s in SOURCES if s.get("active", True)]

    all_articles: List[Dict[str, Any]] = []

    # Parse RSS and attempt full-text extraction per entry
    for src in sources_to_use:
        logger.info("Fetching feed for %s", src["_id"])
        try:
            entries = fetch_feed_entries(src["url"])
        except Exception as e:
            logger.warning("Failed feed parse for %s: %s", src["_id"], e)
            entries = []
        for e in entries:
            art = normalize_entry_with_full(e, src["_id"], session_id)
            if not art.get("title") or not art.get("url"):
                continue
            art["source_name"] = src.get("name")
            art["category"] = src.get("category")
            all_articles.append(art)

    # Attach project files (local paths) as pseudo-articles
    for p in PROJECT_FILES:
        if os.path.exists(p):
            fname = os.path.basename(p)
            doc = {
                "session_id": session_id,
                "source_id": "local_project_file",
                "source_name": "local_project_file",
                "category": "local",
                "title": f"Local project file: {fname}",
                "url": p,
                "summary": "Uploaded project file attached to session",
                "published_at": None,
                "created_at": iso_now(),
                "content_html": None,
                "full_text": None,
                "canonical_url": None,
                "word_count": None,
                "text_chunks": [],
                "language": None,
                "scrape_meta": {"success": True, "note": "local_file_attached"}
            }
            all_articles.append(doc)
        else:
            logger.debug("Local project file not found (skipping): %s", p)

    # ----- 24-hour lenient filter (Option B) -----
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    filtered_articles: List[Dict[str, Any]] = []
    for a in all_articles:
        pub = a.get("published_at")
        keep = False
        if pub:
            try:
                dt = dateparser.parse(pub)
                if dt and dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if dt and dt >= cutoff:
                    keep = True
            except Exception:
                keep = False
        else:
            # no published date -> check created_at (scrape time)
            created = a.get("created_at")
            if created:
                try:
                    cdt = dateparser.parse(created)
                    if cdt and cdt.tzinfo is None:
                        cdt = cdt.replace(tzinfo=timezone.utc)
                    if cdt and cdt >= cutoff:
                        keep = True
                except Exception:
                    keep = False
        if keep:
            filtered_articles.append(a)

    all_articles = filtered_articles
    logger.info("After 24-hour lenient filter: %d articles remain", len(all_articles))

    # Save JSON locally
    out_name = os.path.join(args.output_dir, f"articles_full_{session_id}.json")
    with open(out_name, "w", encoding="utf-8") as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    logger.info("Wrote %d articles (with full_text if available) to %s", len(all_articles), out_name)

    # Optional DB write
    mongodb_uri = os.environ.get("MONGODB_URI", "").strip()
    if not args.no_db and mongodb_uri:
        if MongoClient is None:
            logger.error("pymongo not installed; cannot write to MongoDB even though MONGODB_URI is set.")
        else:
            try:
                client = MongoClient(mongodb_uri)
                db = client[DEFAULT_DB]
                seed_sources_to_db(db, SOURCES)
                sel_ids = [s["_id"] for s in sources_to_use]
                create_or_update_session(db, session_id, user_id, topic, sel_ids)
                inserted = insert_articles_to_db(db, all_articles)
                db[SESSIONS_COLL].update_one({"_id": session_id}, {"$set": {"status": "completed", "inserted_count": len(inserted), "scrape_completed_at": iso_now()}})
                logger.info("Inserted %d articles into MongoDB (session %s)", len(inserted), session_id)
                client.close()
            except Exception as e:
                logger.exception("MongoDB write failed: %s", e)
                logger.info("You can still use the JSON file: %s", out_name)
    else:
        if not mongodb_uri:
            logger.info("MONGODB_URI not set; skipping DB write.")
        elif args.no_db:
            logger.info("--no-db passed; skipping DB write.")
        else:
            logger.info("pymongo not available; skipping DB write.")

    logger.info("Done. session=%s total_articles=%d", session_id, len(all_articles))
    print("JSON output file:", out_name)

if __name__ == "__main__":
    main(sys.argv[1:])
