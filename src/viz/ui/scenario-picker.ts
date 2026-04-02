import type { ScenarioCategory } from '../scenarios/types.js';
import type { ScenarioRegistry } from '../scenarios/registry.js';

/** Callback when user clicks a scenario. */
export type ScenarioSelectCallback = (id: string) => void;

/** Controller for the scenario picker sidebar. */
export interface ScenarioPickerController {
  /** Highlight the active scenario button. */
  setActive(id: string): void;
}

/** Pretty labels for categories. */
const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  basics: 'Basics',
  vehicles: 'Vehicles',
  constraints: 'Constraints',
  advanced: 'Advanced',
};

/**
 * Render the scenario picker into the left sidebar.
 */
export function renderScenarioPicker(
  container: HTMLElement,
  registry: ScenarioRegistry,
  onSelect: ScenarioSelectCallback,
): ScenarioPickerController {
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Scenarios';
  container.appendChild(title);

  const buttons = new Map<string, HTMLButtonElement>();

  for (const category of registry.getCategories()) {
    const group = document.createElement('div');
    group.className = 'scenario-category';

    const catLabel = document.createElement('div');
    catLabel.className = 'scenario-category-label';
    catLabel.textContent = CATEGORY_LABELS[category] ?? category;
    group.appendChild(catLabel);

    for (const scenario of registry.getByCategory(category)) {
      const btn = document.createElement('button');
      btn.className = 'scenario-btn';
      btn.textContent = scenario.name;
      btn.title = scenario.description;
      btn.addEventListener('click', () => onSelect(scenario.id));
      group.appendChild(btn);
      buttons.set(scenario.id, btn);
    }

    container.appendChild(group);
  }

  return {
    setActive(id: string) {
      for (const [sid, btn] of buttons) {
        btn.classList.toggle('active', sid === id);
      }
    },
  };
}
