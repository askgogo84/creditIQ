// Single source of truth for the hand-curated blog cards.
// Both the /blog listing (app/blog/page.tsx) and the landing page's "From the
// blog" grid import from here so the two can never drift apart. These are the
// real published posts; none currently carry a cover image, so surfaces that
// need art render a typographic card rather than a stock placeholder.

export type FeaturedPost = {
  slug: string;
  tag: string;
  tagColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string; // human display, e.g. "May 25, 2026"
  iso: string; // sortable YYYY-MM-DD (used only for "latest" ordering)
  featured?: boolean;
};

// Emptied 3 Aug 2026: these 7 were card metadata only — the article bodies were
// never written (the seed scripts insert `sections: '[]'`, i.e. stubs), so every
// /blog/[slug] link 404'd. Rendering the cards while nothing backs them violated
// "nothing invented ships." Seeding would have produced hollow 200s (headline +
// one intro line, empty body) — worse than a 404 — so the entries were pulled
// instead. Restore posts here ONLY once real bodies exist in blog_posts (published,
// sections populated). The corresponding sitemap slugs were removed in the same change.
export const BLOG_POSTS: FeaturedPost[] = [];

// Latest posts by publish date, newest first. ISO dates sort lexicographically.
export function latestPosts(n?: number): FeaturedPost[] {
  const sorted = [...BLOG_POSTS].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  return typeof n === 'number' ? sorted.slice(0, n) : sorted;
}
