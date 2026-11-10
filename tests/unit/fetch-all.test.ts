import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fetchAll } from "@/server/supabase/fetch-all";

/** Simule l'API Supabase : au plus `maxRows` lignes par requête, le reste tronqué sans erreur. */
function fakeApi(total: number, maxRows: number) {
  const rows = Array.from({ length: total }, (_, i) => ({ i }));
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const end = Math.min(to + 1, from + maxRows);
    return { data: rows.slice(from, end), error: null };
  };
  return { page, calls };
}

describe("fetchAll", () => {
  it("lit toutes les lignes au-delà de la limite de l'API (1 211 allergènes)", async () => {
    const { page } = fakeApi(1211, 1000);
    const rows = await fetchAll(page, "des allergènes");
    expect(rows).toHaveLength(1211);
    expect(rows.at(-1)).toEqual({ i: 1210 });
  });

  it("s'arrête à la première page incomplète, y compris vide", async () => {
    const exact = fakeApi(2000, 1000);
    expect(await fetchAll(exact.page, "x")).toHaveLength(2000);
    expect(exact.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
    const none = fakeApi(0, 1000);
    expect(await fetchAll(none.page, "x")).toEqual([]);
  });

  it("remonte une erreur au lieu de renvoyer une liste partielle", async () => {
    let n = 0;
    const page = async () =>
      n++ === 0
        ? { data: Array.from({ length: 1000 }, () => ({})), error: null }
        : { data: null, error: { message: "délai dépassé" } };
    await expect(fetchAll(page, "des recettes")).rejects.toThrow(
      "Lecture des recettes impossible : délai dépassé",
    );
  });
});

/**
 * Garde-fou : ces tables et vues dépassent (ou dépasseront) la limite de lignes de l'API. Une
 * lecture non paginée tronquerait les données sans erreur — pour les allergènes, une recette
 * dangereuse serait proposée. Chaque lecture doit être paginée (`.range`) ou filtrée sur une
 * seule recette.
 */
const LARGE = ["recipe_allergens", "recipe_diet_conflicts", "receipt_prices"];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("lectures des grosses tables", () => {
  it("sont toutes paginées ou limitées à une recette", () => {
    const offenders: string[] = [];
    for (const file of sources(join(process.cwd(), "src"))) {
      const text = readFileSync(file, "utf8");
      for (const table of LARGE) {
        let at = text.indexOf(`.from("${table}")`);
        while (at >= 0) {
          // La suite de la chaîne d'appels, jusqu'à la fin de l'instruction.
          const chain = text
            .slice(at, at + 600)
            .split(/;\n|\),\n\s{0,8}(?:supabase|fetchAll|[a-z]+\()/)[0]!;
          const bounded = /\.range\(/.test(chain) || /\.eq\("recipe_id"/.test(chain);
          const write = /\.(insert|upsert|update|delete)\(/.test(chain);
          if (!bounded && !write) offenders.push(`${file.replace(process.cwd(), "")} : ${table}`);
          at = text.indexOf(`.from("${table}")`, at + 1);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
