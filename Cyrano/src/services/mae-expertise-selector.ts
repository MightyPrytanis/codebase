/*
 * MAEExpertiseSelector
 * Scores engines based on declared expertiseContext and selects best match.
 * Currently rule-based to avoid new dependencies.
 */
import { BaseEngine } from '../engines/base-engine.js';

export interface ExpertiseProfile {
  domain?: string;
  proficiency?: string[];
}

export class MAEExpertiseSelector {
  select(engines: BaseEngine[], task: ExpertiseProfile): BaseEngine | null {
    let best: { engine: BaseEngine; score: number } | null = null;
    for (const engine of engines) {
      const info = engine.getEngineInfo();
      // @ts-ignore expertiseContext optional on config
      const ctx = (engine as any).config?.expertiseContext || {};
      const score = this.score(ctx, task);
      if (!best || score > best.score) {
        best = { engine, score };
      }
    }
    return best?.engine || null;
  }

  private score(ctx: ExpertiseProfile, task: ExpertiseProfile): number {
    let score = 0;
    if (ctx.domain && task.domain && ctx.domain === task.domain) score += 3;
    if (task.proficiency && ctx.proficiency) {
      const overlap = task.proficiency.filter(p => ctx.proficiency?.includes(p)).length;
      score += overlap;
    }
    return score;
  }
}

export const maeExpertiseSelector = new MAEExpertiseSelector();

