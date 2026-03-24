import type { APIRoute } from "astro";

interface RawgGame {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  platforms?: Array<{
    platform?: {
      name?: string;
    };
  }>;
}

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("query")?.trim() ?? "";

  if (query.length < 2) {
    return new Response(JSON.stringify({ ok: true, data: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const apiKey = import.meta.env.RAWG_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        errorMessage: "Falta RAWG_API_KEY en el entorno del servidor.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const endpoint = new URL("https://api.rawg.io/api/games");
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("search", query);
  endpoint.searchParams.set("page_size", "8");

  try {
    const response = await fetch(endpoint.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          errorMessage: "No fue posible consultar RAWG en este momento.",
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const payload = (await response.json()) as { results?: RawgGame[] };

    const data = (payload.results ?? [])
      .filter((item) => Boolean(item.background_image))
      .map((item) => ({
        id: item.id,
        title: item.name,
        released: item.released,
        image: item.background_image,
        platforms: (item.platforms ?? [])
          .map((p) => p.platform?.name?.trim())
          .filter((name): name is string => Boolean(name)),
      }));

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[rawg-cover]", error);
    return new Response(
      JSON.stringify({
        ok: false,
        errorMessage: "Error de red al consultar portadas.",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
