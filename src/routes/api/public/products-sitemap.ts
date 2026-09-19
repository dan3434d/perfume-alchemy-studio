import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://www.abdulrahmanperfumes.com.au";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const Route = createFileRoute("/api/public/products-sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("products")
          .select("slug,updated_at")
          .eq("is_active", true)
          // Exclude sub-dollar items (e.g. internal test products) from search engines.
          .gte("price", 1);

        const urls = (data || [])
          .map(
            (p: any) => `  <url><loc>${esc(`${SITE}/shop/${p.slug}`)}</loc><lastmod>${new Date(
              p.updated_at || Date.now(),
            ).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
