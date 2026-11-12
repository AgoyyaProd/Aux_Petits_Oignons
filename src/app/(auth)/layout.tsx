import { BrandElement } from "@/components/brand/shapes";
import { SiteShell } from "@/components/layout/site-shell";

/**
 * Connexion et inscription : dans la coquille commune du site (version visiteur), un
 * formulaire court et centré, entouré des formes du logo.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteShell member={false}>
      <div className="relative isolate flex min-h-[70dvh] items-center justify-center py-6">
        <BrandElement
          name="leaf"
          priority
          sizes="224px"
          className="absolute top-0 left-[8%] -z-10 hidden w-56 -rotate-12 md:block"
        />
        <BrandElement
          name="dot"
          priority
          sizes="160px"
          className="absolute top-1/3 right-[6%] -z-10 hidden w-40 md:block"
        />
        <BrandElement
          name="slice"
          priority
          sizes="288px"
          className="absolute bottom-0 left-[18%] -z-10 hidden w-72 rotate-3 md:block"
        />
        <div className="bg-surface border-border flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-2xl border p-6 sm:p-8">
          {children}
        </div>
      </div>
    </SiteShell>
  );
}
