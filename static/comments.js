document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("comments-container");
  if (!container) return;

  const slug = container.dataset.post;
  const API = "https://comments.bask.day";

  // ── helpers ──────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function relativeTime(epochSeconds) {
    const diff = Math.floor(Date.now() / 1000) - epochSeconds;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)} months ago`;
    return `${Math.floor(diff / 86400 / 365)} years ago`;
  }

  function avatarHtml(name, avatarUrl, size = 32) {
    if (avatarUrl) {
      return `<img src="${esc(avatarUrl)}" alt="${esc(name)}" width="${size}" height="${size}" style="border-radius:50%;object-fit:cover;flex-shrink:0;">`;
    }
    const initial = (name || "?")[0].toUpperCase();
    // Simple deterministic color from name
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + (name || "").charCodeAt(i)) & 0xffffffff;
    const hue = Math.abs(hash) % 360;
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:hsl(${hue},55%,55%);color:#fff;font-size:${Math.round(size * 0.5)}px;font-weight:600;flex-shrink:0;">${esc(initial)}</span>`;
  }

  function commentHtml(c) {
    return `
      <div style="display:flex;gap:0.75rem;margin-bottom:1.25rem;align-items:flex-start;">
        ${avatarHtml(c.name || "Anonymous", c.avatar_url)}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:0.5rem;align-items:baseline;flex-wrap:wrap;margin-bottom:0.25rem;">
            <span style="font-weight:600;color:var(--text-primary,inherit);">${esc(c.name || "Anonymous")}</span>
            <span style="font-size:0.8em;color:var(--text-light,#888);">${relativeTime(c.created_at)}</span>
          </div>
          <div style="color:var(--text-primary,inherit);white-space:pre-wrap;word-break:break-word;">${esc(c.content)}</div>
        </div>
      </div>`;
  }

  // ── inject minimal styles ────────────────────────────────────────────────

  const style = document.createElement("style");
  style.textContent = `
    #comments-section { margin-top: 2rem; }
    #comments-section .comments-login-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 0.9rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer;
      text-decoration: none; background: transparent;
      border: 1.5px solid var(--accent-primary, #f5a623);
      color: var(--accent-primary, #f5a623);
      transition: background 0.15s, color 0.15s;
    }
    #comments-section .comments-login-btn:hover {
      background: var(--accent-primary, #f5a623); color: #fff;
    }
    #comments-section textarea {
      width: 100%; box-sizing: border-box; padding: 0.6rem 0.75rem;
      border: 1px solid var(--text-light, #888); border-radius: 4px;
      background: var(--bg-code, #f8f8f8); color: var(--text-primary, inherit);
      font-family: inherit; font-size: 0.95rem; resize: vertical; min-height: 80px;
    }
    #comments-section .comments-submit-btn {
      padding: 0.4rem 1rem; border-radius: 4px; font-size: 0.9rem; cursor: pointer;
      background: var(--accent-primary, #f5a623); color: #fff; border: none;
      float: right; margin-top: 0.5rem;
    }
    #comments-section .comments-submit-btn:hover { opacity: 0.85; }
    #comments-section .comments-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #comments-section .comments-error { color: #c0392b; font-size: 0.875rem; margin-top: 0.4rem; }
    #comments-section .comments-signed-in-bar {
      font-size: 0.875rem; color: var(--text-light, #888); margin-bottom: 0.75rem;
    }
    #comments-section .comments-signed-in-bar a { color: var(--text-light, #888); }
    #comments-section .comments-signed-in-bar a:hover { text-decoration: underline; }
    #comments-section strong { color: inherit; }
  `;
  document.head.appendChild(style);

  // ── fetch data ───────────────────────────────────────────────────────────

  const [commentsRes, meRes] = await Promise.allSettled([
    fetch(`${API}/comments?post=${encodeURIComponent(slug)}`, { credentials: "include" }),
    fetch(`${API}/auth/me`, { credentials: "include" }),
  ]);

  let comments = [];
  let user = null;

  if (commentsRes.status === "fulfilled" && commentsRes.value.ok) {
    const data = await commentsRes.value.json();
    comments = data.comments || [];
  }

  if (meRes.status === "fulfilled" && meRes.value.ok) {
    user = await meRes.value.json();
  }

  // ── render ───────────────────────────────────────────────────────────────

  const section = document.createElement("section");
  section.id = "comments-section";

  function renderCommentsList() {
    if (comments.length === 0) {
      return `<p style="color:var(--text-light,#888);font-style:italic;margin-bottom:1.25rem;">No comments yet.</p>`;
    }
    return comments.map(commentHtml).join("");
  }

  function renderAuthSection() {
    const currentPath = encodeURIComponent(window.location.pathname);
    if (!user) {
      return `
        <div style="margin-top:1rem;">
          <p style="margin-bottom:0.75rem;color:var(--text-light,#888);font-size:0.9rem;">Sign in to leave a comment:</p>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <a class="comments-login-btn" href="${API}/auth/github?redirect=${currentPath}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Sign in with GitHub
            </a>
            <a class="comments-login-btn" href="${API}/auth/google?redirect=${currentPath}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </a>
          </div>
          <p style="margin-top:0.6rem;font-size:0.8rem;color:var(--text-light,#888);">Your name and profile picture will be visible with your comments.</p>
        </div>`;
    }

    return `
      <div class="comments-signed-in-bar">
        Signed in as <strong>${esc(user.name || "Anonymous")}</strong> &middot;
        <a href="${API}/auth/logout">Sign out</a>
      </div>
      <div id="comment-form">
        <textarea id="comment-text" placeholder="Write a comment..." rows="4"></textarea>
        <div id="comment-error" class="comments-error" style="display:none;"></div>
        <button class="comments-submit-btn" id="comment-submit">Submit</button>
        <div style="clear:both;"></div>
      </div>`;
  }

  section.innerHTML = `
    <h3 style="margin-bottom:1rem;color:var(--text-heading,inherit);">Comments (${comments.length})</h3>
    <div id="comments-list">${renderCommentsList()}</div>
    <div id="comments-auth">${renderAuthSection()}</div>
  `;

  container.appendChild(section);

  // ── event listeners ──────────────────────────────────────────────────────

  const submitBtn = document.getElementById("comment-submit");
  const commentText = document.getElementById("comment-text");
  const commentError = document.getElementById("comment-error");
  const commentsList = document.getElementById("comments-list");
  const commentsHeading = section.querySelector("h3");

  if (submitBtn && commentText) {
    submitBtn.addEventListener("click", async () => {
      const content = commentText.value.trim();
      if (!content) {
        commentError.textContent = "Please write something before submitting.";
        commentError.style.display = "block";
        return;
      }
      if (content.length > 5000) {
        commentError.textContent = "Comment is too long (max 5000 characters).";
        commentError.style.display = "block";
        return;
      }

      commentError.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";

      try {
        const resp = await fetch(`${API}/comments`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_slug: slug, content }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Server error ${resp.status}`);
        }

        const newComment = await resp.json();
        comments.push(newComment);

        // Remove "No comments yet" placeholder if present
        const placeholder = commentsList.querySelector("p");
        if (placeholder) placeholder.remove();

        commentsList.insertAdjacentHTML("beforeend", commentHtml(newComment));
        commentsHeading.textContent = `Comments (${comments.length})`;
        commentText.value = "";
      } catch (err) {
        commentError.textContent = err.message || "Failed to submit comment.";
        commentError.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    });
  }
});
