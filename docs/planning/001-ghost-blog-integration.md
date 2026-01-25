# Ghost CMS Blog Integration - Implementation Plan

**Project**: Astro v5 SSG Site  
**Date**: 2026-01-20  
**Status**: Planning

---

## Overview

This document outlines the implementation plan for integrating Ghost CMS as a headless CMS for the blog section of the Astro v5 static site. The solution uses:

- **SSG Strategy**: Pre-render all blog posts at build time
- **Data Fetching**: Ghost Content API v5
- **Build Triggers**: n8n webhooks to trigger rebuilds on content changes
- **Environment**: Type-safe environment variables via `astro:env/server`
- **Styling**: TailwindCSS v4, DaisyUI components, `@tailwindcss/typography` for prose

---

## 1. Architecture

### 1.1 SSG Strategy

The blog will use Astro's Static Site Generation (SSG) with the following flow:

```plain
┌─────────────┐
│  Ghost CMS  │
│  (Headless) │
└──────┬──────┘
       │ Content API
       │
       ▼
┌─────────────────────┐
│  Build Time         │
│  getStaticPaths()   │
│  Fetch all posts    │
│  Generate HTML      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Static Output      │
│  /blog/index.html   │
│  /blog/[slug].html  │
└─────────────────────┘
```

**Key Decisions**:

- **No ISR**: Simple SSG with full rebuilds on content updates
- **Build-time fetching**: All Ghost content fetched once during build
- **Zero runtime API calls**: Production site is fully static

### 1.2 n8n Build Triggers

**Workflow**:

1. Ghost publishes/updates a post → n8n webhook trigger
2. n8n validates the change
3. n8n triggers deployment webhook (Vercel/Netlify/GitHub Actions)
4. Build process runs → fetches latest content → deploys

**Example n8n Webhook Endpoint**:

```plain
POST /webhooks/ghost-build
{
  "event": "post.published",
  "post": { ... }
}
```

**Implementation Notes**:

- Use n8n's HTTP Request node to call deployment webhook
- Add retry logic for failed builds
- Cache Ghost API responses during build to avoid rate limits

---

## 2. Environment Variables with `astro:env/server`

### 2.1 Overview

Astro v5 introduces a built-in `astro:env` module for type-safe environment variables. This replaces `import.meta.env` with a schema-based approach.

### 2.2 Configuration

**Update `astro.config.mjs`**:

```javascript
// astro.config.mjs
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
  site: "https://blog.duchi.click",
  output: "static",
  image: {
    domains: ["cdn.duchi.click"],
  },
  env: {
    schema: {
      GHOST_API_URL: envField.string({
        context: "server",
        access: "public",
        default: "https://demo.ghost.io",
      }),
      GHOST_CONTENT_API_KEY: envField.string({
        context: "server",
        access: "secret",
        description: "Ghost Content API Key (server-side only)",
      }),
      GHOST_API_VERSION: envField.string({
        context: "server",
        access: "public",
        default: "v5.0",
        description: "Ghost API version",
      }),
    },
  },
});
```

### 2.3 Usage Pattern

```typescript
// In Astro frontmatter or server-side modules
import { GHOST_API_URL, GHOST_CONTENT_API_KEY } from "astro:env/server";

const posts = await ghost.posts.browse(
  {
    limit: 10,
  },
  {
    url: GHOST_API_URL,
    key: GHOST_CONTENT_API_KEY,
  },
);
```

### 2.4 Environment Files

**Create `.env.example`**:

```bash
# Ghost CMS Configuration
GHOST_API_URL=https://your-ghost-instance.com
GHOST_CONTENT_API_KEY=your_content_api_key_here
GHOST_API_VERSION=v5.0
```

**Create `.env.local`** (gitignored):

```bash
GHOST_API_URL=https://duchi.click/ghost
GHOST_CONTENT_API_KEY=production_key_here
GHOST_API_VERSION=v5.0
```

**Security Notes**:

