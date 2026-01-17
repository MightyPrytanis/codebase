/*
 * SkillLoader
 * Loads markdown-based skills with YAML frontmatter from .cursor/skills or Cyrano/src/skills.
 * Keeps zero external dependencies: simple frontmatter parser.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Skill, SkillFrontmatter, LoadedSkill } from './base-skill.js';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

export class SkillLoader {
  constructor(
    private skillRoots: string[] = [
      path.resolve('.cursor/skills'),
      path.resolve('.claude/skills'),
      path.resolve('Cyrano/src/skills'),
    ],
  ) {}

  /**
   * Load all skills from configured roots
   */
  async loadAll(): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = [];
    for (const root of this.skillRoots) {
      const exists = await this.exists(root);
      if (!exists) continue;
      const files = await this.walkMarkdown(root);
      for (const file of files) {
        const loaded = await this.loadFromFile(file);
        if (loaded) skills.push(loaded);
      }
    }
    return skills;
  }

  /**
   * Load a single skill file
   */
  async loadFromFile(filePath: string): Promise<LoadedSkill | null> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { frontmatter, body } = this.parseFrontmatter(content);
      if (!frontmatter.name || !frontmatter.description || !frontmatter.version) {
        throw new Error('Skill frontmatter missing required fields (name, description, version)');
      }

      const skill: Skill = {
        name: frontmatter.name,
        description: frontmatter.description,
        version: frontmatter.version,
        tools: [],
        resources: [],
        prompts: [],
        frontmatter,
        content: body,
        skillId: this.skillIdFromPath(filePath, frontmatter),
      };

      return { skill, frontmatter };
    } catch (error) {
      console.warn(`Failed to load skill from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Basic frontmatter parser (YAML subset: key: value, arrays with '-')
   */
  private parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
      throw new Error('Skill file missing frontmatter');
    }
    const yaml = match[1];
    const body = content.slice(match[0].length);
    const frontmatter = this.parseYaml(yaml) as SkillFrontmatter;
    return { frontmatter, body };
  }

  /**
   * Minimal YAML parser sufficient for simple frontmatter
   * Handles nested objects (for input_schema, output_schema, etc.)
   */
  private parseYaml(yaml: string): Record<string, any> {
    const lines = yaml.split('\n');
    const result: Record<string, any> = {};
    let currentKey: string | null = null;
    const indentStack: { key: string; indent: number }[] = [];
    
    for (const rawLine of lines) {
      const line = rawLine;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const indent = line.length - line.trimStart().length;
      
      // Handle array items
      if (trimmed.startsWith('-')) {
        const value = trimmed.replace(/^-+\s?/, '').trim();
        if (currentKey) {
          if (!Array.isArray(result[currentKey])) {
            result[currentKey] = [];
          }
          (result[currentKey] as any[]).push(this.castValue(value));
        }
        continue;
      }
      
      // Handle key-value pairs
      if (trimmed.includes(':')) {
        // Pop indent stack until we're at the right level
        while (indentStack.length > 0 && indentStack[indentStack.length - 1].indent >= indent) {
          indentStack.pop();
        }
        
        const [key, ...rest] = trimmed.split(':');
        const value = rest.join(':').trim();
        const fullKey = key.trim();
        
        // Build nested path
        let target = result;
        for (const { key: parentKey } of indentStack) {
          if (!target[parentKey]) target[parentKey] = {};
          target = target[parentKey];
        }
        
        currentKey = fullKey;
        
        if (value) {
          target[fullKey] = this.castValue(value);
        } else {
          // Start nested object
          target[fullKey] = {};
          indentStack.push({ key: fullKey, indent });
        }
      } else if (currentKey && indent > 0) {
        // Continuation line (multiline string or nested content)
        let target = result;
        for (const { key: parentKey } of indentStack) {
          target = target[parentKey];
        }
        
        const existing = target[currentKey];
        if (Array.isArray(existing)) {
          existing[existing.length - 1] = `${existing[existing.length - 1]}\n${trimmed}`;
        } else if (typeof existing === 'string') {
          target[currentKey] = `${existing}\n${trimmed}`;
        } else if (typeof existing === 'object' && existing !== null) {
          // Nested object continuation - skip for now (complex)
        }
      }
    }
    
    return result;
  }

  private castValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    return value;
  }

  private skillIdFromPath(filePath: string, frontmatter: SkillFrontmatter): string {
    const base = path.basename(filePath, path.extname(filePath));
    return `${frontmatter.domain || 'general'}:${base}`;
  }

  private async exists(p: string): Promise<boolean> {
    try {
      await fs.stat(p);
      return true;
    } catch {
      return false;
    }
  }

  private async walkMarkdown(root: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) {
        const sub = await this.walkMarkdown(full);
        results.push(...sub);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(full);
      }
    }
    return results;
