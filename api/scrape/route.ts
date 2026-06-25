import { NextResponse } from "next/server";
import { scrapeLeads, scrapeJustDialSearch, scrapeJustDialDetail, scrapeGoogleMaps } from "@/lib/scraper";
import type { ScrapeInput, Lead } from "@/lib/types";

export async function POST(req: Request) {
  const input = (await req.json()) as ScrapeInput;
  const maxCount = Number(process.env.LEAD_SCRAPE_MAX_COUNT ?? 500);
  const count = Math.max(1, Math.min(input.count, Number.isFinite(maxCount) && maxCount > 0 ? maxCount : 500));
  const source = input.source ?? "auto";

  let leads: Lead[] = [];
  let actualSource = "none";
  let error: string | undefined;

  // Direct detail URLs provided — scrape those instead of search
  if (input.detailUrls && input.detailUrls.length > 0) {
    const detailResults = await Promise.all(
      input.detailUrls.map(async (url) => {
        const detail = await scrapeJustDialDetail(url);
        return {
          id: `jd-detail-${Math.random().toString(36).slice(2, 8)}`,
          name: detail.address ? url.split("/").pop()?.replace(/-/g, " ") || "Unknown" : "Unknown",
          category: input.niche,
          address: detail.address ?? "Not found",
          city: input.city.split(",")[0].trim(),
          phone: detail.phone,
          whatsapp: detail.whatsapp,
          email: undefined,
          website: url,
          rating: detail.rating,
          reviewsCount: detail.reviewsCount,
          lat: 0,
          lng: 0,
          yearsInBusiness: detail.yearsInBusiness,
          photosCount: detail.photosCount,
        } satisfies Lead;
      })
    );
    return NextResponse.json({ source: "justdial-detail", leads: detailResults.slice(0, count) });
  }

  if (source === "justdial") {
    const result = await scrapeJustDialSearch(input.niche, input.city, count);
    leads = result.leads;
    actualSource = "justdial";
    error = result.error;
  } else if (source === "google-maps") {
    const result = await scrapeGoogleMaps(input.niche, input.city, count);
    leads = result.leads;
    actualSource = "google-maps";
    error = result.error;
  } else {
    // auto: try all
    const result = await scrapeLeads(input.niche, input.city, count);
    leads = result.leads;
    actualSource = result.source;
    error = result.error;
  }

  if (leads.length > 0) {
    return NextResponse.json({ source: actualSource, leads: leads.slice(0, count) });
  }

  return NextResponse.json(
    { source: actualSource, leads: [], error: error ?? "No leads found from any source" },
    { status: 422 }
  );
}
