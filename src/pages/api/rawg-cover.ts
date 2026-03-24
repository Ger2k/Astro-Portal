import type { APIRoute } from "astro";

export const prerender = false;

/** Normaliza un string para comparación: minúsculas, sin diacríticos, solo alfanuméricos y espacios. */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/  +/g, " ");
}

/** Puntúa la coincidencia entre el título buscado y el nombre de un candidato. */
function scoreMatch(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1000;
  if (c.startsWith(q)) return 850;
  if (q.startsWith(c)) return 700;
  if (c.includes(q)) return 600;
  const qTokens = q.split(" ");
  const cSet = new Set(c.split(" "));
  const common = qTokens.filter((t) => cSet.has(t)).length;
  if (common > 0) return Math.round((common / qTokens.length) * 500);
  return 0;
}

/** Elimina comillas/paréntesis envolventes y valida que sea https://. */
function sanitizeUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  const u = raw.trim().replace(/^["'(]+|["')]+$/g, "");
  return u.startsWith("https://") ? u : "";
}

interface RawgGame {
  name?: string;
  background_image?: string | null;
  short_screenshots?: Array<{ image?: string }>;
}

interface RawgResponse {
  results?: RawgGame[];
}

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAWG_API_KEY as string | undefined;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "RAWG_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const title = (url.searchParams.get("title") ?? "").trim();

  if (!title) {
    return new Response(JSON.stringify({ images: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawgUrl =
      `https://api.rawg.io/api/games` +
      `?search=${encodeURIComponent(title)}` +
      `&search_precise=true` +
      `&page_size=8` +
      `&key=${apiKey}`;

    const res = await fetch(rawgUrl);

    if (!res.ok) {
      return new Response(JSON.stringify({ images: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = (await res.json()) as RawgResponse;
    const results = data.results ?? [];

    // Puntuar y ordenar candidatos
    const scored = results
      .map((game) => ({ game, score: scoreMatch(title, game.name ?? "") }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    if (scored.length === 0) {
      return new Response(JSON.stringify({ images: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Recoger URLs deduplicadas
    const seen = new Set<string>();
    const images: string[] = [];

    const addUrl = (raw: string | null | undefined) => {
      if (images.length >= 4) return;
      const clean = sanitizeUrl(raw);
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        images.push(clean);
      }
    };

    // Primera pasada: background_image
    for (const { game } of scored) {
      addUrl(game.background_image);
      if (images.length >= 4) break;
    }

    // Segunda pasada: screenshots para completar hasta 4
    if (images.length < 4) {
      for (const { game } of scored) {
        for (const ss of game.short_screenshots ?? []) {
          addUrl(ss.image);
          if (images.length >= 4) break;
        }
        if (images.length >= 4) break;
      }
    }

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ images: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
