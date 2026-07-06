---
id: world-character-design
title: Character Design
kind: worldbuilding
tags: [identity, readability, roster, silhouette, fiction]
summary: Making characters legible and distinct in fiction — silhouette, role, and voice so a roster reads at a glance.
use-when: You have a cast or roster and need each member instantly recognizable and distinct.
composes-with: [world-faction-identity, system-unit-rosters, world-naming-and-tone]
verify-with: docs/JUDGE.md
---

**What it is.** The fiction half of a cast: giving each character a **silhouette**, a **role you can read**, and a **one-trait voice** so the whole roster separates at a glance. [[system-unit-rosters]] handles what they *do*; this handles who they *are*.

**Player fantasy / why it's fun.** The player names their favorites before the tutorial ends. A crowded screen still parses because every body is a different **shape**. Recognition is the first loyalty — you can't love a unit you can't tell apart from the one beside it.

## The kit

Three levers, in priority order. Silhouette first because it survives distance, motion blur, and a 32px sprite.

| Lever | The question | Fails when |
|---|---|---|
| **Silhouette** | Blacked out, can I still name them? | Everyone's a humanoid in a different hat |
| **Role tell** | Does the look promise the verb? | Healer looks like the bruiser |
| **Voice** | One adjective, everywhere | Six characters, one personality |

The order is the discipline. A gorgeous face on a same-shaped body loses; a crude shape that reads at a thumbnail wins. See [[pattern-readability]].

## Vectors / options

- **Shape language** — round / square / triangle. Round = friendly, soft, support. Square = stable, tanky, slow. Triangle = fast, sharp, aggressive. *Overwatch* casts almost entirely by silhouette; *Team Fortress 2* you can name from a black cutout.
- **Palette slot** — one hue owns each character. When the roster shares a world palette, identity lives in the *accent*, not the whole body. Ties into [[world-aesthetic-direction]] and [[world-faction-identity]].
- **Prop / motif** — a single carried object (Reaper's cloak, Peashooter's leaf) does the work of a paragraph of lore. See [[world-motif-and-symbol]].
- **Posture / gait** — idle stance and walk cycle read before the model does. A hunched idle telegraphs "coward unit" before a stat sheet.
- **Voice trait** — one word: *smug*, *weary*, *manic*. Every line, name, and animation obeys it. *Hades* gives each character exactly one register and never wavers. See [[world-naming-and-tone]].

### Twist seams

- **Characters but their look encodes their mechanics** *(mechanic-swap)* — the silhouette *is* the tooltip. In *Into the Breach* a mech's shape tells you its move; in *Slay the Spire* the enemy's pose telegraphs its intent. Design the body backward from the verb — spikes mean it hits, a shell means it blocks. Read distinct from decorative. Pairs with [[system-telegraphs]] and [[anchor-into-the-breach]].
- **Roster but every member is a recolor with a different verb** *(constraint)* — one base body, N palettes, N verbs. *Vampire Survivors* and classic shmup fleets thrive here: the shape is shared, the *color + behavior* carries identity. Cheap to author, brutal to keep readable — lean hard on accent hue and motion. See [[system-unit-rosters]] and [[anchor-vampire-survivors]].

## Method

1. **List the verbs first.** Before any look, write what each character *does* — one sentence. Look serves verb, not the reverse. If two characters share a verb, one of them is redundant; cut or differentiate now.
2. **Assign a shape.** Round / square / triangle per role. No two adjacent roster slots share a shape *and* a palette.
3. **Silhouette-test at a thumbnail.** Black out the roster and name each. Any collision = redesign the loser, don't tweak. This is the gate; [[pattern-readability]] is the law it enforces.
4. **Hang one motif each.** A single prop, mark, or asymmetry. Resist the second. Detail is not identity — a *distinct* detail is.
5. **Write one voice adjective per character.** Then draft two lines of dialogue that could *only* be them. If another character could say it, the voice isn't set.
6. **Encode the role in the look.** Attacker looks sharp, defender looks solid, support looks soft. Let the body promise the verb from step 1 — the twist seam above is this step turned up to eleven.
7. **Stress-test the crowd.** Put the whole roster on one screen, in motion, at real density. If it turns to soup, you over-detailed. Return to step 3.

## Aesthetic hook (Kentō woodblock / JUDGE)

The woodblock palette *rewards* this discipline. Flat fills and a limited hue set mean silhouette and one accent do nearly all the work — there's no gradient noise to hide behind.

- **Register per character.** In kentō, each color is a printed plate. Give each character one plate-accent from the palette; the shared inks bind them to the world, the accent separates them. This is faction-identity thinking at the individual scale — see [[world-faction-identity]].
- **Ink-line silhouette.** A clean outline over flat fill *is* the readability test passing. If the woodblock cutout is ambiguous, the design is.
- **Static and deterministic.** Character variation is authored, not random — no per-frame jitter deciding who's who. Keep view-only flourishes cosmetic so identity lives in the stable, hashed state, not the paint.
- **Motion as identity.** A gait or idle authored as a small tween reads before the sprite resolves. The `sandboxes/anim-lab` is where a single such motion lives in isolation — study one there before you animate a cast.

The proof is visual: the vision judge in docs/JUDGE.md looks at a headless render and asks whether the roster separates. If it can't tell two characters apart, neither can the player.

## Traps

- **Detail over readability.** The cardinal sin. Ornate armor, rich texture, a busy backstory — none of it survives a 32px thumbnail in a crowded fight. Silhouette first, always. A character the player can't parse mid-combat may as well not exist. See [[antipattern-unreadable-juice]].
- **Same body, different hat.** Palette-and-prop swaps on one humanoid shape read as *one* character to a new player. If the recolor-roster seam is your plan, over-invest in accent hue and motion or it collapses into sameness.
- **Look lies about the verb.** A soft, round healer-shaped body that actually hits hardest violates the promise the look made. Honesty is a covenant — see [[pattern-fairness-and-trust]] and [[antipattern-input-lie]].
- **One voice, cloned.** Six characters who all quip the same way are one character wearing six skins. If you can swap two characters' lines with no loss, the voices aren't distinct.
- **Lore as identity.** A dense codex entry is not a character. Identity is what reads *in play* — shape, accent, motif, one voice trait. The backstory is garnish; ship it in [[world-narrative-delivery]], not in the silhouette.
- **Designing from the corpus.** Don't survey existing casts for a look. Decide the verbs, then the shapes. Reference games sharpen a *principle*; they are not a menu — see [[process-the-twist]].

## See also

- [[system-unit-rosters]] — the mechanical half; design fiction and verbs together.
- [[world-faction-identity]] — the same silhouette/palette logic one scale up, for groups.
- [[world-naming-and-tone]] — where the one-trait voice becomes names and words.
- [[world-motif-and-symbol]] — the single carried prop, systematized.
- [[world-aesthetic-direction]] — the shared palette your accents live inside.
- [[system-telegraphs]] — when the look *is* the tell, this is its mechanical partner.
- [[pattern-readability]] — the law every silhouette test enforces.
- [[anchor-hades]], [[anchor-into-the-breach]], [[anchor-vampire-survivors]] — casts that read at a glance, each a different way.
