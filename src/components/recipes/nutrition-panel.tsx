import {
  referenceShare,
  roundNutrient,
  type Nutrient,
  type RecipeNutrition,
} from "@/domain/nutrition";

const ROWS: { key: Nutrient; label: string; sub?: boolean }[] = [
  { key: "fat", label: "Lipides" },
  { key: "saturatedFat", label: "dont saturés", sub: true },
  { key: "carbs", label: "Glucides" },
  { key: "sugars", label: "dont sucres", sub: true },
  { key: "fiber", label: "Fibres" },
  { key: "proteins", label: "Protéines" },
  { key: "salt", label: "Sel" },
];

function format(n: Nutrient, value: number): string {
  return roundNutrient(n, value).toLocaleString("fr-FR");
}

/**
 * Valeurs nutritionnelles estimées par portion. Un total « partiel » (une valeur manque dans
 * Ciqual pour un ingrédient compté) est affiché comme un minimum (≥).
 */
export function NutritionPanel({ nutrition }: { nutrition: RecipeNutrition | null }) {
  if (!nutrition) return null;
  const { perServing, skipped } = nutrition;
  const kcal = perServing.kcal;
  const kcalShare = referenceShare("kcal", kcal.value);
  const anyPartial = Object.values(perServing).some((t) => t.partial);

  if (!nutrition.reliable) {
    return (
      <section
        aria-labelledby="nutrition"
        className="bg-surface border-border flex flex-col gap-2 rounded-2xl border p-5 sm:p-6"
      >
        <h2 id="nutrition" className="type-section text-[1.1875rem]">
          Valeurs nutritionnelles
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          Pas d&apos;estimation pour cette recette. Aucune donnée fiable pour :{" "}
          {skipped.map((s) => s.name.toLowerCase()).join(", ")} ; la part de ces ingrédients dans le
          plat est trop importante pour les laisser de côté.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="nutrition"
      className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-5 sm:p-6"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="nutrition" className="type-section text-[1.1875rem]">
              Valeurs nutritionnelles
            </h2>
            <p className="text-muted text-sm">Estimation pour une portion</p>
          </div>
          <p className="flex flex-col gap-0.5">
            <span className="whitespace-nowrap">
              <span className="text-3xl font-semibold tabular-nums">
                {kcal.partial ? "≥\u00a0" : ""}
                {format("kcal", kcal.value)}
              </span>{" "}
              <span className="text-muted text-sm">kcal</span>
            </span>
            {kcalShare !== null ? (
              <span className="text-muted text-sm">{kcalShare} % des apports de référence</span>
            ) : null}
          </p>
        </div>

        <table className="w-full self-start text-sm">
          <caption className="sr-only">Composition d&apos;une portion</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Nutriment</th>
              <th scope="col">Quantité</th>
              <th scope="col">Part des apports de référence</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ key, label, sub }) => {
              const t = perServing[key];
              const share = referenceShare(key, t.value);
              return (
                <tr key={key} className="border-border border-t first:border-t-0">
                  <th
                    scope="row"
                    className={`py-2 text-left font-normal ${sub ? "text-muted pl-4" : "font-medium"}`}
                  >
                    {label}
                  </th>
                  <td className="py-2 text-right whitespace-nowrap tabular-nums">
                    {t.partial ? "≥ " : ""}
                    {format(key, t.value)} g
                  </td>
                  <td className="text-muted w-20 py-2 text-right tabular-nums">
                    {share !== null ? `${share} %` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-xs leading-relaxed">
        Calcul à partir des quantités crues de la recette et de la table Ciqual 2025 de l&apos;Anses
        (ciqual.anses.fr). Pourcentages : apports de référence d&apos;un adulte ({"2\u00a0000"}{" "}
        kcal).
        {skipped.length
          ? ` Non comptés faute de donnée fiable : ${skipped.map((s) => s.name.toLowerCase()).join(", ")}.`
          : ""}{" "}
        Les poids à la pièce peuvent inclure peau, noyau ou os : l&apos;estimation est alors un peu
        haute.
        {anyPartial
          ? " Le signe ≥ signale un minimum : Ciqual ne mesure pas cette valeur pour un ingrédient."
          : ""}
      </p>
    </section>
  );
}
