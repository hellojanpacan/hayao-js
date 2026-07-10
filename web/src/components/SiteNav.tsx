import * as React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Gamepad2,
  Swords,
  Puzzle,
  Zap,
  Sparkles,
  FileCode2,
  BookOpen,
  FlaskConical,
  Star,
  Package,
  ChevronDown,
  Copy,
  Check,
  X,
  ArrowRight,
  Menu,
  Sun,
  Moon,
} from "lucide-react";

/* ── The canonical logo lockup — definition in ./logo.ts, all outlined vector ── */
import {
  LOGO_CROWN,
  LOGO_RULE,
  LOGO_GOLD,
  WORDMARK_HAYAO,
  WORDMARK_JS,
  LOCKUP_VIEWBOX,
  LOCKUP_CLASS,
} from "./logo";

function Lockup() {
  return (
    <svg viewBox={LOCKUP_VIEWBOX} className={LOCKUP_CLASS} role="img" aria-label="Hayao.js">
      <path d={LOGO_CROWN} fill={LOGO_GOLD} />
      <path d={LOGO_RULE} fill="var(--color-ink)" />
      <path d={WORDMARK_HAYAO} fill="var(--color-ink)" />
      <path d={WORDMARK_JS} fill="var(--color-muted)" />
    </svg>
  );
}

type LucideIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type Item = { icon: LucideIcon; title: string; desc: string; href: string; external?: boolean };

const PLAY: Item[] = [
  { icon: Gamepad2, title: "2D Platformer", desc: "Momentum, coyote-time, tight feel", href: "/play/platformer" },
  { icon: Swords, title: "Tiny RTS", desc: "Faction asymmetry, wall-aware units", href: "/play/rts" },
  { icon: Puzzle, title: "Mobile Puzzle", desc: "Solver-proven, one-thumb play", href: "/play/puzzle" },
];
const CREATE: Item[] = [
  { icon: Zap, title: "Quickstart with default style", desc: "Start with a library — a working prototype in minutes", href: "/create/quickstart" },
  { icon: Sparkles, title: "Design an original concept", desc: "Start with the game design engine, then prototype in Regalia", href: "/create/concept" },
  { icon: FileCode2, title: "Start from scratch", desc: "An empty, solver-ready project — fully your way", href: "/create/scratch" },
];
const DOCS: Item[] = [
  { icon: BookOpen, title: "Documentation", desc: "Guides, API & conventions", href: "https://hayao.js.org", external: true },
  { icon: FlaskConical, title: "Sandbox", desc: "Single-mechanic labs", href: "/docs/sandbox" },
  { icon: Star, title: "Star on GitHub", desc: "hellojanpacan/hayao-js", href: "https://github.com/hellojanpacan/hayao-js", external: true },
  { icon: Package, title: "npm package", desc: "npm i hayao", href: "https://www.npmjs.com/package/hayao", external: true },
];

const AGENT_PROMPT = `Set up the Hayao game engine and build me a 2D game.

1. Scaffold a project:
   npm create hayao@latest my-game && cd my-game && npm install
2. Read AGENTS.md and docs/CONVENTIONS.md for the invariants.
3. Ask me what kind of game I want, then build it — pure logic with a
   solver proof for every level, and the scene tree as the view.
4. Prove it works: npm run verify  (deterministic + every level winnable)
5. Run it: npm run dev

Start now.`;

/* ── shared bits ── */
function ext(item: Item) {
  return item.external ? { target: "_blank", rel: "noreferrer" } : {};
}

/* ── Day / night toggle ──
   The current theme lives on <html data-theme> (set before paint by the boot
   script in Layout.astro); the sun/moon swap is pure CSS keyed off it, so this
   button renders identically on server and client — no hydration mismatch. */
function ThemeToggle() {
  function toggle() {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    try {
      localStorage.setItem("hayao-theme", next);
    } catch {
      /* storage unavailable — theme still applies for this page */
    }
  }
  return (
    <button
      onClick={toggle}
      aria-label="Toggle day / night mode"
      className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full transition-colors hover:bg-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
    >
      <Sun className="tt-sun absolute size-5 text-orange" aria-hidden="true" />
      <Moon className="tt-moon absolute size-5 text-blue" aria-hidden="true" />
    </button>
  );
}

function PanelLink({ icon: Icon, title, desc, href, external }: Item) {
  return (
    <NavigationMenu.Link asChild>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="flex items-start gap-3 rounded-xl p-3 no-underline transition-colors hover:bg-mist"
      >
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block text-[0.95rem] font-semibold text-ink">{title}</span>
          <span className="block text-[0.82rem] leading-snug text-muted">{desc}</span>
        </span>
      </a>
    </NavigationMenu.Link>
  );
}

function Trigger({ children }: { children: React.ReactNode }) {
  return (
    <NavigationMenu.Trigger className="group inline-flex select-none items-center gap-1 rounded-md px-3 py-2 text-[0.95rem] font-medium text-ink outline-none transition-colors hover:text-orange focus-visible:ring-2 focus-visible:ring-orange data-[state=open]:text-orange">
      {children}
      <ChevronDown
        className="size-4 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenu.Trigger>
  );
}

