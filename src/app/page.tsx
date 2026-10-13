import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { BrandBadge, DotShape, LeafShape } from "@/components/brand/shapes";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { ImageSlot } from "@/components/ui/image-slot";
import { SITE_IMAGES } from "@/lib/images";
import { buttonClasses } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ClockIcon,
  HeartIcon,
  LeafIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: { absolute: "Aux Petits Oignons — La cuisine du quotidien, bien pensée." },
};

/** Recettes réelles du catalogue, choisies parmi celles qui ont une photo. */
const SELECTION = [
  {
    slug: "curry-pois-chiches-epinards",
    title: "Curry de pois chiches aux épinards",
    minutes: 30,
    servings: 4,
    tags: ["plat"],
  },
  { slug: "fajitas-poulet", title: "Fajitas de poulet", minutes: 30, servings: 4, tags: ["plat"] },
  {
    slug: "boeuf-bourguignon",
    title: "Bœuf bourguignon",
    minutes: 210,
    servings: 6,
    tags: ["plat"],
  },
  {
    slug: "crumble-pommes",
    title: "Crumble aux pommes",
    minutes: 55,
    servings: 6,
    tags: ["dessert"],
  },
] as const;

function duration(m: number): string {
  if (m < 60) return `${m}\u00a0min`;
  const rest = m % 60;
  return rest
    ? `${Math.floor(m / 60)}\u00a0h\u00a0${String(rest).padStart(2, "0")}`
    : `${m / 60}\u00a0h`;
}

