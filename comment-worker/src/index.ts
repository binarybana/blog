interface Env {
  DB: D1Database;
  SITE_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

interface User {
  id: number;
  provider: string;
  provider_id: string;
  name: string | null;
  avatar_url: string | null;
}

function generateToken(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("Cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim().split("="))
      .filter((parts) => parts.length >= 2)
      .map(([k, ...v]) => [k.trim(), v.join("=").trim()])
  );
}

function sessionCookie(token: string): string {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=34560000; Path=/`;
}

function clearCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`;
}

async function getSession(request: Request, env: Env): Promise<User | null> {
  const cookies = parseCookies(request);
  const token = cookies["session"];
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT u.id, u.provider, u.provider_id, u.name, u.avatar_url
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.token = ?`
  )
    .bind(token)
    .first<User>();

  return row ?? null;
}

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  siteUrl = "https://bask.day"
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": siteUrl,
      "Access-Control-Allow-Credentials": "true",
      ...extraHeaders,
    },
  });
}

function corsPreflightResponse(siteUrl: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": siteUrl,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

async function handleGetComments(
  url: URL,
  env: Env
): Promise<Response> {
  const slug = url.searchParams.get("post");
  if (!slug) {
    return jsonResponse({ error: "Missing post parameter" }, 400);
  }

  const rows = await env.DB.prepare(
    `SELECT c.id, c.content, c.created_at, u.name, u.avatar_url
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_slug = ? ORDER BY c.created_at ASC`
  )
    .bind(slug)
    .all();

  return jsonResponse({ comments: rows.results }, 200, {}, env.SITE_URL);
}

async function handlePostComment(
  request: Request,
  env: Env
): Promise<Response> {
  const user = await getSession(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, {}, env.SITE_URL);
  }

  let body: { post_slug?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, {}, env.SITE_URL);
  }

  const { post_slug, content } = body;

  if (!post_slug || typeof post_slug !== "string" || post_slug.trim() === "") {
    return jsonResponse({ error: "Missing post_slug" }, 400, {}, env.SITE_URL);
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    return jsonResponse({ error: "Missing content" }, 400, {}, env.SITE_URL);
  }
  if (content.length > 5000) {
    return jsonResponse({ error: "Comment too long (max 5000 chars)" }, 400, {}, env.SITE_URL);
  }

  const result = await env.DB.prepare(
    `INSERT INTO comments (post_slug, user_id, content) VALUES (?, ?, ?) RETURNING id, post_slug, content, created_at`
  )
    .bind(post_slug.trim(), user.id, content.trim())
    .first<{ id: number; post_slug: string; content: string; created_at: number }>();

  return jsonResponse(
    {
      ...result,
      name: user.name,
      avatar_url: user.avatar_url,
    },
    201,
    {},
    env.SITE_URL
  );
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await getSession(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, {}, env.SITE_URL);
  }

  const cookies = parseCookies(request);
  const token = cookies["session"];

  return jsonResponse(user, 200, { "Set-Cookie": sessionCookie(token) }, env.SITE_URL);
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookies = parseCookies(request);
  const token = cookies["session"];

  if (token) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  }

  const referer = request.headers.get("Referer") || "/";
  return new Response(null, {
    status: 302,
    headers: {
      Location: referer,
      "Set-Cookie": clearCookie("session"),
    },
  });
}

function oauthStartUrl(
  provider: "github" | "google",
  env: Env,
  redirectUri: string,
  state: string
): string {
  if (provider === "github") {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "read:user",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  } else {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
}

async function handleOAuthStart(
  provider: "github" | "google",
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const redirectPath = url.searchParams.get("redirect") || "/";
  const state = generateToken(16);
  const callbackUrl = `https://comments.bask.day/auth/${provider}/callback`;
  const authUrl = oauthStartUrl(provider, env, callbackUrl, state);

  const headers = new Headers({ Location: authUrl });
  headers.append("Set-Cookie", `__oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
  headers.append("Set-Cookie", `__oauth_redirect=${encodeURIComponent(redirectPath)}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
  return new Response(null, { status: 302, headers });
}

async function exchangeGithubToken(
  code: string,
  env: Env
): Promise<string> {
  const callbackUrl = `https://comments.bask.day/auth/github/callback`;
  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
    }),
  });
  const data = await resp.json<{ access_token: string; error?: string }>();
  if (data.error || !data.access_token) {
    throw new Error(`GitHub token exchange failed: ${data.error}`);
  }
  return data.access_token;
}

