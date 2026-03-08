
interface Env {
  BUCKET: R2Bucket;
  AUTH_TOKEN: string;
  BASE_URL: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

// Derive a stable hex ID from file content (first 16 chars of SHA-256)
async function contentHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
    .slice(0, 16);
}

// Extract dimensions from image data
// Supports JPEG, PNG, GIF, WebP, and HEIC (basic support)
async function getImageDimensions(data: ArrayBuffer, contentType: string): Promise<ImageDimensions | null> {
  const view = new DataView(data);
  const bytes = new Uint8Array(data);

  // JPEG
  if (contentType === 'image/jpeg' || (bytes[0] === 0xFF && bytes[1] === 0xD8)) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xFF) break;
      const marker = bytes[offset + 1];
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        const height = view.getUint16(offset + 5, false);
        const width = view.getUint16(offset + 7, false);
        return { width, height };
      }
      const segmentLength = view.getUint16(offset + 2, false);
      offset += 2 + segmentLength;
    }
  }

  // PNG
  if (contentType === 'image/png' || (bytes[0] === 0x89 && bytes[1] === 0x50)) {
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    return { width, height };
  }

  // GIF
  if (contentType === 'image/gif' || (bytes[0] === 0x47 && bytes[1] === 0x49)) {
    const width = view.getUint16(6, true);
    const height = view.getUint16(8, true);
    return { width, height };
  }

  // WebP
  if (contentType === 'image/webp') {
    // Check for RIFF header and WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45) {
      // VP8 format
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        const width = view.getUint16(26, true) & 0x3FFF;
        const height = view.getUint16(28, true) & 0x3FFF;
        return { width, height };
      }
      // VP8L format
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
        const b1 = bytes[21];
        const b2 = bytes[22];
        const b3 = bytes[23];
        const b4 = bytes[24];
        const width = 1 + (((b2 & 0x3F) << 8) | b1);
        const height = 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
        return { width, height };
      }
    }
  }

  // HEIC/HEIF - parse the ftyp and meta boxes to find ispe (image spatial extents)
  if (contentType === 'image/heic' || contentType === 'image/heif') {
    return parseHeicDimensions(bytes, view);
  }

  return null;
}

// Parse HEIC dimensions from ISO Base Media File Format
function parseHeicDimensions(bytes: Uint8Array, view: DataView): ImageDimensions | null {
  let offset = 0;
  while (offset < bytes.length - 8) {
    const boxSize = view.getUint32(offset, false);
    const boxType = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

    if (boxSize === 0) break;

    // Look for 'meta' box which contains 'iprp' -> 'ipco' -> 'ispe'
    if (boxType === 'meta') {
      // meta box has 4 bytes of version/flags after the header
      const metaEnd = offset + boxSize;
      let metaOffset = offset + 12; // skip header (8) + version/flags (4)

      while (metaOffset < metaEnd - 8) {
        const innerSize = view.getUint32(metaOffset, false);
        const innerType = String.fromCharCode(
          bytes[metaOffset + 4], bytes[metaOffset + 5],
          bytes[metaOffset + 6], bytes[metaOffset + 7]
        );

        if (innerSize === 0) break;

        if (innerType === 'iprp') {
          // Search for ispe box inside iprp
          const iprpEnd = metaOffset + innerSize;
          let iprpOffset = metaOffset + 8;

          while (iprpOffset < iprpEnd - 8) {
            const propSize = view.getUint32(iprpOffset, false);
            const propType = String.fromCharCode(
              bytes[iprpOffset + 4], bytes[iprpOffset + 5],
              bytes[iprpOffset + 6], bytes[iprpOffset + 7]
            );

            if (propSize === 0) break;

            if (propType === 'ipco') {
              // Search for ispe inside ipco
              const ipcoEnd = iprpOffset + propSize;
              let ipcoOffset = iprpOffset + 8;

              while (ipcoOffset < ipcoEnd - 8) {
                const itemSize = view.getUint32(ipcoOffset, false);
                const itemType = String.fromCharCode(
                  bytes[ipcoOffset + 4], bytes[ipcoOffset + 5],
                  bytes[ipcoOffset + 6], bytes[ipcoOffset + 7]
                );

                if (itemSize === 0) break;

                if (itemType === 'ispe') {
                  // ispe box: 4 bytes header, 4 bytes version/flags, 4 bytes width, 4 bytes height
                  const width = view.getUint32(ipcoOffset + 12, false);
                  const height = view.getUint32(ipcoOffset + 16, false);
                  return { width, height };
                }

                ipcoOffset += itemSize;
              }
            }

            iprpOffset += propSize;
          }
        }

        metaOffset += innerSize;
      }
    }

    offset += boxSize;
  }

  return null;
}