/** Page publique, statique (prérendue). Un utilisateur connecté est redirigé par le proxy. */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Aux Petits Oignons, accueil">
          <Logo size={54} />
        </Link>
        <nav aria-label="Rubriques" className="hidden items-center gap-1 text-[0.9375rem] lg:flex">
          {[
            ["#recettes", "Recettes"],
            ["#fonctionnement", "Menus"],
            ["#courses", "Courses"],
            ["#engagements", "Nos engagements"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-muted hover:text-foreground px-3 py-2 font-medium"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonClasses("secondary")}>
            Se connecter
          </Link>
          <Link href="/signup" className={buttonClasses("forest", "max-sm:hidden")}>
            Créer un compte
          </Link>
        </div>
      </header>

      <main className="flex flex-col gap-20 pb-20 lg:gap-28">
        {/* Hero */}
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="bg-surface-muted relative grid overflow-hidden rounded-3xl lg:grid-cols-[1fr_1.1fr]">
            <div className="relative z-10 flex flex-col gap-6 px-6 py-12 sm:px-12 lg:py-20">
              <h1 className="type-display text-forest dark:text-foreground">
                Bien manger
                <br />
                ça change tout.
              </h1>
              <span aria-hidden="true" className="bg-accent block h-1 w-14 rounded-full" />
              <p className="text-muted max-w-md text-lg leading-relaxed">
                Des ingrédients simples, des recettes savoureuses pour le quotidien. Ton
                garde-manger, tes menus et tes courses, enfin au même endroit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className={buttonClasses("primary", "min-h-12 px-6 text-base")}
                >
                  Voir les recettes
                  <ArrowRightIcon size={18} />
                </Link>
                <a
                  href="#fonctionnement"
                  className={buttonClasses("secondary", "min-h-12 px-6 text-base")}
                >
                  Découvrir notre approche
                </a>
              </div>
            </div>
            <div className="relative min-h-80 lg:min-h-[32rem]">
              <div className="absolute inset-0 lg:left-16">
                <ImageSlot
                  src={SITE_IMAGES.hero}
                  alt=""
                  tone="sage"
                  iconSize={48}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                />
              </div>
              <LeafShape className="absolute top-10 left-2 hidden w-24 -rotate-12 lg:block" />
              {/* Sans photo, le rond jaune habille le vide ; sur une photo, il masquerait le plat. */}
              {SITE_IMAGES.hero ? null : (
                <DotShape className="absolute top-6 right-[38%] w-20 lg:w-24" />
              )}
            </div>
          </div>

          <ul className="border-border mt-6 grid gap-6 rounded-3xl border px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[var(--border)] lg:px-0">
            <Benefit badge="leaf" title="Moins de gaspillage">
              Les produits à finir passent en premier dans tes menus.
            </Benefit>
            <Benefit badge="bowl" title="Des recettes simples">
              Plus de 200 plats du quotidien, chiffrés et adaptés à ton foyer.
            </Benefit>
            <Benefit badge="mix" title="Des menus équilibrés">
              Une semaine variée, midi et soir, pour toute la famille.
            </Benefit>
            <Benefit badge="dot" title="Des courses sereines">
              La liste se fait toute seule, avec seulement ce qui manque.
            </Benefit>
          </ul>
        </section>

        {/* Recettes du moment */}
        <section
          id="recettes"
          aria-labelledby="recettes-titre"
          className="mx-auto flex w-full max-w-7xl scroll-mt-6 flex-col gap-8 px-4 sm:px-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="recettes-titre" className="type-page">
              Nos recettes du moment
            </h2>
            <Link href="/signup" className={buttonClasses("text", "gap-1")}>
              Voir toutes les recettes <ArrowRightIcon size={16} />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
            {SELECTION.map((r) => (
              <li
                key={r.slug}
                className="bg-surface border-border flex flex-col overflow-hidden rounded-2xl border"
              >
                <div className="relative aspect-[4/3]">
                  <RecipeVisual slug={r.slug} title={r.title} tags={r.tags} />
                  <span className="bg-surface text-foreground absolute top-3 right-3 flex size-9 items-center justify-center rounded-full">
                    <HeartIcon size={18} />
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon size={16} /> {duration(r.minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon size={16} /> {r.servings} pers.
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Fonctionnement */}
        <section
          id="fonctionnement"
          aria-labelledby="fonctionnement-titre"
          className="mx-auto w-full max-w-7xl scroll-mt-6 px-4 sm:px-6"
        >
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="flex flex-col gap-8">
              <h2 id="fonctionnement-titre" className="type-page">
                Quatre gestes par semaine
              </h2>
              <ol className="flex flex-col gap-6">
                <Step n={1} title="Note ce que tu as">
                  Ajoute tes produits en quelques secondes et coche les épices du placard.
                </Step>
                <Step n={2} title="Génère ton menu">
                  Indique le nombre de repas, de personnes et ton budget : la semaine se remplit, tu
                  ajustes ce que tu veux.
                </Step>
                <Step n={3} title="Fais les courses">
                  Seul ce qui manque est sur la liste. Ce que tu achètes rejoint ton garde-manger.
                </Step>
                <Step n={4} title="Cuisine">
                  Un plat cuisiné retire ses ingrédients du stock, après ta confirmation.
                </Step>
              </ol>
            </div>
            <WeekPreview />
          </div>
        </section>

        {/* Engagements : anti-gaspillage et budget */}
        <section
          id="engagements"
          aria-labelledby="gaspi-titre"
          className="mx-auto w-full max-w-7xl scroll-mt-6 px-4 sm:px-6"
        >
          <div
            id="courses"
            className="bg-forest text-cream relative grid gap-12 overflow-hidden rounded-3xl px-6 py-14 sm:px-12 lg:grid-cols-2 lg:py-20"
          >
            <DotShape className="absolute -top-8 -right-8 w-40 opacity-90" />
            <div className="relative flex flex-col gap-5">
              <h2 id="gaspi-titre" className="type-page">
                Ce qui est acheté est mangé.
              </h2>
              <p className="text-lg leading-relaxed text-[#d8e2da]">
                Chaque menu commence par les produits entamés et ceux dont la date approche. Les
                quantités sont calculées au gramme près, sans conversion approximative : un produit
                dont on ne connaît pas la quantité n&apos;est jamais compté comme disponible.
              </p>
            </div>
            <div className="relative flex flex-col gap-6">
              <Fact icon={<WalletIcon size={22} />} title="Un budget tenu d'avance">
                Le coût de chaque menu est estimé avant les courses, à partir des prix publics
                relevés en France (Open Prices) et de tes propres prix.
              </Fact>
              <Fact icon={<LeafIcon size={22} />} title="Des estimations, dites comme telles">
                Quand un prix manque, on l&apos;indique au lieu de l&apos;inventer : le total
                affiché est alors un minimum.
              </Fact>
            </div>
          </div>
        </section>

        {/* Appel à l'inscription */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <LogoMark size={64} />
          <h2 className="type-page">La cuisine du quotidien, bien pensée.</h2>
          <p className="text-muted max-w-md">
            Crée ton foyer, invite les personnes avec qui tu vis, et prépare ta première semaine en
            cinq minutes.
          </p>
          <Link href="/signup" className={buttonClasses("primary", "min-h-12 px-7 text-base")}>
            Créer mon compte
            <ArrowRightIcon size={18} />
          </Link>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
          <Logo size={44} />
          <p>
            Prix indicatifs :{" "}
            <a
              href="https://prices.openfoodfacts.org"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Open Prices
            </a>{" "}
            (licence ODbL).
          </p>
          <nav aria-label="Compte" className="flex gap-5">
            <Link href="/login" className="hover:text-foreground">
              Se connecter
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Créer un compte
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Benefit({
  badge,
  title,
  children,
}: {
  badge: "leaf" | "bowl" | "dot" | "mix";
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 lg:px-6">
      <BrandBadge variant={badge} />
      <span className="flex flex-col gap-1">
        <span className="font-display text-lg font-semibold">{title}</span>
        <span className="text-muted text-sm leading-relaxed">{children}</span>
      </span>
    </li>
  );
}

function WeekPreview() {
  const days = [
    { d: "Lun", dish: "Poulet basquaise", done: true },
    { d: "Mar", dish: "Coquillettes jambon-emmental" },
    { d: "Mer", dish: "Risotto butternut", urgent: true },
    { d: "Jeu", dish: "Shakshuka" },
    { d: "Ven", dish: "Lasagnes bolognaise" },
  ];
  return (
    <figure className="bg-surface border-border flex flex-col gap-4 rounded-3xl border p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="type-section">Semaine du 12 octobre</span>
        <span className="text-muted text-sm">5 dîners</span>
      </figcaption>
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li key={day.d} className="bg-background flex items-center gap-4 rounded-xl px-4 py-3">
            <span className="text-muted w-9 text-sm font-semibold">{day.d}</span>
            <span className={`flex-1 font-medium ${day.done ? "text-muted line-through" : ""}`}>
              {day.dish}
            </span>
            {day.urgent ? (
              <span className="bg-accent-soft text-accent-strong rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Crème à finir
              </span>
            ) : day.done ? (
              <span className="bg-leaf-soft text-success rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Cuisiné
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="bg-accent-soft text-accent-strong flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
        {n}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-muted leading-relaxed">{children}</span>
      </span>
    </li>
  );
}

function Fact({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-white/15 pt-6">
      <span className="text-ocre mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="leading-relaxed text-[#d8e2da]">{children}</p>
      </div>
    </div>
  );
}
