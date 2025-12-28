/*
 * Skill Registry
 * Central registry for loaded skills, similar to module/engine registries.
 * 
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 */

import { LoadedSkill } from './base-skill.js';
import { SkillLoader } from './skill-loader.js';

class SkillRegistry {
  private skills: Map<string, LoadedSkill>;
  private loader: SkillLoader;

  constructor() {
    this.skills = new Map();
    this.loader = new SkillLoader();
  }

  /**
   * Load all skills from configured directories
   */
  async loadAll(): Promise<void> {
    const loaded = await this.loader.loadAll();
    for (const skillData of loaded) {
      this.register(skillData);
    }
  }

  /**
   * Register a skill
   */
  register(skill: LoadedSkill): void {
    this.skills.set(skill.skill.skillId, skill);
  }

  /**
   * Get a skill by ID
   */
  get(skillId: string): LoadedSkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get all registered skills
   */
  getAll(): LoadedSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by domain
   */
  getByDomain(domain: string): LoadedSkill[] {
    return Array.from(this.skills.values()).filter(
      s => s.frontmatter.domain === domain
    );
  }

  /**
   * Get skills by proficiency
   */
  getByProficiency(proficiency: string): LoadedSkill[] {
    return Array.from(this.skills.values()).filter(
      s => s.frontmatter.proficiency?.includes(proficiency)
    );
  }

  /**
   * Search skills by name or description
   */
  search(query: string): LoadedSkill[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.skills.values()).filter(
      s =>
        s.frontmatter.name.toLowerCase().includes(lowerQuery) ||
        s.frontmatter.description.toLowerCase().includes(lowerQuery) ||
        s.frontmatter.proficiency?.some(p => p.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get skill count
   */
  getCount(): number {
    return this.skills.size;
  }

  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear();
  }
}

// Export singleton instance
export const skillRegistry = new SkillRegistry();
