/**
 * Google Books API client (public endpoint, no API key required).
 * Used to search any book in the world and pull cover thumbnails
 * + a Google info link that exposes purchase options (Amazon, Kobo, etc.).
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

interface GBVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    infoLink?: string;
    canonicalVolumeLink?: string;
    description?: string;
  };
}

/** Upgrade thumbnail to https + drop the `&edge=curl` artifact. */
function normalizeCover(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
}

export async function searchGoogleBooks(query: string, signal?: AbortSignal): Promise<GoogleBookResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Google Books search failed (${res.status})`);
  const data = (await res.json()) as { items?: GBVolume[] };
  return (data.items || []).map((v) => {
    const info = v.volumeInfo || {};
    const cover =
      normalizeCover(info.imageLinks?.thumbnail) ||
      normalizeCover(info.imageLinks?.smallThumbnail);
    return {
      id: v.id,
      title: info.title || "Untitled",
      authors: info.authors || [],
      pageCount: info.pageCount,
      cover,
      infoLink: info.canonicalVolumeLink || info.infoLink,
      description: info.description,
    };
  });
}