async function exchangeGoogleToken(
  code: string,
  env: Env
): Promise<string> {
  const callbackUrl = `https://comments.bask.day/auth/google/callback`;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
  });
  const data = await resp.json<{ access_token: string; error?: string }>();
  if (data.error || !data.access_token) {
    throw new Error(`Google token exchange failed: ${data.error}`);
  }
  return data.access_token;
}

async function fetchGithubProfile(
  token: string
): Promise<{ id: number; name: string | null; avatar_url: string | null }> {
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "blog-comments",
    },
  });
  return resp.json();
}

async function fetchGoogleProfile(
  token: string
): Promise<{ sub: string; name: string | null; picture: string | null }> {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

async function handleOAuthCallback(
  provider: "github" | "google",
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const cookies = parseCookies(request);
  const savedState = cookies["__oauth_state"];
  const savedRedirect = decodeURIComponent(cookies["__oauth_redirect"] || "/");

  if (!savedState || state !== savedState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  let providerId: string;
  let name: string | null;
  let avatarUrl: string | null;

  try {
    if (provider === "github") {
      const accessToken = await exchangeGithubToken(code, env);
      const profile = await fetchGithubProfile(accessToken);
      providerId = String(profile.id);
      name = profile.name;
      avatarUrl = profile.avatar_url;
    } else {
      const accessToken = await exchangeGoogleToken(code, env);
      const profile = await fetchGoogleProfile(accessToken);
      providerId = profile.sub;
      name = profile.name;
      avatarUrl = profile.picture;
    }
  } catch (err) {
    return new Response(`OAuth error: ${String(err)}`, { status: 500 });
  }

  // Upsert user
  const user = await env.DB.prepare(
    `INSERT INTO users (provider, provider_id, name, avatar_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(provider, provider_id) DO UPDATE SET name=excluded.name, avatar_url=excluded.avatar_url
     RETURNING id`
  )
    .bind(provider, providerId, name, avatarUrl)
    .first<{ id: number }>();

  if (!user) {
    return new Response("Failed to upsert user", { status: 500 });
  }

  // Create session
  const sessionToken = generateToken(32);
  await env.DB.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`)
    .bind(sessionToken, user.id)
    .run();

  // Clear state cookies, set session cookie, redirect
  const clearState = clearCookie("__oauth_state");
  const clearRedirect = clearCookie("__oauth_redirect");

  const headers = new Headers({ Location: `${env.SITE_URL}${savedRedirect}` });
  headers.append("Set-Cookie", clearState);
  headers.append("Set-Cookie", clearRedirect);
  headers.append("Set-Cookie", sessionCookie(sessionToken));
  return new Response(null, { status: 302, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return corsPreflightResponse(env.SITE_URL);
    }

    const path = url.pathname || "/";

    const method = request.method;

    if (method === "GET" && path === "/comments") {
      return handleGetComments(url, env);
    }

    if (method === "POST" && path === "/comments") {
      return handlePostComment(request, env);
    }

    if (method === "GET" && path === "/auth/me") {
      return handleMe(request, env);
    }

    if (method === "GET" && path === "/auth/logout") {
      return handleLogout(request, env);
    }

    if (method === "GET" && path === "/auth/github") {
      return handleOAuthStart("github", request, env);
    }

    if (method === "GET" && path === "/auth/github/callback") {
      return handleOAuthCallback("github", request, env);
    }

    if (method === "GET" && path === "/auth/google") {
      return handleOAuthStart("google", request, env);
    }

    if (method === "GET" && path === "/auth/google/callback") {
      return handleOAuthCallback("google", request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
