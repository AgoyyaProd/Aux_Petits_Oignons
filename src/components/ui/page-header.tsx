import type { ComponentProps, ReactNode } from "react";
import { Hero } from "@/components/ui/hero";

/**
 * Rangée d'actions d'un écran : sur téléphone, une grille de deux boutons pleine largeur
 * (un bouton seul en dernière position prend toute la ligne) ; à partir de sm, une ligne.
 */
export const ACTIONS_ROW =
  "grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*:last-child:nth-child(odd)]:col-span-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:[&>*]:w-auto";

/** Libellé court sur téléphone, long à partir de sm. */
export function Responsive({ short, long }: { short: ReactNode; long: ReactNode }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="max-sm:hidden">{long}</span>
    </>
  );
}

/** En-tête d'écran : le bloc vert « Marché » commun à toutes les pages (voir Hero). */
export function PageHeader(props: ComponentProps<typeof Hero>) {
  return <Hero {...props} />;
}
