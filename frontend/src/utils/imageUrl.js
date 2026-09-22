/**
 * Resolve image URL to ensure relative uploads paths point to the backend host
 * @param {string} url
 * @returns {string|null}
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  // Get base backend URL from VITE_API_URL or fallback
  let rawApiUrl = import.meta.env.VITE_API_URL || '';
  let origin = '';

  try {
    if (rawApiUrl.startsWith('http')) {
      const parsed = new URL(rawApiUrl);
      origin = parsed.origin;
    }
  } catch (e) {
    origin = '';
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return origin ? `${origin}${cleanPath}` : cleanPath;
}

export default resolveImageUrl;
