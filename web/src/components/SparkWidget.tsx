import * as React from "react";
import { Sparkles } from "lucide-react";

/**
 * The Design Codex's spark, live on the page. Mirrors scripts/compose-design.mjs:
 * sample a real anchor + genre + verb + twist vector + systems from the codex
 * index (slimmed server-side, passed as props) with the same seeded PRNG, so a
 * seed shown here reproduces in the CLI: npm run design:spark -- --seed N
 */

export type SlimModule = { id: string; title: string; summary: string };
export type SlimGenre = SlimModule & { sys: string[] };
type Props = {
  anchors: SlimModule[];
  genres: SlimGenre[];
  mechanics: SlimModule[];
  systems: SlimModule[];
};

const TWISTS: { v: string; prompt: string }[] = [
  { v: "theme", prompt: "reskin the fantasy onto a setting that recontextualizes every system" },
  { v: "mechanic-swap", prompt: "replace its central verb with a different one and re-derive the loop" },
  { v: "structure", prompt: "change the session/run/campaign shape that holds it together" },
  { v: "perspective", prompt: "flip who the player is — invert the point of view on the loop" },
  { v: "constraint", prompt: "impose a hard limit (one button, one screen, one life, no UI) and design into it" },
  { v: "tonal", prompt: "hold a tone that clashes with the content, sincerely, and mine the friction" },
];

// mulberry32 — same tiny seeded PRNG as the CLI, so seeds are portable.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compose(seed: number, d: Props) {
  // Mirrors scripts/compose-design.mjs spark() call-for-call (same pick order,
  // same shuffle), so any seed printed here reproduces in the CLI.
  const rng = mulberry32(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const anchor = pick(d.anchors);
  const genre = pick(d.genres);
  const verb = pick(d.mechanics);
  const twist = pick(TWISTS);
  // prefer systems the genre already composes with; top up from a full shuffle.
  const shuffled = d.systems.map((s) => s.id);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const byId = new Map(d.systems.map((s) => [s.id, s]));
  const systems = [...new Set([...genre.sys, ...shuffled])]
    .slice(0, 3)
    .map((id) => byId.get(id))
    .filter((s): s is SlimModule => Boolean(s));
  return { anchor, genre, verb, twist, systems };
}

function Row({ label, m, tint }: { label: string; m: SlimModule; tint: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <span className={`w-20 shrink-0 font-body text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${tint}`}>{label}</span>
      <p className="font-body text-[0.92rem] font-light leading-relaxed text-white/80">
        <a href={`/docs/codex/${m.id}`} className="font-semibold text-white underline decoration-white/25 underline-offset-4 transition-colors hover:text-orange">
          {m.title}
        </a>{" "}
        <span className="text-white/60">— {m.summary}</span>
      </p>
    </div>
  );
}

export default function SparkWidget(props: Props) {
  // First render is deterministic (SSR + hydration agree); real entropy on demand.
  const [seed, setSeed] = React.useState(576079902);
  const s = React.useMemo(() => compose(seed, props), [seed, props]);

  return (
    <div className="rounded-[2.25rem] bg-navy px-6 py-10 text-left md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-body text-[0.75rem] uppercase tracking-[0.2em] text-orange">Spark — a composed starting point</p>
        <button
          onClick={() => setSeed((Math.random() * 2 ** 31) | 0)}
          className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 font-body text-[0.9rem] font-semibold text-white transition-colors hover:bg-green"
        >
          <Sparkles className="size-4" />
          Spark again
        </button>
      </div>

      <h3 className="mt-6 text-balance font-display text-[clamp(1.3rem,3vw,1.8rem)] font-semibold leading-snug text-white">
        “{s.genre.title}, but {s.twist.v}” — anchored on {s.anchor.title}, built around {s.verb.title.toLowerCase()}.
      </h3>

      <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-7">
        <Row label="Anchor" m={s.anchor} tint="text-blue" />
        <Row label="Genre" m={s.genre} tint="text-green" />
        <Row label="Verb" m={s.verb} tint="text-orange" />
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-20 shrink-0 font-body text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-rose">Twist</span>
          <p className="font-body text-[0.92rem] font-light leading-relaxed text-white/80">
            <span className="font-semibold text-white">{s.twist.v}</span>
            <span className="text-white/60"> — {s.twist.prompt}</span>
          </p>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-20 shrink-0 font-body text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/50">Systems</span>
          <p className="font-body text-[0.92rem] font-light leading-relaxed text-white/70">
            {s.systems.map((sys, i) => (
              <React.Fragment key={sys.id}>
                {i > 0 && " · "}
                <a href={`/docs/codex/${sys.id}`} className="text-white/85 underline decoration-white/25 underline-offset-4 transition-colors hover:text-orange">
                  {sys.title}
                </a>
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      <p className="mt-7 border-t border-white/10 pt-5 font-mono text-[0.72rem] text-white/40">
        seed {seed} — reproduce it: npm run design:spark -- --seed {seed}
      </p>
    </div>
  );
}
