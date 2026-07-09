# 50-patterns/ — the cross-cutting fun & polish laws

The other sections are staged — you reach for an [[anchor]] at ANCHOR, a
[[genre]] at COMPOSE, a [[world]] at SHAPE. **Patterns are always on.** They're the
laws that apply at *every* stage and across *every* genre: a feedback loop can
snowball a puzzle or an RTS; risk/reward gives teeth to a card draw or a corner
line; readability decides whether any mechanic underneath is even visible. Don't run
these in order — hold them in the back of your mind the whole way through, and check
each design choice against the ones it touches.

They are written as **laws with teeth**: each ties to a proof or a feel-gate rather
than a vibe. Where the pattern becomes checkable, the module *routes* to it — the
skill-delta ([`design/FUN.md`](../FUN.md) law 2) for flow and feedback runaway,
the Channel-4 feel gates ([`design/JUICE.md`](../JUICE.md)) for juice and
forgiveness, the vision judge ([`design/JUDGE.md`](../JUDGE.md)) for
readability — never restating the recipe. Design the pattern here; prove it there.

Several pattern modules pair 1:1 with a concrete `[[system-*]]`: **anti-frustration**
is the mindset, [[system-grace]] the machinery; **mastery-and-flow** the why,
[[system-mastery-curve]] the how; **emergence** the principle,
[[system-emergent-systems]] the parts. Read the pair together.

## The eight pattern modules

| id | title | summary |
|---|---|---|
| [[pattern-feedback-loops]] | Feedback Loops | Positive loops snowball, negative loops correct — design which dominates so leads stay tense, not decided. |
| [[pattern-risk-reward]] | Risk / Reward | A choice with teeth — every reward priced in real risk, every option double-edged, so decisions cost something. |
| [[pattern-mastery-and-flow]] | Mastery & Flow | Keep challenge riding just above skill — the flow channel — and prove it with the skill-delta gap. |
| [[pattern-emergence]] | Emergence | Depth from few pieces — rules that interact, not content that stacks; the game generates situations you never authored. |
| [[pattern-anti-frustration]] | Anti-Frustration | Punish the mistake, not the player — grace, instant retry, undo, and respecting time keep hard fair. |
| [[pattern-juice-choreography]] | Juice as Choreography | The sim resolves and returns a choreography script; the view replays it — every event answers on ≥2 senses. |
| [[pattern-readability]] | Readability | The player must instantly find the avatar, read the threat, and see the way — salience, signposting, affordances. |
| [[pattern-pacing-and-tension]] | Pacing & Tension | Tension is a curve, not a constant — alternate peaks and breathers so the finale reads as a peak. |

## How they interlock

```
              feedback-loops ──build──▶ pacing-and-tension ◀──build── risk-reward
                    │                          │                          │
                    └──────▶ mastery-and-flow ◀┘                          │
                                    │                                     │
   emergence ──depth──▶ (the ceiling flow climbs) ◀──variance────────────┘

   readability ──gates the read──▶ juice-choreography  (juice serves the read; read wins ties)
   anti-frustration ──bounds the anxious side of──▶ mastery-and-flow
```

The **fun triangle** — feedback loops, risk/reward, and pacing — shapes tension over
time; **mastery-and-flow** is the channel that tension should stay inside;
**emergence** is how deep that channel goes on a small content budget. The **feel
pair** — readability and juice-choreography — governs whether any of it reaches the
player's eye, and **anti-frustration** keeps the whole thing humane. Every module
names the siblings it composes with and the exact proof or gate that keeps it honest.
