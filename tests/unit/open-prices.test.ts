import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fetchFrenchObservations } = await import("@/server/modules/prices/open-prices");

function fakeFetch(items: unknown[]) {
  const calls: string[] = [];
  const impl = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ items, total: items.length }), { status: 200 });
  }) as typeof fetch;
  return { impl, calls };
}

const fr = { osm_address_country_code: "FR" };

describe("client Open Prices", () => {
  it("ne garde que les relevés en euros faits en France", async () => {
    const { impl } = fakeFetch([
      {
        type: "CATEGORY",
        price: 2.29,
        price_per: "KILOGRAM",
        currency: "EUR",
        date: "2026-10-01",
        location: fr,
      },
      {
        type: "CATEGORY",
        price: 1.29,
        price_per: "UNIT",
        currency: "EUR",
        date: "2026-10-02",
        location: { osm_address_country_code: "BE" },
      },
      {
        type: "CATEGORY",
        price: 3,
        price_per: "KILOGRAM",
        currency: "CHF",
        date: "2026-10-02",
        location: fr,
      },
      {
        type: "CATEGORY",
        price: 3,
        price_per: "KILOGRAM",
        currency: "EUR",
        date: null,
        location: fr,
      },
      { nonsense: true },
    ]);
    const { observations, received } = await fetchFrenchObservations(
      "raw",
      "en:carrots",
      "2026-04-01",
      impl,
    );
    expect(received).toBe(5);
    expect(observations).toEqual([
      {
        type: "CATEGORY",
        price: 2.29,
        pricePer: "KILOGRAM",
        discounted: false,
        productName: null,
        productQuantity: null,
        productQuantityUnit: null,
        date: "2026-10-01",
      },
    ]);
  });

  it("filtre par catégorie brute ou par catégorie de produit, hors promotions", async () => {
    const raw = fakeFetch([]);
    await fetchFrenchObservations("raw", "en:carrots", "2026-04-01", raw.impl);
    const rawUrl = new URL(raw.calls[0]!);
    expect(rawUrl.searchParams.get("category_tag")).toBe("en:carrots");
    expect(rawUrl.searchParams.get("price_is_discounted")).toBe("false");
    expect(rawUrl.searchParams.get("date__gte")).toBe("2026-04-01");

    const product = fakeFetch([
      {
        type: "PRODUCT",
        price: "1.73",
        currency: "EUR",
        date: "2026-09-30",
        location: fr,
        product: { product_name: "Penne", product_quantity: 500, product_quantity_unit: "g" },
      },
    ]);
    const { observations } = await fetchFrenchObservations(
      "product",
      "en:dry-pastas",
      "2026-04-01",
      product.impl,
    );
    const url = new URL(product.calls[0]!);
    expect(url.searchParams.get("product__categories_tags__contains")).toBe("en:dry-pastas");
    expect(url.searchParams.get("type")).toBe("PRODUCT");
    expect(observations[0]).toMatchObject({ productQuantity: 500, productQuantityUnit: "g" });
  });

  it("une erreur HTTP est remontée, jamais transformée en prix", async () => {
    const impl = (async () => new Response("down", { status: 503 })) as typeof fetch;
    await expect(fetchFrenchObservations("raw", "en:leeks", "2026-04-01", impl)).rejects.toThrow(
      "503",
    );
  });
});