// Calculate scaled dimensions maintaining aspect ratio
function scaleDimensions(original: ImageDimensions, targetWidth: number): ImageDimensions {
  const ratio = targetWidth / original.width;
  return {
    width: targetWidth,
    height: Math.round(original.height * ratio)
  };
}

// Detect media type from content-type header or filename
function detectMediaType(contentType: string | null, filename: string | null): { type: 'image' | 'video' | 'unknown'; extension: string } {
  const ct = contentType?.toLowerCase() || '';
  const fn = filename?.toLowerCase() || '';

  // Images
  if (ct.includes('image/heic') || ct.includes('image/heif') || fn.endsWith('.heic') || fn.endsWith('.heif')) {
    return { type: 'image', extension: 'heic' };
  }
  if (ct.includes('image/jpeg') || fn.endsWith('.jpg') || fn.endsWith('.jpeg')) {
    return { type: 'image', extension: 'jpg' };
  }
  if (ct.includes('image/png') || fn.endsWith('.png')) {
    return { type: 'image', extension: 'png' };
  }
  if (ct.includes('image/webp') || fn.endsWith('.webp')) {
    return { type: 'image', extension: 'webp' };
  }
  if (ct.includes('image/gif') || fn.endsWith('.gif')) {
    return { type: 'image', extension: 'gif' };
  }

  // Videos
  if (ct.includes('video/quicktime') || fn.endsWith('.mov')) {
    return { type: 'video', extension: 'mov' };
  }
  if (ct.includes('video/mp4') || fn.endsWith('.mp4')) {
    return { type: 'video', extension: 'mp4' };
  }

  return { type: 'unknown', extension: '' };
}

// Generate HTML snippets for an image
function generateImageSnippets(
  path: string,
  caption: string,
  dimensions: ImageDimensions,
  baseUrl: string
): { thumb: string; full: string } {
  const thumb = scaleDimensions(dimensions, 300);
  const fullWidth = scaleDimensions(dimensions, 800);

  const thumbHtml = `<a href="${baseUrl}/cdn-cgi/image/format=auto/${path}" target="_blank">
  <img alt="${escapeHtml(caption)}" src="${baseUrl}/cdn-cgi/image/width=300,format=auto/${path}"
       width="${thumb.width}" height="${thumb.height}" loading="lazy" />
</a>`;

  const fullHtml = `<a href="${baseUrl}/cdn-cgi/image/format=auto/${path}" target="_blank">
  <img alt="${escapeHtml(caption)}" src="${baseUrl}/cdn-cgi/image/width=800,format=auto/${path}"
       width="${fullWidth.width}" height="${fullWidth.height}" loading="lazy" />
</a>`;

  return { thumb: thumbHtml, full: fullHtml };
}

