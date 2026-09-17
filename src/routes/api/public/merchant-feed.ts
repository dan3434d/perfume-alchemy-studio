import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://www.abdulrahmanperfumes.com.au";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const clean = (s: unknown, max = 4900) =>
  esc(String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max));

const absoluteImage = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SITE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const Route = createFileRoute("/api/public/merchant-feed")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("products")
          .select(
            "id,name,slug,description,long_description,price,compare_at_price,retail_price,image_url,stock,gender,size,inspired_by_brand,inspired_by_product,categories(name)",
          )
          .eq("is_active", true)
          .order("name");

        if (error) {
          return new Response(`<?xml version="1.0"?><error>${esc(error.message)}</error>`, {
            status: 500,
            headers: { "content-type": "application/xml; charset=utf-8" },
          });
        }

        const items = (data || [])
          .map((p: any) => {
            const link = `${SITE}/shop/${p.slug}`;
            const img = absoluteImage(p.image_url);
            const inspired = [p.inspired_by_brand, p.inspired_by_product].filter(Boolean).join(" ");
            const title = `${p.name}${inspired ? ` — Inspired by ${inspired}` : ""} | 50ml Eau de Parfum`;
            const description =
              p.long_description ||
              p.description ||
              `${p.name} is a long-lasting ${p.size || "50ml"} eau de parfum, composed in the UAE and bottled in Sydney${
                inspired ? `, created in the spirit of ${inspired}` : ""
              }.`;
            const gender =
              p.gender === "mens" ? "male" : p.gender === "womens" ? "female" : "unisex";
            const availability = Number(p.stock) > 0 ? "in_stock" : "out_of_stock";
            const salePrice = Number(p.price);
            const listPrice = Number(p.compare_at_price || p.retail_price || p.price);
            const hasSale = listPrice > salePrice;

            return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${clean(title, 145)}</g:title>
      <g:description>${clean(description)}</g:description>
      <g:link>${esc(link)}</g:link>
      ${img ? `<g:image_link>${esc(img)}</g:image_link>` : ""}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${(hasSale ? listPrice : salePrice).toFixed(2)} AUD</g:price>
      ${hasSale ? `<g:sale_price>${salePrice.toFixed(2)} AUD</g:sale_price>` : ""}
      <g:brand>Abdulrahman Perfumes</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn>${esc(p.slug)}</g:mpn>
      <g:gender>${gender}</g:gender>
      <g:age_group>adult</g:age_group>
      <g:google_product_category>469</g:google_product_category>
      <g:product_type>${clean(`Perfume > ${p.categories?.name || "Eau de Parfum"}`, 200)}</g:product_type>
      <g:unit_pricing_measure>${esc(p.size || "50ml")}</g:unit_pricing_measure>
      <g:shipping>
        <g:country>AU</g:country>
        <g:service>Standard tracked</g:service>
        <g:price>9.99 AUD</g:price>
      </g:shipping>
    </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Abdulrahman Perfumes</title>
    <link>${SITE}/</link>
    <description>Luxury designer-inspired eau de parfum, composed in the UAE and bottled in Sydney.</description>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