- `access: 'secret'` ensures `GHOST_CONTENT_API_KEY` is never included in client bundles
- Server-side variables can only be imported in `.astro` frontmatter, API routes, or Node.js modules

---

## 3. Dependencies

### 3.1 Required Packages

```bash
# Ghost Content API
npm install @tryghost/content-api

# TailwindCSS Typography plugin for prose styling
npm install -D @tailwindcss/typography

# Optional: Zod for runtime schema validation
npm install zod
```

### 3.2 Package Versions

| Package                   | Version  | Purpose                             |
| ------------------------- | -------- | ----------------------------------- |
| `@tryghost/content-api`   | Latest   | Ghost API client                    |
| `@tailwindcss/typography` | Latest   | Prose classes for blog content      |
| `zod`                     | Latest   | Schema validation (optional)        |
| `astro`                   | ^5.16.11 | Astro framework (already installed) |

### 3.3 TailwindCSS v4 Typography Setup

**Update `src/assets/app.css`**:

```css
/* src/assets/app.css */
@import "tailwindcss";
@plugin "daisyui";
@plugin "@tailwindcss/typography";
```

**Usage in Components**:

```astro
<article class="prose prose-slate dark:prose-invert lg:prose-xl">
  <slot />
</article>
```

---

## 4. Data Layer: `src/lib/ghost.ts`

### 4.1 Singleton Pattern

Implement a singleton Ghost client for consistent API usage across the application.

```typescript
// src/lib/ghost.ts
import GhostContentAPI from "@tryghost/content-api";
import {
  GHOST_API_URL,
  GHOST_CONTENT_API_KEY,
  GHOST_API_VERSION,
} from "astro:env/server";

interface PostParams {
  limit?: number;
  page?: number;
  include?: ("tags" | "authors" | "count" | "authors" | "tags")[];
  filter?: string;
  fields?: string;
  order?: string;
}

class GhostClient {
  private static instance: GhostContentAPI;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): GhostContentAPI {
    if (!GhostClient.instance) {
      GhostClient.instance = new GhostContentAPI({
        url: GHOST_API_URL,
        key: GHOST_CONTENT_API_KEY,
        version: GHOST_API_VERSION as "v5.0" | "v4" | "v3" | "v2",
        makeRequest: async ({ url, method, params, headers }) => {
          const response = await fetch(url, {
            method,
            headers,
            body: method !== "GET" ? JSON.stringify(params) : undefined,
          });

          if (!response.ok) {
            throw new Error(
              `Ghost API error: ${response.status} ${response.statusText}`,
            );
          }

          return response.json();
        },
      });
    }

    return GhostClient.instance;
  }

  public static async getPosts(params: PostParams = {}) {
    const client = GhostClient.getInstance();
    return client.posts.browse({
      limit: 10,
      include: ["tags", "authors"],
      ...params,
    });
  }

  public static async getPostBySlug(slug: string) {
    const client = GhostClient.getInstance();
    const posts = await client.posts.browse({
      slug,
      limit: 1,
      include: ["tags", "authors"],
    });

    return posts[0] || null;
  }

  public static async getPostById(id: string) {
    const client = GhostClient.getInstance();
    return client.posts.read({
      id,
      include: ["tags", "authors"],
    });
  }

  public static async getTags(params: any = {}) {
    const client = GhostClient.getInstance();
    return client.tags.browse({
      limit: "all",
      ...params,
    });
  }
}

export default GhostClient;

// Export convenience functions
export const getPosts = (params?: PostParams) => GhostClient.getPosts(params);
export const getPostBySlug = (slug: string) => GhostClient.getPostBySlug(slug);
export const getPostById = (id: string) => GhostClient.getPostById(id);
export const getTags = (params?: any) => GhostClient.getTags(params);
```

### 4.2 Type Definitions

