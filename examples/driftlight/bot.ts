// A guidance bot: read the safe across-stream line just ahead of the lantern
// and steer toward it. Threading the gates also gathers the lights strung along
// them, so a bot that tracks the line keeps its flame lit and reaches the sea —
// this is the winnability proof the verify/test suites drive.

import { buildCourse, guideY, COURSE_SEED, type Course } from './logic';

export interface DlProbe {
  px: number;
  py: number;
  flame: number;
  won: boolean;
  lost: boolean;
}

const course: Course = buildCourse(COURSE_SEED);

/** Look slightly downstream so the lantern is already lined up at the gate. */
export function driftBot(p: DlProbe): string[] {
  const target = guideY(course, p.px + 40);
  if (p.py < target - 6) return ['down'];
  if (p.py > target + 6) return ['up'];
  return [];
}
