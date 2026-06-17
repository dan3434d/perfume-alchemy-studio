import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeBulkDiscountPercent, computeShipping } from "./pricing";

const PURCHASE_ORDER_CODE = "ABDUL";
const ADMIN_EMAIL = "dbueducation@gmail.com";

const LineSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image_url: z.string().nullable().optional(),
});

const PurchaseOrderSchema = z.object({
  code: z.string().min(1),
  po_reference: z.string().nullable().optional(),
  email: z.string().email(),
  full_name: z.string().min(1),
  phone: z.string().nullable().optional(),
  shipping_line1: z.string().min(1),
  shipping_line2: z.string().nullable().optional(),
  shipping_city: z.string().min(1),
  shipping_state: z.string().min(1),
  shipping_postcode: z.string().min(1),
  shipping_country: z.string().min(1).default("Australia"),
  notes: z.string().nullable().optional(),
  lines: z.array(LineSchema).min(1),
  discount_code: z.string().nullable().optional(),
  discount_percent: z.number().min(0).max(100).default(0),
  user_id: z.string().uuid().nullable().optional(),
  origin: z.string().url(),
});

const fmtAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

async function buildInvoicePdf(opts: {
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string | null;
  shipping: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  poReference?: string | null;
  notes?: string | null;
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  shippingTotal: number;
  total: number;
  issuedAt: Date;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const gold = rgb(0.788, 0.631, 0.29);
  const ink = rgb(0.1, 0.1, 0.12);
  const muted = rgb(0.42, 0.42, 0.46);
  let y = 800;

  page.drawText("ABDULRAHMAN PERFUMES", { x: 40, y, size: 16, font: bold, color: ink });
  y -= 16;
  page.drawText("Tax Invoice", { x: 40, y, size: 11, font, color: muted });
  page.drawRectangle({ x: 40, y: y - 8, width: 515, height: 2, color: gold });

  // Meta on right
  let metaY = 800;
  const metaX = 380;
  const drawMeta = (label: string, value: string) => {
    page.drawText(label, { x: metaX, y: metaY, size: 9, font, color: muted });
    page.drawText(value, { x: metaX + 90, y: metaY, size: 10, font: bold, color: ink });
    metaY -= 14;
  };
  drawMeta("Invoice #", opts.orderNumber);
  drawMeta("Date", opts.issuedAt.toLocaleDateString("en-AU"));
  drawMeta("Due", "Net 14 days");
  if (opts.poReference) drawMeta("PO Ref", opts.poReference);

  y -= 40;

  // Bill to
  page.drawText("BILL TO", { x: 40, y, size: 9, font: bold, color: muted });
  page.drawText("SHIP TO", { x: 310, y, size: 9, font: bold, color: muted });
  y -= 14;
  const billLines = [opts.customerName, opts.email, opts.phone || ""].filter(Boolean) as string[];
  const shipLines = [
    opts.customerName,
    opts.shipping.line1,
    opts.shipping.line2 || "",
    `${opts.shipping.city}, ${opts.shipping.state} ${opts.shipping.postcode}`,
    opts.shipping.country,
  ].filter(Boolean) as string[];
  const startY = y;
  billLines.forEach((l, i) => {
    page.drawText(l, { x: 40, y: startY - i * 13, size: 10, font, color: ink });
  });
  shipLines.forEach((l, i) => {
    page.drawText(l, { x: 310, y: startY - i * 13, size: 10, font, color: ink });
  });
  y = startY - Math.max(billLines.length, shipLines.length) * 13 - 20;

  // Table header
  page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 22, color: rgb(0.97, 0.94, 0.87) });
  page.drawText("Item", { x: 50, y: y + 4, size: 10, font: bold, color: ink });
  page.drawText("Qty", { x: 360, y: y + 4, size: 10, font: bold, color: ink });
  page.drawText("Unit", { x: 410, y: y + 4, size: 10, font: bold, color: ink });
  page.drawText("Total", { x: 500, y: y + 4, size: 10, font: bold, color: ink });
  y -= 24;

  for (const it of opts.items) {
    if (y < 140) {
      // simple overflow guard
      break;
    }
    const name = it.name.length > 50 ? it.name.slice(0, 48) + "…" : it.name;
    page.drawText(name, { x: 50, y, size: 10, font, color: ink });
    page.drawText(String(it.quantity), { x: 360, y, size: 10, font, color: ink });
    page.drawText(fmtAUD(it.unit_price), { x: 410, y, size: 10, font, color: ink });
    page.drawText(fmtAUD(it.line_total), { x: 500, y, size: 10, font, color: ink });
    y -= 18;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: muted });
  y -= 16;

  const row = (label: string, value: string, b = false) => {
    page.drawText(label, { x: 380, y, size: 10, font: b ? bold : font, color: b ? ink : muted });
    page.drawText(value, { x: 500, y, size: 10, font: b ? bold : font, color: ink });
    y -= 14;
  };
  row("Subtotal", fmtAUD(opts.subtotal));
  if (opts.discountAmount > 0) row(`Discount (-${opts.discountPercent}%)`, `- ${fmtAUD(opts.discountAmount)}`);
  row("Shipping", opts.shippingTotal === 0 ? "Free" : fmtAUD(opts.shippingTotal));
  y -= 4;
  page.drawLine({ start: { x: 380, y: y + 6 }, end: { x: 555, y: y + 6 }, thickness: 0.5, color: muted });
  row("TOTAL DUE", fmtAUD(opts.total), true);

  // Footer
  page.drawLine({ start: { x: 40, y: 90 }, end: { x: 555, y: 90 }, thickness: 0.5, color: muted });
  page.drawText("Payment terms: Net 14 days from invoice date.", {
    x: 40, y: 74, size: 9, font, color: muted,
  });
  page.drawText("Remit to: Abdulrahman Perfumes — support@abdulrahman.store", {
    x: 40, y: 60, size: 9, font, color: muted,
  });
  if (opts.notes) {
    page.drawText(`Notes: ${opts.notes.slice(0, 110)}`, {
      x: 40, y: 46, size: 9, font, color: muted,
    });
  }
  page.drawText("Thank you for your business.", {
    x: 40, y: 30, size: 9, font: bold, color: gold,
  });

  return await pdf.save();
}

