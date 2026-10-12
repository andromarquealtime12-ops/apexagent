export function normalizeTitle(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function canonicalKey(o: { title: string; url: string; stable_id?: string | undefined }): string {
  return [normalizeTitle(o.title), domainOf(o.url), o.stable_id ?? ""].join("|");
}

export function dedupe<T extends { title: string; url: string; stable_id?: string | undefined }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = canonicalKey(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
