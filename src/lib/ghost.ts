// src/lib/ghost.ts
import GhostContentAPI from "@tryghost/content-api";
import { GHOST_API_URL, GHOST_CONTENT_API_KEY } from "astro:env/server";

import type { GhostBrowseParams, GhostPost, PostsOrPages } from "@/types/ghost";

const api = new GhostContentAPI({
  url: GHOST_API_URL,
  key: GHOST_CONTENT_API_KEY,
  version: "v5.0",
});

export async function getPosts(
  params: GhostBrowseParams = {},
): Promise<PostsOrPages> {
  const posts = await api.posts.browse({
    include: ["tags", "authors"],
    ...params,
  });
  return posts as PostsOrPages;
}

export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const post = await api.posts.read(
      { slug },
      { include: ["tags", "authors"] },
    );
    return post as GhostPost;
  } catch {
    return null;
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await api.posts.browse({
    limit: "all",
    fields: ["slug"],
  });
  return posts.map((post) => post.slug);
}
