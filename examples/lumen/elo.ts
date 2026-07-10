// Lumen's rating loop — the "chess-puzzle" session model. Every puzzle carries a
// difficulty rating, the player carries one too, and each result nudges the
// player's rating by the standard Elo expected-score formula. A hard win pays
// more; an easy loss costs more. This is the whole meta-loop — an endless stream
// that always fits the player.
//
// This runs inside the sim (a win updates the rating mid-step), so the base-10
// power must be the deterministic `dpow`, never `Math.pow` — the invariant guard
// enforces it.

import { dpow } from '@hayao';

/** Elo expected score for the player against a puzzle of the given rating. */
export function expectedScore(playerRating: number, puzzleRating: number): number {
  return 1 / (1 + dpow(10, (puzzleRating - playerRating) / 400));
}

/**
 * The player's new rating after a result. `solved` is 1 for a win, 0 for a fail
 * (timeout / give-up). K is the volatility — a touch higher than chess's 32 so a
 * casual session converges quickly. Never drops below a soft floor.
 */
export function updateRating(
  playerRating: number,
  puzzleRating: number,
  solved: boolean,
  k = 40,
): number {
  const delta = k * ((solved ? 1 : 0) - expectedScore(playerRating, puzzleRating));
  return Math.max(100, Math.round(playerRating + delta));
}

/** The rating delta a result WOULD apply, for showing "+18 / −24" feedback. */
export function ratingDelta(playerRating: number, puzzleRating: number, solved: boolean): number {
  return updateRating(playerRating, puzzleRating, solved) - playerRating;
}

/** A friendly tier name for a rating, for HUD flavor. */
export function tierName(rating: number): string {
  if (rating < 850) return 'Ember';
  if (rating < 1100) return 'Spark';
  if (rating < 1400) return 'Kindler';
  if (rating < 1750) return 'Lantern';
  if (rating < 2100) return 'Beacon';
  return 'Lightkeeper';
}
