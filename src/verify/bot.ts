// The plan-interpreter bot skeleton — promoted to the engine after three
// example games (shard-ascent, sproutveil, gleamvale) each rebuilt the same
// shape: a plan of semantic steps, executed reactively against the probe each
// frame, emitting actions. Games supply the step executors (steering is
// genre-specific); the engine supplies the lifecycle, retries, and telemetry.
//
//   const bot = createPlanBot(plan, {
//     walk(step, probe, out, ctx) { …steer…; if (arrived) ctx.next(); },
//   });
//   while (!probe.won) world.step(bot(world.probe()));

export interface BotCtx {
  /** Frames spent in the current step. */
  frames: number;
  /** Free per-step scratch (cleared on step change). */
  mem: Record<string, unknown>;
  /** Advance to the next plan step. */
  next(): void;
  /** Restart the current step (retry) — clears frames + mem. */
  retry(): void;
}

export type StepExec<Step, Probe> = (step: Step, probe: Probe, out: string[], ctx: BotCtx) => void;

export interface PlanBot<Probe> {
  (probe: Probe): string[];
  stepIndex(): number;
  done(): boolean;
}

export function createPlanBot<Step extends { kind: string }, Probe>(plan: Step[], execs: Record<string, StepExec<Step, Probe>>): PlanBot<Probe> {
  let i = 0;
  let frames = 0;
  let mem: Record<string, unknown> = {};

  const fn = (probe: Probe): string[] => {
    const out: string[] = [];
    const step = plan[i];
    if (!step) return out;
    frames++;
    const ctx: BotCtx = {
      get frames() {
        return frames;
      },
      mem,
      next() {
        i++;
        frames = 0;
        mem = {};
      },
      retry() {
        frames = 0;
        mem = {};
      },
    };
    const exec = execs[step.kind];
    if (!exec) throw new Error(`plan bot: no executor for step kind "${step.kind}"`);
    exec(step, probe, out, ctx);
    return out;
  };
  const bot = fn as PlanBot<Probe>;
  bot.stepIndex = () => i;
  bot.done = () => i >= plan.length;
  return bot;
}

/** Shared steering helper: 4/8-way movement toward a point. */
export function steer2D(px: number, py: number, tx: number, ty: number, out: string[], dead = 8): void {
  if (px < tx - dead) out.push('right');
  else if (px > tx + dead) out.push('left');
  if (py < ty - dead) out.push('down');
  else if (py > ty + dead) out.push('up');
}