```typescript
// src/types/ghost.ts
export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string;
  comment_id: string | null;
  feature_image: string | null;
  featured: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  custom_excerpt: string | null;
  codeinjection_head: string | null;
  codeinjection_foot: string | null;
  custom_template: string | null;
  canonical_url: string | null;
  tags: GhostTag[];
  authors: GhostAuthor[];
  primary_author: GhostAuthor;
  primary_tag: GhostTag;
  url: string;
  excerpt: string;
  reading_time: number;
  access: boolean;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  email_subject: string | null;
  frontend: string | null;
  page: boolean;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  feature_image: string | null;
  visibility: string;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  count: number | null;
}

export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image: string | null;
  cover_image: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  facebook: string | null;
  twitter: string | null;
  meta_title: string | null;
  meta_description: string | null;
  url: string;
}
```

---

## 5. UI Components

### 5.1 Blog Index: `src/pages/blog/index.astro`

```astro
---
// src/pages/blog/index.astro
import BaseLayout from "@/layouts/base-layout.astro";
import { getPosts } from "@/lib/ghost";
import type { GhostPost } from "@/types/ghost";

interface Props {
  posts: GhostPost[];
}

const { posts } = Astro.props;

// Generate SEO metadata
const pageTitle = "Blog | blog.duchi.click";
const pageDescription = "Latest articles and thoughts on software development.";
---

<BaseLayout title={pageTitle} description={pageDescription}>
  <section class="container mx-auto px-4 py-12">
    <div class="mb-12">
      <h1 class="text-4xl font-bold mb-4">Blog</h1>
      <p class="text-lg text-base-content/70">{pageDescription}</p>
    </div>

    <!-- Blog Post Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <a
          href={`/blog/${post.slug}`}
          class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300"
        >
          <figure class="aspect-video">
            {post.feature_image ? (
              <img
                src={post.feature_image}
                alt={post.title}
                class="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div class="w-full h-full bg-base-200 flex items-center justify-center">
                <span class="text-4xl opacity-20">📝</span>
              </div>
            )}
          </figure>
          <div class="card-body">
            <div class="flex items-center gap-2 mb-2">
              {post.primary_tag && (
                <span class="badge badge-primary badge-sm">
                  {post.primary_tag.name}
                </span>
              )}
              <span class="text-xs text-base-content/50">
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <h2 class="card-title text-xl">{post.title}</h2>
            <p class="text-sm text-base-content/70 line-clamp-3">
              {post.excerpt || post.custom_excerpt}
            </p>
            <div class="card-actions justify-end mt-4">
              <span class="text-primary link link-hover text-sm">
                Read more →
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>

    {posts.length === 0 && (
      <div class="text-center py-12">
        <p class="text-base-content/50">No posts found.</p>
      </div>
    )}
  </section>
</BaseLayout>

---

// Data fetching for static generation
export async function getStaticPaths() {
  const posts = await getPosts({ limit: 'all' });

  return [{
    params: {},
    props: { posts }
  }];
}
```

### 5.2 Blog Post Detail: `src/pages/blog/[slug].astro`

