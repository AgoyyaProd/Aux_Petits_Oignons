"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckIcon, ClockIcon, CloseIcon } from "@/components/ui/icons";
import { formatCountdown, type StepTimer } from "@/domain/recipes/steps";

/**
 * État « en cuisine » partagé par la fiche recette : le nombre de portions choisi (liste
 * d'ingrédients, étapes et mode cuisine affichent les mêmes quantités) et les minuteurs en
 * cours, qui continuent quand on change d'étape ou qu'on ouvre le mode cuisine.
 * Les minuteurs reposent sur l'heure de fin, pas sur un décompte : ils restent justes même si
 * le téléphone met l'onglet en veille.
 */

export interface RunningTimer {
  id: number;
  /** Étape d'origine (1-indexée) et durée lue dans le texte. */
  step: number;
  label: string;
  endsAt: number;
  done: boolean;
}

interface Kitchen {
  servings: number;
  setServings: (n: number) => void;
  baseServings: number;
  timers: RunningTimer[];
  now: number;
  startTimer: (step: number, timer: StepTimer) => void;
  stopTimer: (id: number) => void;
}

const KitchenContext = createContext<Kitchen | null>(null);

export function useKitchen(): Kitchen {
  const k = useContext(KitchenContext);
  if (!k) throw new Error("useKitchen doit être utilisé dans <KitchenProvider>.");
  return k;
}

/** Trois bips courts, via Web Audio (aucun fichier son à charger). */
function ring(ctx: AudioContext | null) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  for (let i = 0; i < 3; i += 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t0 + i * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + i * 0.35 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.35 + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + i * 0.35);
    osc.stop(t0 + i * 0.35 + 0.3);
  }
}

export function KitchenProvider({
  baseServings,
  children,
}: {
  baseServings: number;
  children: ReactNode;
}) {
  const [servings, setServings] = useState(baseServings);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  // Heure courante, lue seulement quand un minuteur tourne (jamais au rendu serveur).
  const [now, setNow] = useState(0);
  const nextId = useRef(1);
  const audio = useRef<AudioContext | null>(null);

  const latest = useRef<RunningTimer[]>([]);
  useEffect(() => {
    latest.current = timers;
  }, [timers]);

  const running = timers.some((t) => !t.done);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const due = latest.current.filter((x) => !x.done && x.endsAt <= t);
      if (!due.length) return;
      ring(audio.current);
      navigator.vibrate?.([300, 150, 300, 150, 300]);
      const ids = new Set(due.map((x) => x.id));
      setTimers((list) => list.map((x) => (ids.has(x.id) ? { ...x, done: true } : x)));
    };
    const id = window.setInterval(tick, 500);
    // Au retour sur l'onglet, mise à jour immédiate.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);

  const startTimer = useCallback((step: number, timer: StepTimer) => {
    // Le son doit être autorisé par un geste de l'utilisateur : on prépare l'audio ici.
    try {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor && !audio.current) audio.current = new Ctor();
      void audio.current?.resume();
    } catch {
      audio.current = null;
    }
    const start = Date.now();
    setNow(start);
    setTimers((list) => [
      ...list,
      {
        id: nextId.current++,
        step,
        label: timer.label,
        endsAt: start + timer.seconds * 1000,
        done: false,
      },
    ]);
  }, []);

  const stopTimer = useCallback((id: number) => {
    setTimers((list) => list.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ servings, setServings, baseServings, timers, now, startTimer, stopTimer }),
    [servings, baseServings, timers, now, startTimer, stopTimer],
  );
  return (
    <KitchenContext.Provider value={value}>
      {children}
      <TimerTray className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 lg:right-8 lg:bottom-8 lg:left-auto lg:w-80" />
    </KitchenContext.Provider>
  );
}

/** Minuteurs en cours, empilés ; un minuteur terminé reste affiché jusqu'à ce qu'on l'arrête. */
export function TimerTray({ className = "" }: { className?: string }) {
  const { timers, now, stopTimer } = useKitchen();
  if (!timers.length) return null;
  return (
    <ul aria-label="Minuteurs" className={`flex flex-col gap-2 ${className}`}>
      {timers.map((t) => {
        const left = (t.endsAt - now) / 1000;
        return (
          <li
            key={t.id}
            role={t.done ? "alert" : undefined}
            className={[
              "flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-md)]",
              t.done ? "bg-accent-strong animate-pulse text-white" : "bg-forest text-cream",
            ].join(" ")}
          >
            {t.done ? <CheckIcon size={20} /> : <ClockIcon size={20} />}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs opacity-80">
                Étape {t.step} · {t.label}
              </span>
              <span className="font-display text-xl font-semibold tabular-nums">
                {t.done ? "C'est prêt !" : formatCountdown(left)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => stopTimer(t.id)}
              aria-label={t.done ? "Fermer le minuteur" : `Arrêter le minuteur de ${t.label}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
            >
              <CloseIcon size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Boutons « lancer un minuteur » d'une étape. */
export function StepTimerButtons({
  step,
  timers,
  size = "md",
}: {
  step: number;
  timers: StepTimer[];
  size?: "md" | "lg";
}) {
  const { startTimer, timers: running } = useKitchen();
  if (!timers.length) return null;
  return (
    <span className="flex flex-wrap gap-2">
      {timers.map((t) => {
        const active = running.some((r) => r.step === step && r.label === t.label && !r.done);
        return (
          <button
            key={t.label}
            type="button"
            disabled={active}
            onClick={() => startTimer(step, t)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors",
              active
                ? "bg-brand-soft text-brand cursor-default border-transparent"
                : "border-forest text-forest hover:bg-forest hover:text-cream dark:border-brand dark:text-brand dark:hover:bg-brand dark:hover:text-brand-foreground",
              size === "lg" ? "min-h-12 px-5 text-base" : "min-h-9 px-3 text-sm",
            ].join(" ")}
          >
            <ClockIcon size={size === "lg" ? 20 : 16} />
            {active ? `${t.label} en cours` : t.label}
          </button>
        );
      })}
    </span>
  );
}
