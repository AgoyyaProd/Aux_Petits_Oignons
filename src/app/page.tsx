import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { buttonClasses } from "@/components/ui/button";
import {
  BasketIcon,
  CalendarIcon,
  ClockIcon,
  LeafIcon,
  PantryIcon,
  WalletIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: { absolute: "Aux Petits Oignons — La cuisine du quotidien, bien pensée." },
};

/** Recettes réelles du catalogue (slug, titre, durée totale, type). */
const SELECTION = [
  { slug: "poulet-basquaise", title: "Poulet basquaise", minutes: 65, tags: ["plat"] },
  {
    slug: "risotto-butternut",
    title: "Risotto à la courge butternut",
    minutes: 45,
    tags: ["plat"],
  },
  { slug: "shakshuka", title: "Shakshuka", minutes: 35, tags: ["plat"] },
  { slug: "salade-nicoise", title: "Salade niçoise", minutes: 30, tags: ["salade"] },
] as const;

/** Page publique, statique (prérendue). Un utilisateur connecté est redirigé par le proxy. */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Aux Petits Oignons, accueil">
          <Logo size={30} />
        </Link>
        <nav
          aria-label="Rubriques"
          className="hidden items-center gap-7 text-sm font-medium md:flex"
        >
          <a href="#fonctionnement" className="hover:text-brand">
            Comment ça marche
          </a>
          <a href="#recettes" className="hover:text-brand">
            Recettes
          </a>
          <a href="#anti-gaspillage" className="hover:text-brand">
            Anti-gaspillage et budget
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClasses("ghost", "px-4")}>
            Se connecter
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "max-sm:hidden")}>
            Créer un compte
          </Link>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-14 lg:pb-24">
          <div className="flex flex-col gap-6">
            <h1 className="type-display max-w-[11ch]">Bien manger, ça change tout.</h1>
            <p className="text-muted max-w-lg text-lg leading-relaxed">
              Aux Petits Oignons part de ce qu&apos;il y a déjà dans ton frigo et tes placards, te
              propose les repas de la semaine dans ton budget et prépare la liste de courses avec
              seulement ce qui manque.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={buttonClasses("accent", "min-h-12 px-6 text-base")}>
                Découvrir l&apos;application
              </Link>
              <a
                href="#fonctionnement"
                className={buttonClasses("secondary", "min-h-12 px-6 text-base")}
              >
                Voir comment ça marche
              </a>
            </div>
            <p className="text-muted text-sm">Gratuit, sans publicité, pensé pour tout le foyer.</p>
          </div>
          <HeroTable />
        </section>

        {/* Bénéfices */}
        <section aria-labelledby="benefices" className="bg-surface border-border border-y">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
            <h2 id="benefices" className="type-page max-w-sm">
              Moins de charge mentale, plus d&apos;envie de cuisiner.
            </h2>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <Benefit icon={<PantryIcon size={22} />} title="Tes stocks, sans prise de tête">
                Frigo, placards et congélateur au même endroit, avec les dates limites qui
                approchent en premier.
              </Benefit>
              <Benefit icon={<CalendarIcon size={22} />} title="La semaine planifiée">
                Un menu midi et soir proposé selon tes goûts, ton temps et ce qui doit être mangé
                vite.
              </Benefit>
              <Benefit icon={<BasketIcon size={22} />} title="Des courses plus simples">
                La liste se calcule toute seule, rangée par rayon, et se coche au magasin.
              </Benefit>
              <Benefit icon={<LeafIcon size={22} />} title="Moins de gaspillage">
                Les produits entamés ou à date courte passent devant dans les menus proposés.
              </Benefit>
            </ul>
          </div>
        </section>

        {/* Fonctionnement */}
        <section
          id="fonctionnement"
          aria-labelledby="fonctionnement-titre"
          className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 py-16 sm:px-6 lg:py-24"
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
                <Step n={2} title="Reçois ton menu">
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

        {/* Recettes */}
        <section
          id="recettes"
          aria-labelledby="recettes-titre"
          className="bg-peach/45 scroll-mt-6 dark:bg-transparent"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="recettes-titre" className="type-page max-w-lg">
                Des recettes du quotidien, testées et chiffrées
              </h2>
              <p className="text-muted max-w-sm">
                Plus de 120 recettes, des pâtes du mardi soir à la blanquette du dimanche.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4 lg:gap-5">
              {SELECTION.map((r) => (
                <li key={r.slug} className="flex flex-col gap-3">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <RecipeVisual slug={r.slug} title={r.title} tags={r.tags} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="type-card">{r.title}</h3>
                    <p className="text-muted inline-flex items-center gap-1.5 text-sm">
                      <ClockIcon size={16} /> {r.minutes} min
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Anti-gaspillage et budget */}
        <section
          id="anti-gaspillage"
          aria-labelledby="gaspi-titre"
          className="bg-forest text-cream scroll-mt-6"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="flex flex-col gap-5">
              <h2 id="gaspi-titre" className="type-page">
                Ce qui est acheté est mangé.
              </h2>
              <p className="text-lg leading-relaxed text-[#d8e2da]">
                Chaque menu commence par les produits entamés et ceux dont la date approche. Les
                quantités sont calculées au gramme près, sans conversion approximative : un produit
                dont on ne connaît pas la quantité n&apos;est jamais compté comme disponible.
              </p>
            </div>
            <div className="flex flex-col gap-6">
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
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <LogoMark size={56} />
          <h2 className="type-page">La cuisine du quotidien, bien pensée.</h2>
          <p className="text-muted max-w-md">
            Crée ton foyer, invite les personnes avec qui tu vis, et prépare ta première semaine en
            cinq minutes.
          </p>
          <Link href="/signup" className={buttonClasses("accent", "min-h-12 px-7 text-base")}>
            Créer mon compte
          </Link>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
          <Logo size={24} />
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

/** Le hero : une table de la semaine, trois plats en grand format. */
function HeroTable() {
  return (
    <div aria-hidden="true" className="grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4">
      <div className="col-span-4 row-span-4 overflow-hidden rounded-2xl">
        <RecipeVisual slug="lasagnes-bolognaise" title="Lasagnes à la bolognaise" tags={["plat"]} />
      </div>
      <div className="col-span-2 row-span-3 overflow-hidden rounded-2xl">
        <RecipeVisual slug="taboule" title="Taboulé aux herbes" tags={["salade"]} />
      </div>
      <div className="col-span-2 row-span-3 overflow-hidden rounded-2xl">
        <RecipeVisual slug="veloute-brocoli" title="Velouté de brocoli" tags={["soupe"]} />
      </div>
      <div className="bg-surface border-border col-span-4 row-span-2 flex items-center gap-4 rounded-2xl border px-5">
        <span className="bg-highlight-soft text-warning flex size-11 shrink-0 items-center justify-center rounded-full">
          <BasketIcon size={22} />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Liste de courses prête</span>
          <span className="text-muted text-sm">9 articles, rangés par rayon</span>
        </span>
      </div>
    </div>
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
    <figure className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="type-section">Semaine du 12 octobre</span>
        <span className="text-muted text-sm">5 dîners</span>
      </figcaption>
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li key={day.d} className="bg-background flex items-center gap-4 rounded-lg px-4 py-3">
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

function Benefit({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3">
      <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-full">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted leading-relaxed">{children}</p>
    </li>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="font-display text-accent-strong w-8 shrink-0 text-3xl leading-none font-semibold">
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