/* ── Get Started modal ── */
function GetStarted({ variant = "solid" }: { variant?: "solid" | "block" }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(AGENT_PROMPT);
        ok = true;
      }
    } catch {
      /* fall through to legacy path */
    }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = AGENT_PROMPT;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* clipboard unavailable */
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className={
            variant === "block"
              ? "inline-flex w-full items-center justify-center rounded-full bg-orange px-4 py-3 font-body text-[0.95rem] font-semibold text-white transition-colors hover:bg-green"
              : "inline-flex items-center rounded-full bg-orange px-4 py-2 font-body text-[0.9rem] font-semibold text-white transition-colors hover:bg-green"
          }
        >
          Get Started
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-[60] bg-navy/40 backdrop-blur-md" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-[70] w-[min(92vw,560px)] rounded-3xl border border-hair bg-panel p-6 shadow-2xl focus:outline-none">
          <Dialog.Title className="font-display text-[1.5rem] font-semibold text-ink">
            Start with your agent
          </Dialog.Title>
          <Dialog.Description className="mt-1 font-body text-[0.95rem] font-light text-soft">
            Paste this into Claude Code, Cursor, or any coding agent — it does the rest.
          </Dialog.Description>

          <pre className="mt-4 max-h-[46vh] overflow-auto whitespace-pre-wrap rounded-xl border border-hair bg-mist p-4 font-mono text-[0.8rem] leading-relaxed text-ink">
{AGENT_PROMPT}
          </pre>

          <div className="mt-4 flex justify-end">
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2 font-body text-[0.9rem] font-semibold text-white transition-colors hover:bg-green"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-mist hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            aria-label="Close"
          >
            <X className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Mobile menu ── */
function MobileMenu() {
  const groups: { label: string; items: Item[] }[] = [
    { label: "Play", items: PLAY },
    { label: "Create", items: CREATE },
    { label: "Docs", items: DOCS },
  ];
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-mist md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-[60] bg-navy/40 backdrop-blur-md" />
        <Dialog.Content className="sheet-content fixed inset-x-0 top-0 z-[70] max-h-[100dvh] overflow-auto rounded-b-3xl border-b border-hair bg-panel p-6 focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-display text-[1.1rem] font-semibold text-ink">Menu</span>
            <Dialog.Close className="rounded-md p-1 text-muted hover:bg-mist hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="mb-2 font-body text-[0.72rem] uppercase tracking-[0.16em] text-muted">{g.label}</p>
                <div className="flex flex-col gap-1">
                  {g.items.map((t) => (
                    <a
                      key={t.title}
                      href={t.href}
                      {...ext(t)}
                      className="flex items-center gap-3 rounded-lg p-2.5 no-underline transition-colors hover:bg-mist"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-orange/10 text-orange">
                        <t.icon className="size-[17px]" />
                      </span>
                      <span className="text-[0.95rem] font-medium text-ink">{t.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <GetStarted variant="block" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── The nav ── */
export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between rounded-full border border-hair bg-panel/80 pl-6 pr-2.5 shadow-[0_12px_34px_-14px_rgba(41,51,92,0.32)] backdrop-blur-md">
        {/* left — logo (whole area → home) */}
        <a href="/" className="flex items-center no-underline">
          <Lockup />
        </a>

        {/* center — menu */}
        <NavigationMenu.Root className="relative hidden md:flex" delayDuration={80} skipDelayDuration={300}>
          <NavigationMenu.List className="flex items-center gap-1">
            <NavigationMenu.Item>
              <Trigger>Play</Trigger>
              <NavigationMenu.Content className="p-4">
                <div className="w-[560px]">
                  <div className="grid grid-cols-3 gap-3">
                    {PLAY.map((t) => (
                      <NavigationMenu.Link asChild key={t.title}>
                        <a
                          href={t.href}
                          className="flex flex-col gap-2 rounded-xl border border-hair p-4 no-underline transition-colors hover:border-orange/50 hover:bg-orange/5"
                        >
                          <span className="flex size-10 items-center justify-center rounded-full bg-orange/10 text-orange">
                            <t.icon className="size-5" strokeWidth={2} />
                          </span>
                          <span className="text-[0.95rem] font-semibold text-ink">{t.title}</span>
                          <span className="text-[0.8rem] leading-snug text-muted">{t.desc}</span>
                        </a>
                      </NavigationMenu.Link>
                    ))}
                  </div>
                  <NavigationMenu.Link asChild>
                    <a
                      href="/play"
                      className="mt-3 flex items-center justify-between rounded-xl bg-mist px-4 py-3 font-body text-[0.9rem] font-semibold text-ink no-underline transition-colors hover:bg-cloud"
                    >
                      Explore all games
                      <ArrowRight className="size-4" />
                    </a>
                  </NavigationMenu.Link>
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <Trigger>Create</Trigger>
              <NavigationMenu.Content className="p-3">
                <div className="flex w-[420px] flex-col gap-1">
                  <p className="px-3 pb-1.5 pt-1 text-[0.8rem] leading-snug text-muted">
                    Build fully your way — or take a quicker on-ramp.
                  </p>
                  {CREATE.map((t) => (
                    <PanelLink key={t.title} {...t} />
                  ))}
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <Trigger>Docs</Trigger>
              <NavigationMenu.Content className="p-3">
                <div className="flex w-[400px] flex-col gap-1">
                  {DOCS.map((t) => (
                    <PanelLink key={t.title} {...t} />
                  ))}
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <div className="absolute left-1/2 top-full flex -translate-x-1/2 justify-center pt-2.5">
            <NavigationMenu.Viewport className="nav-viewport" />
          </div>
        </NavigationMenu.Root>

        {/* right — theme + CTA + mobile */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div className="hidden md:block">
            <GetStarted />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
