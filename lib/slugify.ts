/**
 * Converts text to a URL-friendly slug (lowercase, hyphens, alphanumeric).
 * Matches backend slugify - used for products, categories, roles, and any entity requiring a slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
