# Blog Comments Worker

Cloudflare Worker providing a comment system for bask.day, served at `bask.day/api/comments*`.

- **Storage**: Cloudflare D1 (managed SQLite)
- **Auth**: GitHub and Google OAuth2
- **Session**: HttpOnly cookie on `bask.day`, 400-day Max-Age

## Initial Setup

1. Create the D1 database and copy the ID into `wrangler.toml`:
   ```
   npx wrangler d1 create blog-comments
   ```
   Update `database_id` in `wrangler.toml`.

2. Apply the schema:
   ```
   npx wrangler d1 execute blog-comments --file=schema.sql --remote
   ```

3. Register a **GitHub OAuth App** at https://github.com/settings/developers
   - Homepage URL: `https://bask.day`
   - Callback URL: `https://comments.bask.day/auth/github/callback`

4. Register a **Google OAuth Client** at https://console.cloud.google.com (Web Application type)
   - Authorized redirect URI: `https://comments.bask.day/auth/google/callback`

5. Set secrets:
   ```
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

6. Deploy:
   ```
   npx wrangler deploy
   ```

7. In the Cloudflare dashboard → Workers → blog-comments → Custom Domains, add `comments.bask.day`.

## Operations

**Re-deploy after changes:**
```
npx wrangler deploy
```

**Tail live logs:**
```
npx wrangler tail
```

**Run locally** (uses local D1):
```
npx wrangler dev
```

**Apply schema changes:**
```
npx wrangler d1 execute blog-comments --file=schema.sql --remote
```

**Inspect the database:**
```
npx wrangler d1 execute blog-comments --command "SELECT * FROM comments LIMIT 10" --remote
npx wrangler d1 execute blog-comments --command "SELECT * FROM users" --remote
npx wrangler d1 execute blog-comments --command "SELECT COUNT(*) FROM sessions" --remote
```

## API Routes

All routes are prefixed with `/api/comments` via Cloudflare route.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/comments?post=<slug>` | Public | Fetch comments for a post |
| POST | `/comments` | Session | Submit a new comment |
| GET | `/auth/me` | Session | Get current user, refresh cookie |
| GET | `/auth/logout` | — | Clear session cookie, redirect |
| GET | `/auth/github` | — | Start GitHub OAuth flow |
| GET | `/auth/github/callback` | — | GitHub OAuth callback |
| GET | `/auth/google` | — | Start Google OAuth flow |
| GET | `/auth/google/callback` | — | Google OAuth callback |

## Verification

```bash
# Should return {"comments":[]}
curl https://comments.bask.day/comments?post=some-slug
```
