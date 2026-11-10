/**
 * L'API Supabase (PostgREST) renvoie au plus `max_rows` lignes par requête (1 000, voir
 * supabase/config.toml) et tronque le reste SANS erreur. Toute lecture d'une table ou d'une
 * vue qui peut dépasser cette limite passe par `fetchAll`, qui lit page par page.
 *
 * La requête fournie doit avoir un ordre total (`.order(...)` jusqu'à une clé unique) : sans
 * ordre stable, deux pages pourraient se recouvrir ou laisser des trous.
 */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function fetchAll<T>(
  page: (from: number, to: number) => Page<T>,
  label: string,
  pageSize: number = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(`Lecture ${label} impossible : ${error.message}`);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
}
