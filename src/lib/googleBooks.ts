/**
 * Book search client.
 *
 * Primary source: Open Library (no API key, generous quota, covers + work page
 * with "Buy this book" links to Amazon / Better World Books / Bookshop).
 * Kept the `googleBooks` filename + `GoogleBookResult` shape so existing
 * imports keep working without churn.
 */

export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  pageCount?: number;
  cover?: string;
  infoLink?: string;
  description?: string;
}

interface OLDoc {
  key?: string;                  // "/works/OL12345W"
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
  first_publish_year?: number;
}

interface OLSearchResponse {
  docs?: OLDoc[];
}

function coverFromDoc(d: OLDoc): string | undefined {
  if (d.cover_i) return `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`;
  if (d.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${d.cover_edition_key}-M.jpg`;
  if (d.isbn && d.isbn[0]) return `https://covers.openlibrary.org/b/isbn/${d.isbn[0]}-M.jpg`;
  return undefined;
}

function infoLinkFromDoc(d: OLDoc): string | undefined {
  if (d.key) return `https://openlibrary.org${d.key}`;
  return undefined;
}

export async function searchGoogleBooks(query: string, signal?: AbortSignal): Promise<GoogleBookResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `https://openlibrary.org/search.json` +
    `?q=${encodeURIComponent(q)}` +
    `&limit=12` +
    `&fields=key,title,author_name,number_of_pages_median,cover_i,cover_edition_key,isbn,first_publish_year`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Library search failed (${res.status})`);
  const data = (await res.json()) as OLSearchResponse;

  return (data.docs || []).slice(0, 12).map((d) => ({
    id: d.key || `${d.title}-${d.first_publish_year ?? ""}`,
    title: d.title || "Untitled",
    authors: d.author_name || [],
    pageCount: d.number_of_pages_median,
    cover: coverFromDoc(d),
    infoLink: infoLinkFromDoc(d),
  }));
}