export const createPurchaseOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PurchaseOrderSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.code.trim().toUpperCase() !== PURCHASE_ORDER_CODE) {
      throw new Error("Invalid purchase order code");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Validate products & build lines
    const productIds = [...new Set(data.lines.map((l) => l.product_id))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id,name,slug,price,image_url,stock,is_active,inspired_by_brand,inspired_by_product")
      .in("id", productIds)
      .eq("is_active", true);
    if (productsError) throw productsError;

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const orderLines = data.lines.map((l) => {
      const p = productMap.get(l.product_id);
      if (!p) throw new Error("One or more products are unavailable");
      if (typeof p.stock === "number" && p.stock < l.quantity) {
        throw new Error(`${p.name} is out of stock`);
      }
      const inspiredSuffix = p.inspired_by_brand
        ? ` — inspired by ${p.inspired_by_brand}${p.inspired_by_product ? ` ${p.inspired_by_product}` : ""}`
        : "";
      return {
        product_id: p.id,
        name: `${p.name}${inspiredSuffix}`,
        slug: p.slug,
        price: Number(p.price),
        quantity: l.quantity,
        image_url: p.image_url,
      };
    });

    const subtotal = +orderLines.reduce((s, l) => s + l.price * l.quantity, 0).toFixed(2);
    const totalQty = orderLines.reduce((s, l) => s + l.quantity, 0);
    const submittedCode = (data.discount_code || "").toUpperCase();
    const isFreeShipping = submittedCode === "FREESHIPPING";
    const codePercent =
      submittedCode === "WELCOME5" ? 5 : isFreeShipping ? 0 : data.discount_percent || 0;
    const discountPercent = computeBulkDiscountPercent(totalQty, codePercent);
    const discountAmount = +((subtotal * discountPercent) / 100).toFixed(2);
    const subtotalAfterDiscount = +(subtotal - discountAmount).toFixed(2);
    const rawShip = computeShipping(subtotalAfterDiscount, {
      state: data.shipping_state,
      postcode: data.shipping_postcode,
      country: data.shipping_country,
    });
    const ship = isFreeShipping
      ? { ...rawShip, base: 0, handling: 0, total: 0, freeShipping: true }
      : rawShip;
    const shipping = ship.total;
    const total = +(subtotalAfterDiscount + shipping).toFixed(2);

    const discountCode = isFreeShipping
      ? "FREESHIPPING"
      : discountPercent > 0
        ? submittedCode === "WELCOME5" && discountPercent === codePercent
          ? "WELCOME5"
          : totalQty >= 2
            ? "BUY2-15"
            : null
        : null;

    // Create order (purchase order, not paid)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: data.user_id ?? null,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || null,
        shipping_line1: data.shipping_line1,
        shipping_line2: data.shipping_line2 || null,
        shipping_city: data.shipping_city,
        shipping_state: data.shipping_state,
        shipping_postcode: data.shipping_postcode,
        shipping_country: data.shipping_country,
        subtotal,
        shipping,
        total,
        discount_code: discountCode,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        notes: data.po_reference
          ? `[PO: ${data.po_reference}] ${data.notes ?? ""}`.trim()
          : data.notes || null,
        status: "processing",
        payment_status: "unpaid",
      })
      .select("*")
      .single();
    if (orderError) throw orderError;

    const itemRows = orderLines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      product_name: l.name,
      product_slug: l.slug,
      unit_price: l.price,
      quantity: l.quantity,
      line_total: +(l.price * l.quantity).toFixed(2),
      image_url: l.image_url,
    }));
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(itemRows);
    if (itemsError) throw itemsError;

    // Generate PDF invoice
    const pdfBytes = await buildInvoicePdf({
      orderNumber: order.order_number,
      customerName: data.full_name,
      email: data.email,
      phone: data.phone,
      shipping: {
        line1: data.shipping_line1,
        line2: data.shipping_line2,
        city: data.shipping_city,
        state: data.shipping_state,
        postcode: data.shipping_postcode,
        country: data.shipping_country,
      },
      poReference: data.po_reference,
      notes: data.notes,
      items: itemRows.map((r) => ({
        name: r.product_name,
        quantity: r.quantity,
        unit_price: Number(r.unit_price),
        line_total: Number(r.line_total),
      })),
      subtotal,
      discountAmount,
      discountPercent,
      shippingTotal: shipping,
      total,
      issuedAt: new Date(),
    });

    // Upload to private bucket
    const path = `${order.id}/${order.order_number}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoices")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("invoices")
      .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
    if (signError) throw signError;
    const invoiceUrl = signed.signedUrl;

    // Send emails (customer + admin cc)
    const { sendTransactionalEmail } = await import("@/lib/email/send.server");
    const itemSummary = itemRows.map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      price: fmtAUD(Number(i.line_total)),
    }));
    const templateData = {
      orderNumber: order.order_number,
      customerName: data.full_name,
      total: fmtAUD(total),
      items: itemSummary,
      invoiceUrl,
      poReference: data.po_reference || "",
    };

    await sendTransactionalEmail({
      templateName: "purchase-order-invoice",
      recipientEmail: data.email,
      idempotencyKey: `po-invoice-${order.id}`,
      templateData,
    });
    await sendTransactionalEmail({
      templateName: "purchase-order-invoice",
      recipientEmail: ADMIN_EMAIL,
      idempotencyKey: `po-invoice-admin-${order.id}`,
      templateData,
    });

    return {
      order_id: order.id,
      order_number: order.order_number,
      invoice_url: invoiceUrl,
    };
  });
