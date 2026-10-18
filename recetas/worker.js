// Intermediario para importar recetas desde webs (opcional, gratis en Cloudflare Workers).
// Descarga la página que se le pide y se la devuelve a la app. Solo responde a vuestra app.
const PERMITIDO = "https://santiagocapo.github.io";

export default {
  async fetch(req) {
    const origen = req.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": PERMITIDO, "Vary": "Origin" };
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    if (origen && origen !== PERMITIDO) return new Response("No permitido", { status: 403 });

    const url = new URL(req.url).searchParams.get("url");
    if (!url || !/^https?:\/\//i.test(url)) return new Response("Falta el parámetro url", { status: 400, headers: cors });

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "es-ES,es;q=0.9",
        "Accept": "text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
    });
    const tipo = r.headers.get("Content-Type") || "text/html";
    return new Response(r.body, { status: r.status, headers: { ...cors, "Content-Type": tipo, "Cache-Control": "public, max-age=3600" } });
  }
};
