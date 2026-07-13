import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Parse raw OCR text to extract medicine name and expiration date
function parseOcrText(text: string): { name: string | null; expirationDate: string | null } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // --- Expiration date extraction ---
  // Covers formats: EXP 12/2026, EXP: 2026-12, 12/26, DEC 2026, 12.2026, etc.
  const datePatterns: Array<{ re: RegExp; toISO: (m: RegExpMatchArray) => string }> = [
    // YYYY-MM-DD
    {
      re: /\b(20\d{2})[-\/](0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])\b/,
      toISO: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
    },
    // MM/YYYY or MM-YYYY or MM.YYYY
    {
      re: /\b(0?[1-9]|1[0-2])[\/\-\.](20\d{2})\b/,
      toISO: (m) => `${m[2]}-${m[1].padStart(2, "0")}-01`,
    },
    // YYYY/MM or YYYY-MM
    {
      re: /\b(20\d{2})[\/\-](0?[1-9]|1[0-2])\b/,
      toISO: (m) => `${m[1]}-${m[2].padStart(2, "0")}-01`,
    },
    // MM/YY (treat YY >= 24 as 20YY)
    {
      re: /\b(0?[1-9]|1[0-2])\/(2\d|3\d|4\d)\b/,
      toISO: (m) => `20${m[2]}-${m[1].padStart(2, "0")}-01`,
    },
    // Month name + YYYY: DEC 2026, December 2026
    {
      re: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(20\d{2})\b/i,
      toISO: (m) => {
        const months: Record<string, string> = {
          jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
          jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
        };
        const mo = months[m[1].toLowerCase().slice(0, 3)] ?? "01";
        return `${m[2]}-${mo}-01`;
      },
    },
    // YYYY + Month name: 2026 DEC
    {
      re: /\b(20\d{2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i,
      toISO: (m) => {
        const months: Record<string, string> = {
          jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
          jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
        };
        const mo = months[m[2].toLowerCase().slice(0, 3)] ?? "01";
        return `${m[1]}-${mo}-01`;
      },
    },
  ];

  let expirationDate: string | null = null;

  // Prefer lines that contain expiry keywords
  const expiryKeywordRe = /\b(exp|expiry|expiration|expires?|best before|use by|bb|bbd)\b/i;
  const priorityLines = lines.filter((l) => expiryKeywordRe.test(l));
  const searchLines = priorityLines.length > 0 ? [...priorityLines, ...lines] : lines;

  outer: for (const line of searchLines) {
    for (const { re, toISO } of datePatterns) {
      const m = line.match(re);
      if (m) {
        expirationDate = toISO(m);
        break outer;
      }
    }
  }

  // --- Medicine name extraction ---
  // Heuristic: longest line that looks like a drug name (mostly letters, reasonable length)
  // Exclude lines that are purely numeric, look like batch numbers, or contain only short codes
  const skipPatterns = /^(lot|batch|mfg|manufactured|exp|expiry|ref|ndc|barcode|\d[\d\s\-]+$)/i;
  const candidates = lines.filter((l) => {
    if (l.length < 3 || l.length > 80) return false;
    if (skipPatterns.test(l)) return false;
    const letterRatio = (l.match(/[a-zA-Z]/g) ?? []).length / l.length;
    return letterRatio > 0.5;
  });

  // Prefer ALL-CAPS lines (medicine names are often printed in caps on packaging)
  const capsLines = candidates.filter((l) => l === l.toUpperCase() && /[A-Z]/.test(l));
  let name: string | null = null;

  if (capsLines.length > 0) {
    name = capsLines.reduce((a, b) => (a.length >= b.length ? a : b));
  } else if (candidates.length > 0) {
    name = candidates.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  // Clean up name
  if (name) {
    name = name.replace(/[^a-zA-Z0-9\s\-\+\.]/g, "").trim();
    if (name.length < 2) name = null;
  }

  return { name, expirationDate };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { image: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { image } = body;
  if (!image) {
    return new Response(JSON.stringify({ error: "image field required (base64)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Call OCR.space free API
  const ocrApiKey = Deno.env.get("OCR_SPACE_API_KEY") ?? "helloworld"; // free demo key
  const formData = new FormData();
  formData.append("base64Image", `data:image/jpeg;base64,${image}`);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2"); // engine 2 is better for printed text

  let rawText = "";
  try {
    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: ocrApiKey },
      body: formData,
    });
    const ocrJson = await ocrRes.json();
    const parsed = ocrJson?.ParsedResults?.[0];
    rawText = parsed?.ParsedText ?? "";
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "OCR service unavailable", rawText: "" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = parseOcrText(rawText);

  return new Response(
    JSON.stringify({ ...result, rawText }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
