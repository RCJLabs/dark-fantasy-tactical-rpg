/** Root-absolute in the preview, and under the repo path on GitHub Pages. */
export function asset(path: string) {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${clean}`;
}
