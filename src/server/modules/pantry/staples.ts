import "server-only";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

const GROUP_LABEL: Record<string, string> = {
  epices_herbes: "Épices et herbes",
  condiments: "Sauces et condiments",
  matieres_grasses: "Huiles",
  epicerie_salee: "Épicerie salée",
  epicerie_sucree: "Épicerie sucrée",
  feculents: "Farines et panures",
};
const GROUP_ORDER = Object.keys(GROUP_LABEL);

export interface StapleGroup {
  label: string;
  items: { id: string; name: string; checked: boolean }[];
}

/** Produits cochables du placard, groupés par rayon, avec ceux que le foyer a cochés. */
export async function getStaplesPage() {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();
  const [candidates, checked] = await Promise.all([
    supabase.from("ingredients").select("id, name, category").eq("is_staple", true).order("name"),
    supabase.from("household_staples").select("ingredient_id").eq("household_id", household.id),
  ]);
  if (candidates.error)
    throw new Error(`Lecture du placard impossible : ${candidates.error.message}`);
  if (checked.error) throw new Error(`Lecture du placard impossible : ${checked.error.message}`);

  const have = new Set(checked.data.map((c) => c.ingredient_id));
  const groups = new Map<string, StapleGroup>();
  for (const c of candidates.data) {
    const key = GROUP_LABEL[c.category] ? c.category : "autres";
    const group = groups.get(key) ?? { label: GROUP_LABEL[key] ?? "Autres", items: [] };
    group.items.push({ id: c.id, name: c.name, checked: have.has(c.id) });
    groups.set(key, group);
  }
  return {
    householdId: household.id,
    checkedCount: have.size,
    groups: [...groups.entries()]
      .sort(([a], [b]) => {
        const ia = GROUP_ORDER.indexOf(a);
        const ib = GROUP_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      })
      .map(([, g]) => g),
  };
}
