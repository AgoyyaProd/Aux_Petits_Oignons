import "server-only";
import { z } from "zod";
import type { PriceObservation } from "@/domain/pricing";

/**
 * Client minimal de l'API publique Open Prices (Open Food Facts, données ODbL).
 * https://prices.openfoodfacts.org/api/docs
 * Lecture seule, sans clé. On s'identifie par un User-Agent explicite, comme demandé
 * par Open Food Facts, et on limite le volume (100 relevés récents par catégorie).
 */
const API = "https://prices.openfoodfacts.org/api/v1/prices";
const USER_AGENT = "AuxPetitsOignons/1.0 (+https://aux-petits-oignons-azure.vercel.app)";

// Centre de la France métropolitaine ; le filtre pays est ensuite appliqué relevé par relevé.
const NEAR_FRANCE = { lat: "46.6", lon: "2.5", radius_km: "650" };

const itemSchema = z.object({
  type: z.enum(["PRODUCT", "CATEGORY"]),
  price: z.union([z.number(), z.string()]),
  price_per: z.string().nullish(),
  price_is_discounted: z.boolean().nullish(),
  currency: z.string().nullish(),
  date: z.string().nullish(),
  product: z
    .object({
      product_name: z.string().nullish(),
      product_quantity: z.number().nullish(),
      product_quantity_unit: z.string().nullish(),
    })
    .nullish(),
  location: z.object({ osm_address_country_code: z.string().nullish() }).nullish(),
});

const pageSchema = z.object({ items: z.array(z.unknown()), total: z.number().optional() });

export interface DatedObservation extends PriceObservation {
  date: string;
}

export type SourceKind = "raw" | "product";

/** Relevés en euros, faits en France, depuis `since` (AAAA-MM-JJ), les plus récents d'abord. */
export async function fetchFrenchObservations(
  kind: SourceKind,
  tag: string,
  since: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ observations: DatedObservation[]; received: number }> {
  const params = new URLSearchParams({
    ...NEAR_FRANCE,
    currency: "EUR",
    price_is_discounted: "false",
    date__gte: since,
    order_by: "-date",
    size: "100",
  });
  if (kind === "raw") params.set("category_tag", tag);
  else {
    params.set("type", "PRODUCT");
    params.set("product__categories_tags__contains", tag);
  }

  const response = await fetchImpl(`${API}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Open Prices a répondu ${response.status} pour ${tag}.`);
  const page = pageSchema.parse(await response.json());

  const observations: DatedObservation[] = [];
  for (const raw of page.items) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const item = parsed.data;
    if (item.currency !== "EUR" || !item.date) continue;
    if (item.location?.osm_address_country_code?.toUpperCase() !== "FR") continue;
    observations.push({
      type: item.type,
      price: item.price,
      pricePer: item.price_per ?? null,
      discounted: item.price_is_discounted ?? false,
      productName: item.product?.product_name ?? null,
      productQuantity: item.product?.product_quantity ?? null,
      productQuantityUnit: item.product?.product_quantity_unit ?? null,
      date: item.date,
    });
  }
  return { observations, received: page.items.length };
}
