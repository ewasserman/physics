import type { ScenarioDescriptor, ScenarioCategory } from './types.js';

/** Central registry for all scenarios. */
export class ScenarioRegistry {
  private scenarios = new Map<string, ScenarioDescriptor>();

  /** Register a scenario. Throws if id is already taken. */
  register(descriptor: ScenarioDescriptor): void {
    if (this.scenarios.has(descriptor.id)) {
      throw new Error(`Scenario "${descriptor.id}" is already registered`);
    }
    this.scenarios.set(descriptor.id, descriptor);
  }

  /** Get a scenario by id. Returns undefined if not found. */
  get(id: string): ScenarioDescriptor | undefined {
    return this.scenarios.get(id);
  }

  /** Get all registered scenarios. */
  getAll(): ScenarioDescriptor[] {
    return Array.from(this.scenarios.values());
  }

  /** Get all unique categories (in insertion order). */
  getCategories(): ScenarioCategory[] {
    const seen = new Set<ScenarioCategory>();
    const result: ScenarioCategory[] = [];
    for (const s of this.scenarios.values()) {
      if (!seen.has(s.category)) {
        seen.add(s.category);
        result.push(s.category);
      }
    }
    return result;
  }

  /** Get all scenarios in a given category. */
  getByCategory(category: ScenarioCategory): ScenarioDescriptor[] {
    return this.getAll().filter(s => s.category === category);
  }
}

/** Singleton registry instance. */
export const registry = new ScenarioRegistry();
