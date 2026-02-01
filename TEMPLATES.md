# Zola Template System Guide

This document explains how content (markdown files) and templates (HTML files) work together in this Zola site.

## The Big Picture

Zola uses **markdown files** (content) + **HTML templates** (presentation) to generate your site. Think of it like:

```
┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│  Markdown    │   +     │   Templates   │    =    │  Final HTML  │
│  (content)   │         │  (structure)  │         │   (output)   │
└──────────────┘         └───────────────┘         └──────────────┘
```

## Your Site's Entry Points & Flow

```
ROOT: yoursite.com/
├─ content/_index.md ──────────► templates/index.html ──┐
│  (frontmatter says:                                    │
│   template = "index.html")                             │
│                                                         │
├─ content/blog/_index.md ─────► templates/blog.html ───┤
│  (frontmatter says:                                    ├──► ALL extend
│   template = "blog.html")                              │    base.html
│                                                         │
└─ content/blog/2024-*.md ─────► templates/blog-page.html┘
   (individual posts use
    page_template from parent)
```

## Template Inheritance Chain

```
┌─────────────────────────────────────────────────────┐
│ base.html                                           │
│ • Common header ("JASON KNIGHT")                    │
│ • Common footer (LinkedIn, GitHub links)            │
│ • CSS styling                                       │
│ • Has {% block content %} placeholder               │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┬──────────────────┐
          │                     │                  │
          ▼                     ▼                  ▼
    ┌──────────┐         ┌──────────┐      ┌─────────────┐
    │index.html│         │blog.html │      │blog-page.html│
    │          │         │          │      │             │
    │Fills the │         │Lists all │      │Single blog  │
    │{% block  │         │blog posts│      │post with    │
    │content %}│         │in section│      │date, reading│
    │with home │         │          │      │time, nav    │
    │page stuff│         │          │      │             │
    └──────────┘         └──────────┘      └─────────────┘
```

## How Markdown Files Specify Templates

Every `_index.md` file (section index) has frontmatter that tells Zola which template to use:

```
content/_index.md:
┌────────────────────────────┐
│ +++                        │
│ template = "index.html"    │ ← This line picks the template!
│ page_template = "blog-page.html" │ ← Pages under this use this
│ +++                        │
│                            │
│ Your markdown content...   │
└────────────────────────────┘
```

## Example Flow for Homepage

```
User visits yoursite.com/
        │
        ▼
content/_index.md is processed
        │
        ├─► Reads frontmatter: template = "index.html"
        ├─► Converts markdown to HTML
        │
        ▼
templates/index.html is used
        │
        ├─► Extends base.html (gets header/footer/CSS)
        ├─► Fills {% block content %} with:
        │   • Your markdown content
        │   • Garden section list (from content/garden/_index.md)
        │   • Blog section list (from content/blog/_index.md)
        │
        ▼
Final HTML sent to browser
```

## Key Concepts

1. **_index.md** = Section pages (e.g., `/blog/`)
2. **Other .md files** = Individual pages/posts (e.g., `/blog/my-post/`)
3. **template** field = Which HTML template to use for THIS section
4. **page_template** field = Which HTML template to use for pages UNDER this section
5. **{% extends "base.html" %}** = Template inheritance (share common elements)
6. **{% block content %}** = Placeholder that child templates fill in

## Special Note About index.html

The `templates/index.html` template does something special - it manually loads OTHER sections (garden and blog) using `get_section()` and displays them on the homepage. This is why you see both garden and blog content when visiting the root URL.

```jinja2
{% set section = get_section(path="garden/_index.md") %}
<!-- Display garden content -->

{% set section = get_section(path="blog/_index.md") %}
<!-- Display blog content -->
```

This allows the homepage to aggregate content from multiple sections into a single unified view.