```astro
---
// src/pages/blog/[slug].astro
import BaseLayout from "@/layouts/base-layout.astro";
import { getPostBySlug, getPosts } from "@/lib/ghost";
import type { GhostPost } from "@/types/ghost";

interface Props {
  post: GhostPost;
  relatedPosts: GhostPost[];
}

const { post, relatedPosts } = Astro.props;

if (!post) {
  return Astro.redirect('/404');
}

const pageTitle = `${post.title} | duchi.click`;
const pageDescription = post.custom_excerpt || post.excerpt || '';
const featuredImage = post.feature_image;

const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
---

<BaseLayout
  title={pageTitle}
  description={pageDescription}
  image={featuredImage}
>
  <article class="container mx-auto px-4 py-12 max-w-4xl">
    <!-- Article Header -->
    <header class="mb-12">
      {post.primary_tag && (
        <span class="badge badge-primary badge-lg mb-4">
          {post.primary_tag.name}
        </span>
      )}

      <h1 class="text-4xl md:text-5xl font-bold mb-6">
        {post.title}
      </h1>

      <div class="flex items-center gap-4 text-base-content/70">
        <div class="flex items-center gap-2">
          {post.primary_author.profile_image && (
            <img
              src={post.primary_author.profile_image}
              alt={post.primary_author.name}
              class="w-10 h-10 rounded-full"
            />
          )}
          <span class="font-medium">{post.primary_author.name}</span>
        </div>
        <span>·</span>
        <time datetime={post.published_at}>{publishedDate}</time>
        <span>·</span>
        <span>{post.reading_time} min read</span>
      </div>

      {post.feature_image && (
        <figure class="mt-8 rounded-lg overflow-hidden">
          <img
            src={post.feature_image}
            alt={post.title}
            class="w-full"
          />
        </figure>
      )}
    </header>

    <!-- Article Content with Typography -->
    <div class="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
      <div set:html={post.html} />
    </div>

    <!-- Related Posts -->
    {relatedPosts.length > 0 && (
      <section class="mt-16 pt-16 border-t border-base-200">
        <h2 class="text-2xl font-bold mb-8">Related Posts</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedPosts.map((relatedPost) => (
            <a
              href={`/blog/${relatedPost.slug}`}
              class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div class="card-body">
                <h3 class="card-title text-lg">{relatedPost.title}</h3>
                <p class="text-sm text-base-content/70 line-clamp-2">
                  {relatedPost.excerpt}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    )}
  </article>
</BaseLayout>

---

// Generate static paths for all posts
export async function getStaticPaths() {
  const posts = await getPosts({ limit: 'all' });

  return posts.map((post) => ({
    params: { slug: post.slug },
    props: {
      post,
      // Get related posts (same tag, excluding current)
      relatedPosts: []
    }
  }));
}
```

---

## 6. Step-by-Step Implementation Guide

### Phase 1: Setup & Configuration (30 min)

1. **Install Dependencies**

   ```bash
   npm install @tryghost/content-api
   npm install -D @tailwindcss/typography
   ```

2. **Configure Environment Variables**

   Create `.env.example`:

   ```bash
   GHOST_API_URL=https://your-ghost-instance.com
   GHOST_CONTENT_API_KEY=your_content_api_key_here
   GHOST_API_VERSION=v5.0
   ```

   Update `astro.config.mjs` with env schema.

3. **Configure Tailwind Typography**

   Update `src/assets/app.css`:

   ```css
   @import "tailwindcss";
   @plugin "daisyui";
   @plugin "@tailwindcss/typography";
   ```

4. **Create Type Definitions**

   Create `src/types/ghost.ts` with Ghost post/tag/author interfaces.

### Phase 2: Data Layer (45 min)

1. **Create Ghost Client Singleton**

   Create `src/lib/ghost.ts` with:
   - Singleton pattern implementation
   - Methods: `getPosts`, `getPostBySlug`, `getPostById`, `getTags`
   - Type-safe API calls
   - Error handling

2. **Test Ghost API Connection**

   Create test script:

   ```typescript
   // src/lib/ghost.test.ts
   import GhostClient from "./ghost";

   const posts = await GhostClient.getPosts({ limit: 1 });
   console.log("✅ Ghost API connected:", posts.length, "posts found");
   ```

### Phase 3: UI Components (90 min)

1. **Create Blog Index Page**

   Create `src/pages/blog/index.astro`:
   - Grid layout with DaisyUI Cards
   - `getStaticPaths()` for pre-rendering
   - Post metadata display
   - Responsive design

2. **Create Blog Detail Page**

   Create `src/pages/blog/[slug].astro`:
   - Dynamic routing with slug
   - `prose` typography for content
   - Author and date display
   - Related posts section
   - SEO metadata

3. **Style Refinements**
   - Add prose variants for dark mode
   - Custom card hover effects
   - Responsive typography scaling

### Phase 4: Integration & Testing (45 min)

1. **Local Development**

   ```bash
   npm run dev
   ```

2. **Verify Static Generation**

   ```bash
   npm run build
   ```

