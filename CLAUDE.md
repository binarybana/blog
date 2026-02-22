# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog/website built with [Zola](https://www.getzola.org/), a static site generator written in Rust. The site is deployed to GitHub Pages and uses Cloudflare Workers for image/video upload functionality and comments.

The repository consists of three main components:
1. **Main site** - Zola-based static blog built from markdown content
2. **Upload worker** - Cloudflare Worker for uploading images/videos from iOS with HTML snippet generation
3. **Comment worker** - Cloudflare Worker providing a comment system with GitHub/Google OAuth

## Build & Development

### Prerequisites
- Zola is managed via `mise` (see `mise.toml`)
- Run `mise install` to ensure Zola is available

### Common Commands

**Build the site:**
```bash
zola build
```

**Serve locally with auto-reload:**
```bash
zola serve
```

**Create a new blog post:**
```bash
mise new "Post Title Here"
```
This creates a draft post at `content/blog/YYYY-MM-DD-post-title-here.md` with frontmatter pre-filled.

**Concatenate all published posts:**
```bash
mise concat [output-file]
```
Useful for creating a single file with all blog content (strips HTML, excludes drafts).

### Deployment
GitHub Actions CI builds and deploys on push to the main branch (`main`). Just commit and push - no manual build needed.

## Site Architecture

### Content Organization
```
content/
├── blog/           # Main blog posts (YYYY-MM-DD-title.md format)
├── antarctica/     # Section for Antarctica-related posts
├── garden/         # Digital garden section
└── _index.md       # Homepage content
```

### Templates
```
templates/
├── base.html       # Base template with common layout
├── index.html      # Homepage template
├── blog.html       # Blog section listing
├── blog-page.html  # Individual blog post template
└── shortcodes/     # Reusable template components
```

### Post Format
Posts use TOML frontmatter (delimited by `+++`):
```toml
+++
title = "Post Title"
draft = true         # Set to false to publish
date = 2026-01-31
description = ""
tags = ["thoughts"]
+++

Content here...
```

### Configuration
- `config.toml` - Main Zola configuration
  - `base_url = "https://binarybana.github.io"`
  - Search index enabled
  - Sass compilation enabled

## Upload Worker (Cloudflare)

Located in `upload-worker/`, this is a separate Node.js/TypeScript project deployed to Cloudflare Workers.

**Purpose:** Accept photo/video uploads from iOS Share Sheet and generate HTML snippets for embedding in blog posts.

### Worker Commands

```bash
cd upload-worker

# Install dependencies
npm install

# Deploy to Cloudflare
npm run deploy

# Set authentication token
npx wrangler secret put AUTH_TOKEN
```

### Worker Features
- Accepts HEIC, JPEG, PNG, WebP, GIF images
- Accepts MOV and MP4 videos (transcodes to AV1)
- Generates thumbnails (300px) and full-width (800px) versions
- Stores files in Cloudflare R2 bucket (`binarybana-blog-static`)
- Logs uploads to `uploads.md` in R2 (newest first)
- Bearer token authentication via `AUTH_TOKEN` secret
- Web upload form at `/upload?token=TOKEN`

### Worker Configuration
- `wrangler.toml` - Cloudflare Worker config
  - Bucket binding: `BUCKET` → `binarybana-blog-static`
  - Base URL: `https://blob.bask.day`

## Comment Worker (Cloudflare)

Located in `comment-worker/`, deployed to `comments.bask.day` as a Cloudflare Custom Domain.

**Purpose:** Serverless comment system for blog posts — GitHub and Google OAuth login, comment storage in Cloudflare D1 (SQLite).

### Worker Commands

```bash
cd comment-worker

# Deploy
npx wrangler deploy

# Tail live logs
npx wrangler tail

# Run locally (local D1)
npx wrangler dev

# Apply schema changes
npx wrangler d1 execute blog-comments --file=schema.sql --remote

# Inspect DB
npx wrangler d1 execute blog-comments --command "SELECT * FROM comments LIMIT 10" --remote
```

### Worker Features
- GitHub and Google OAuth2 login
- Comments stored in Cloudflare D1 (`blog-comments` database)
- HttpOnly session cookies on `bask.day` (SameSite=Lax, 400-day expiry)
- Vanilla JS frontend in `static/comments.js`, defer-loaded only on blog post pages
- No npm runtime dependencies — Web APIs only

### Worker Configuration
- `wrangler.toml` - D1 binding (`DB` → `blog-comments`), `SITE_URL = "https://bask.day"`
- Custom Domain `comments.bask.day` configured via Cloudflare dashboard
- Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- OAuth callback URLs: `https://comments.bask.day/auth/github/callback` and `https://comments.bask.day/auth/google/callback`

See `comment-worker/README.md` for full setup instructions.

## Development Workflow

1. **Start writing:** Run `mise new "Title"` to create a post stub
2. **Edit content:** Posts are in `content/blog/YYYY-MM-DD-slug.md`
3. **Preview:** Run `zola serve` to preview at http://127.0.0.1:1111
4. **Publish:** Change `draft = true` to `draft = false` in frontmatter
5. **Deploy:** Commit and push - GitHub Actions handles build automatically

## Important Notes

- Blog posts must follow naming convention: `YYYY-MM-DD-title-slug.md`
- Published posts have `draft = false` in frontmatter
- Main branch is `main` (previously was `zola`)
- Image uploads via worker are stored at `https://blob.bask.day/uploads/...`
- The `concat` task is useful for creating AI-friendly dumps of all blog content
