// View camera (FX-04): what the screen shows, kept apart from the simulation camera that spawns, aim, and
// off-screen checks use (G14). The view follows a point a little ahead of the player's movement on a critically
// damped spring, a hit kicks it along the blow, and it never leaves the world. It steps with the simulation, so a
// paused run holds still and a replay draws the same frames.
import { clamp } from '../worldMath.ts';

/** Spring rate (1/s): about 0.4 s to settle. */
export const VIEW_FOLLOW = 9;
/** How far ahead of the player the view leans while moving, in world units. */
export const VIEW_LEAD = 70;
/** Speed (world units/s) of the kick a hit gives the view along the blow. */
export const HIT_KICK = 240;
/** Shake: trauma (0-1) is the shake level over this, and the offset is trauma² times SHAKE_OFFSET. */
const SHAKE_FULL = 20;
const SHAKE_OFFSET = 18;

export class ViewCamera {
  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  private vx = 0;
  private vy = 0;
  private leadX = 0;
  private leadY = 0;

  snap(x: number, y: number) {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.vx = this.vy = this.leadX = this.leadY = 0;
  }

  /** A hit on the player pushes the view along (dx, dy), a unit vector from the source. */
  kick(dx: number, dy: number) {
    this.vx += dx * HIT_KICK;
    this.vy += dy * HIT_KICK;
  }

  /** One simulation step toward the camera position (x, y), leaning along the movement (mx, my), inside 0..max. */
  step(dt: number, x: number, y: number, mx: number, my: number, maxX: number, maxY: number) {
    this.prevX = this.x;
    this.prevY = this.y;
    const lean = 1 - Math.exp(-4 * dt);
    this.leadX += (mx * VIEW_LEAD - this.leadX) * lean;
    this.leadY += (my * VIEW_LEAD - this.leadY) * lean;
    const targetX = clamp(x + this.leadX, 0, maxX);
    const targetY = clamp(y + this.leadY, 0, maxY);
    // Critically damped spring, stable at any step (Game Programming Gems 4, 1.10).
    const k = VIEW_FOLLOW * dt;
    const decay = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
    const changeX = this.x - targetX;
    const changeY = this.y - targetY;
    const pushX = (this.vx + VIEW_FOLLOW * changeX) * dt;
    const pushY = (this.vy + VIEW_FOLLOW * changeY) * dt;
    this.vx = (this.vx - VIEW_FOLLOW * pushX) * decay;
    this.vy = (this.vy - VIEW_FOLLOW * pushY) * decay;
    this.x = clamp(targetX + (changeX + pushX) * decay, 0, maxX);
    this.y = clamp(targetY + (changeY + pushY) * decay, 0, maxY);
  }
}

/**
 * Screen shake offset for a shake level at a moment (FX-04): trauma² from smooth noise, so small shakes stay small
 * and nothing is drawn from a random stream. The level decays in real time and a paused run clears it.
 */
export function shakeOffset(level: number, time: number) {
  const trauma = clamp(level / SHAKE_FULL, 0, 1);
  const amplitude = trauma * trauma * SHAKE_OFFSET;
  return {
    x: amplitude * (Math.sin(time * 71.3) * 0.6 + Math.sin(time * 43.1 + 1.7) * 0.4),
    y: amplitude * (Math.sin(time * 59.7 + 0.5) * 0.6 + Math.sin(time * 37.9 + 2.9) * 0.4),
  };
}
