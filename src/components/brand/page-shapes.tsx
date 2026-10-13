"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BrandElement, type BrandElementName } from "./shapes";

/**
 * Décor de fond des pages du compte : les formes texturées du logo, placées le long de la
 * page (elles défilent avec le contenu) et légèrement décalées au défilement (parallaxe).
 * Chaque rubrique a sa propre composition. Les cartes restent opaques par-dessus ; la barre
 * latérale (ordinateur) masque le bord gauche, d'où le décalage `--edge`.
 * Sans animation si l'utilisateur a demandé à réduire les mouvements.
 */

interface Shape {
  name: BrandElementName;
  side: "left" | "right";
  /** Position verticale, en % de la hauteur de la page. */
  top: number;
  /** Largeur en rem (téléphone : 60 %). */
  width: number;
  /** Débord hors du bord, en rem (négatif : la forme dépasse). */
  inset: number;
  rotate: number;
  /** Parallaxe : fraction du défilement ajoutée au déplacement (0 = suit la page). */
  speed: number;
}

const s = (
  name: BrandElementName,
  side: Shape["side"],
  top: number,
  width: number,
  inset: number,
  rotate: number,
  speed: number,
): Shape => ({ name, side, top, width, inset, rotate, speed });

const PRESETS: Record<string, readonly Shape[]> = {
  dashboard: [
    s("leaf", "right", 30, 18, -5, 24, 0.12),
    s("dot", "left", 55, 10, -3, 0, 0.2),
    s("slice", "right", 82, 26, -7, -12, 0.06),
  ],
  recipes: [
    s("dot", "right", 6, 11, -4, 0, 0.18),
    s("leaf", "left", 35, 16, -6, -28, 0.1),
    s("slice", "right", 62, 22, -8, 10, 0.08),
    s("dot", "left", 88, 8, -2, 0, 0.22),
  ],
  recipe: [
    s("slice", "left", 12, 20, -8, 14, 0.1),
    s("leaf", "right", 48, 15, -5, 40, 0.16),
    s("dot", "left", 80, 9, -3, 0, 0.2),
  ],
  planner: [
    s("slice", "right", 8, 22, -8, -18, 0.08),
    s("dot", "left", 42, 12, -4, 0, 0.2),
    s("leaf", "right", 75, 17, -6, 18, 0.12),
  ],
  shopping: [
    s("leaf", "left", 15, 17, -7, -20, 0.12),
    s("dot", "right", 50, 10, -3, 0, 0.18),
    s("slice", "left", 85, 21, -8, 8, 0.07),
  ],
  pantry: [
    s("dot", "left", 10, 12, -4, 0, 0.2),
    s("slice", "right", 40, 24, -9, -6, 0.08),
    s("leaf", "left", 78, 16, -6, 30, 0.14),
  ],
  budget: [s("dot", "right", 20, 14, -5, 0, 0.15), s("leaf", "left", 70, 15, -6, -12, 0.1)],
  prices: [s("slice", "left", 18, 20, -8, 20, 0.1), s("dot", "right", 68, 10, -3, 0, 0.2)],
  settings: [
    s("leaf", "right", 12, 16, -6, 32, 0.12),
    s("dot", "left", 46, 9, -3, 0, 0.22),
    s("slice", "right", 80, 22, -8, -10, 0.07),
  ],
  default: [s("leaf", "right", 25, 16, -6, 20, 0.12), s("dot", "left", 70, 10, -3, 0, 0.2)],
};

/** Composition selon la rubrique (la fiche recette a la sienne). */
export function presetFor(pathname: string | null): string {
  const [section, detail] = (pathname ?? "").split("/").filter(Boolean);
  if (section === "recipes" && detail) return "recipe";
  return section && section in PRESETS ? section : "default";
}

export function PageShapes() {
  const pathname = usePathname();
  const key = presetFor(pathname);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = layer.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.style.setProperty("--scroll", String(window.scrollY));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={layer}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [--edge:0rem] [--k:0.6] lg:[--edge:16rem] lg:[--k:1] print:hidden"
    >
      {/* key : nouvelle composition (et fondu d'entrée) à chaque changement de rubrique. */}
      <div key={key} className="absolute inset-0 animate-[fade-in_600ms_ease-out]">
        {PRESETS[key]!.map((shape, i) => (
          <div
            key={i}
            className="absolute will-change-transform"
            style={{
              top: `${shape.top}%`,
              width: `calc(${shape.width}rem * var(--k))`,
              [shape.side]:
                shape.side === "left"
                  ? `calc(var(--edge) + ${shape.inset}rem * var(--k))`
                  : `calc(${shape.inset}rem * var(--k))`,
              transform: `translate3d(0, calc(var(--scroll, 0) * ${shape.speed} * 1px), 0) rotate(${shape.rotate}deg)`,
            }}
          >
            <BrandElement
              name={shape.name}
              sizes={`${Math.round(shape.width * 16)}px`}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