3. **Test Routes**
   - Visit `http://localhost:4321/blog` → Blog index
   - Visit `http://localhost:4321/blog/[slug]` → Post detail

4. **Check Generated HTML**
   ```bash
   cat dist/blog/index.html
   cat dist/blog/[slug]/index.html
   ```

### Phase 5: Deployment & n8n Integration (60 min)

1. **Set Environment Variables in Deployment**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - GitHub Actions: Repository Secrets

2. **Configure n8n Workflow**

   Create n8n workflow:

   ```
   Webhook Trigger (Ghost)
   ↓
   Filter: post.published OR post.updated
   ↓
   HTTP Request: POST to Deployment Webhook
   ↓
   Wait for Build Completion
   ↓
   Notification: Success/Failure
   ```

3. **Test Build Triggers**
   - Publish a new post in Ghost
   - Verify n8n receives webhook
   - Verify deployment triggers
   - Verify new post appears on site

4. **Performance Optimization**
   - Enable Ghost CDN caching
   - Add image optimization
   - Monitor build times
   - Set up caching headers

---

## 7. Deployment Checklist

- [ ] Environment variables configured in production
- [ ] Ghost Content API key secured (server-side only)
- [ ] Tailwind typography plugin enabled
- [ ] Blog index page generating correctly
- [ ] Blog detail pages generating with correct slugs
- [ ] n8n webhook configured in Ghost
- [ ] n8n → Deployment webhook working
- [ ] SEO metadata populating correctly
- [ ] Images loading from Ghost CDN
- [ ] Dark mode prose styling working
- [ ] Build time acceptable (< 2 min for 50 posts)
- [ ] Error handling for missing posts (404 redirect)

---

## 8. Future Enhancements

1. **Content Layer Integration**: Migrate to Astro v5's Content Layer with custom Ghost loader
2. **Pagination**: Add pagination to blog index for large post counts
3. **Search**: Implement client-side search with FlexSearch or Pagefind
4. **RSS Feed**: Generate RSS/Atom feed for blog posts
5. **Series/Collections**: Group posts by tags or custom fields
6. **Comments**: Integrate comment system (Giscus, Disqus, or custom)
7. **Reading Progress**: Add progress bar for long-form content
8. **Table of Contents**: Auto-generate TOC from headings

---

## 9. References

- [Ghost Content API Docs](https://ghost.org/docs/content-api/)
- [Astro v5 Environment Variables](https://docs.astro.build/en/guides/configuration-reference/#env)
- [TailwindCSS Typography](https://tailwindcss.com/docs/typography-plugin)
- [DaisyUI Components](https://daisyui.com/components/)
- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

---

## Appendix A: Ghost API Quick Reference

### Fetch All Posts

```typescript
const posts = await ghost.posts.browse({
  limit: "all",
  include: ["tags", "authors"],
});
```

### Fetch Single Post

```typescript
const post = await ghost.posts.read({
  id: "post_id",
  include: ["tags", "authors"],
});
```

### Filter Posts by Tag

```typescript
const posts = await ghost.posts.browse({
  filter: "tags:technology",
});
```

### Pagination

```typescript
const posts = await ghost.posts.browse({
  limit: 10,
  page: 1,
});
```

---

## Appendix B: Common Issues & Solutions

### Issue: `GHOST_CONTENT_API_KEY` exposed in client bundle

**Solution**: Ensure `access: 'secret'` in `astro.config.mjs`:

```javascript
GHOST_CONTENT_API_KEY: envField.string({
  context: "server",
  access: "secret", // ← Critical
});
```

### Issue: Build fails due to missing posts

**Solution**: Add error handling in `getStaticPaths()`:

```typescript
export async function getStaticPaths() {
  try {
    const posts = await getPosts({ limit: "all" });
    return posts.map((post) => ({
      params: { slug: post.slug },
      props: { post },
    }));
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}
```

### Issue: Typography styles not applying

**Solution**: Ensure `@plugin "@tailwindcss/typography"` is in `src/assets/app.css` and dev server is restarted.

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-20