// Escape HTML special characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Prepend to uploads.md log file
async function prependToLog(
  bucket: R2Bucket,
  caption: string,
  snippets: { thumb: string; full: string } | string,
  isVideo: boolean
): Promise<void> {
  const logPath = 'uploads.md';
  const today = new Date().toISOString().split('T')[0];

  // Try to get existing log
  let existingContent = '';
  const existing = await bucket.get(logPath);
  if (existing) {
    existingContent = await existing.text();
  }

  // Create new entry
  let newEntry = '';
  if (isVideo) {
    newEntry = `### ${caption}\n\n${snippets}\n`;
  } else {
    const imgSnippets = snippets as { thumb: string; full: string };
    newEntry = `### ${caption}\n\n${imgSnippets.full}\n`;
  }

  const dateHeader = `## ${today}`;
  let newContent = '';

  // If the file already has today's date header, insert under it
  if (existingContent.includes(dateHeader)) {
    // Find the position right after the date header
    const headerIndex = existingContent.indexOf(dateHeader);
    const afterHeader = headerIndex + dateHeader.length;

    // Insert new entry right after the date header
    newContent = existingContent.slice(0, afterHeader) + '\n\n' + newEntry + '\n' + existingContent.slice(afterHeader);
  } else {
    // Add date header at the top with the new entry
    newContent = dateHeader + '\n\n' + newEntry;

    // Add existing content below if there is any
    if (existingContent.trim()) {
      newContent += '\n' + existingContent;
    }
  }

  await bucket.put(logPath, newContent, {
    httpMetadata: { contentType: 'text/markdown' }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/upload') {
      return new Response('Not Found', { status: 404 });
    }

    // GET /upload?token=xxx - Show HTML upload form
    if (request.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token || token !== env.AUTH_TOKEN) {
        return new Response('Invalid or missing token. Add ?token=YOUR_TOKEN to the URL.', {
          status: 401,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Serve HTML upload form
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Upload</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { margin-top: 0; color: #333; }
    label { display: block; margin: 20px 0 5px; font-weight: 500; }
    input[type="text"], input[type="file"], input[type="checkbox"] {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
    }
    input[type="text"], input[type="file"] {
      width: 100%;
      box-sizing: border-box;
    }
    input[type="checkbox"] {
      width: auto;
      margin-right: 8px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      font-weight: normal;
      font-size: 14px;
      color: #666;
    }
    button {
      background: #007aff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      width: 100%;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .status {
      margin-top: 20px;
      padding: 10px;
      border-radius: 5px;
      display: none;
    }
    .status.success { background: #d4edda; color: #155724; display: block; }
    .status.error { background: #f8d7da; color: #721c24; display: block; }
    .snippet {
      margin-top: 10px;
      padding: 10px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .warning {
      background: #fff3cd;
      color: #856404;
      padding: 10px;
      border-radius: 5px;
      font-size: 13px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 Blog Upload</h1>
    <form id="uploadForm">
      <label for="file">Select Images or Videos:</label>
      <input type="file" id="file" name="file" accept="image/*,video/*" multiple required>

      <label for="caption">Caption (optional):</label>
      <input type="text" id="caption" name="caption" placeholder="Enter caption...">

      <button type="submit" id="submitBtn">Upload</button>
    </form>

    <div id="videoWarning" class="warning" style="display: none;">
      ⚠️ Videos will be uploaded as MOV files. They may not play in all browsers. Convert them later if needed.
    </div>

    <div id="status" class="status"></div>
  </div>

  <script>
    const form = document.getElementById('uploadForm');
    const status = document.getElementById('status');
    const submitBtn = document.getElementById('submitBtn');
    const videoWarning = document.getElementById('videoWarning');
    const fileInput = document.getElementById('file');

    // Show warning when video is selected
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        let hasVideo = false;
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          if (file.type.startsWith('video/') || file.name.match(/\\.(mov|MOV|mp4|MP4)$/)) {
            hasVideo = true;
            break;
          }
        }
        videoWarning.style.display = hasVideo ? 'block' : 'none';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const captionInput = document.getElementById('caption');

      if (!fileInput.files || fileInput.files.length === 0) {
        status.className = 'status error';
        status.textContent = 'Please select at least one file';
        return;
      }

      const files = Array.from(fileInput.files);
      const baseCaption = captionInput.value || 'Untitled';

      submitBtn.disabled = true;
      status.className = 'status';
      status.style.display = 'block';

      const results = [];
      const warnings = [];

      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = files.length > 1 ? \`\${baseCaption} \${i + 1}\` : baseCaption;

        submitBtn.textContent = \`Uploading \${i + 1}/\${files.length}...\`;
        status.textContent = \`📤 Uploading \${file.name} (\${i + 1}/\${files.length})...\`;

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('caption', caption);

          const response = await fetch('/upload?token=${token}', {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (response.ok) {
            results.push(result);
            if (result.warning) {
              warnings.push(result.warning);
            }
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          status.className = 'status error';
          status.textContent = \`❌ Error uploading \${file.name}: \${error.message}\`;
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload';
          return;
        }
      }

      // All uploads successful
      status.className = 'status success';
      let message = \`✅ Successfully uploaded \${results.length} file(s)!<div class="snippet">Check uploads.md for your snippets</div>\`;

      if (warnings.length > 0) {
        message += '<div class="warning">' + warnings[0] + '</div>';
      }

      status.innerHTML = message;

      // Copy first snippet to clipboard
      if (results[0]?.snippets?.full) {
        navigator.clipboard.writeText(results[0].snippets.full).catch(() => {});
      } else if (results[0]?.snippet) {
        navigator.clipboard.writeText(results[0].snippet).catch(() => {});
      }

      // Reset form
      form.reset();
      videoWarning.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload';
    });
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Validate auth token (from header OR query param)
    const tokenParam = url.searchParams.get('token');
    const authHeader = request.headers.get('Authorization');
    const token = tokenParam || (authHeader?.replace('Bearer ', ''));

    if (!token || token !== env.AUTH_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const caption = (formData.get('caption') as string) || 'Untitled';

      if (!file) {
        return new Response('No file provided', { status: 400 });
      }

      // Detect media type
      const mediaInfo = detectMediaType(file.type, file.name);

      if (mediaInfo.type === 'unknown') {
        return new Response(`Unsupported file type: ${file.type}`, { status: 400 });
      }

      if (mediaInfo.type === 'image') {
        // Handle image upload
        const data = await file.arrayBuffer();
        const dimensions = await getImageDimensions(data, file.type);

        if (!dimensions) {
          return new Response('Could not extract image dimensions', { status: 400 });
        }

        const hash = await contentHash(data);
        const filename = `uploads/${hash}.${mediaInfo.extension}`;

        // Store in R2 (skip if already exists)
        if (!await env.BUCKET.head(filename)) {
          await env.BUCKET.put(filename, data, {
            httpMetadata: { contentType: file.type }
          });
        }

        // Generate snippets
        const snippets = generateImageSnippets(filename, caption, dimensions, env.BASE_URL);

        // Prepend to log
        await prependToLog(env.BUCKET, caption, snippets, false);

        // Return response
        return new Response(JSON.stringify({
          success: true,
          type: 'image',
          path: filename,
          dimensions,
          snippets
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } else if (mediaInfo.type === 'video') {
        const data = await file.arrayBuffer();
        const hash = await contentHash(data);
        const filename = `uploads/${hash}.${mediaInfo.extension}`;

        // Store in R2 (skip if already exists)
        if (!await env.BUCKET.head(filename)) {
          await env.BUCKET.put(filename, data, {
            httpMetadata: { contentType: file.type }
          });
        }

        const dimensions = { width: 1920, height: 1080 };
        const snippet = `<video controls width="800" height="450" preload="none">
  <source src="${env.BASE_URL}/${filename}" type="${file.type}">
</video>`;

        await prependToLog(env.BUCKET, caption, snippet, true);

        return new Response(JSON.stringify({
          success: true,
          type: 'video',
          path: filename,
          dimensions,
          snippet
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response('Unknown error', { status: 500 });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Error: ${message}`, { status: 500 });
    }
  }
};
