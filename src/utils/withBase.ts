const rawBase = import.meta.env.BASE_URL ?? "/";
const normalizedBase = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");

export function withBase(path = "/") {
  if (/^(https?:|mailto:|#)/.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const result = `${normalizedBase}${normalizedPath}`;

  return result || "/";
}

export function stripBase(pathname: string) {
  if (!normalizedBase || !pathname.startsWith(normalizedBase)) {
    return pathname;
  }

  return pathname.slice(normalizedBase.length) || "/";
}
