export function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function approximateTokenCount(input: string): number {
  return Math.ceil(input.split(/\s+/).filter(Boolean).length * 1.3);
}

export function snippet(text: string, length = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= length) {
    return clean;
  }
  return `${clean.slice(0, length - 1).trim()}…`;
}
