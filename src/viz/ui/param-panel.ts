import type { ParamSchema, ParamDescriptor } from '../scenarios/types.js';

/** Callback fired whenever any parameter value changes. */
export type ParamChangeCallback = (values: Record<string, any>) => void;

/**
 * Render the parameter panel into the given container.
 * Returns helpers to get/set values and listen for changes.
 */
export function renderParamPanel(
  container: HTMLElement,
  schema: ParamSchema,
  onChange: ParamChangeCallback,
  onRestart?: () => void,
): ParamPanelController {
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Parameters';
  container.appendChild(title);

  // Collect all defaults and build control refs
  const values: Record<string, any> = {};
  const defaults: Record<string, any> = {};
  const setters: Record<string, (v: any) => void> = {};

  for (const group of schema) {
    const details = document.createElement('details');
    details.className = 'param-group';
    details.open = true;

    const summary = document.createElement('summary');
    summary.textContent = group.label;
    details.appendChild(summary);

    for (const [key, desc] of Object.entries(group.params)) {
      defaults[key] = desc.default;
      values[key] = desc.default;

      const row = document.createElement('div');
      row.className = 'param-row';

      const label = document.createElement('span');
      label.className = 'param-label';
      label.textContent = desc.label;
      row.appendChild(label);

      const setter = buildControl(row, key, desc, values, () => onChange(getValues()));
      setters[key] = setter;

      details.appendChild(row);
    }

    container.appendChild(details);
  }

  // Button row
  const btnRow = document.createElement('div');
  btnRow.className = 'param-btn-row';

  // Restart button — re-runs sim with current params
  const restartBtn = document.createElement('button');
  restartBtn.className = 'restart-btn';
  restartBtn.textContent = 'Restart';
  restartBtn.addEventListener('click', () => {
    if (onRestart) onRestart();
    else onChange(getValues());
  });
  btnRow.appendChild(restartBtn);

  // Reset to Defaults button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.textContent = 'Reset to Defaults';
  resetBtn.addEventListener('click', () => {
    for (const [key, def] of Object.entries(defaults)) {
      values[key] = def;
      if (setters[key]) setters[key](def);
    }
    onChange(getValues());
  });
  btnRow.appendChild(resetBtn);

  container.appendChild(btnRow);

  function getValues(): Record<string, any> {
    return { ...values };
  }

  return {
    getValues,
    setValues(v: Record<string, any>) {
      for (const [key, val] of Object.entries(v)) {
        values[key] = val;
        if (setters[key]) setters[key](val);
      }
    },
  };
}

export interface ParamPanelController {
  getValues(): Record<string, any>;
  setValues(v: Record<string, any>): void;
}

// --- Helpers ---

function buildControl(
  row: HTMLElement,
  key: string,
  desc: ParamDescriptor,
  values: Record<string, any>,
  notify: () => void,
): (v: any) => void {
  const control = document.createElement('div');
  control.className = 'param-control';

  switch (desc.type) {
    case 'number':
    case 'integer': {
      const range = document.createElement('input');
      range.type = 'range';
      range.min = String(desc.min ?? 0);
      range.max = String(desc.max ?? 100);
      range.step = desc.type === 'integer' ? '1' : String((desc as any).step ?? 0.01);
      range.value = String(desc.default);

      const num = document.createElement('input');
      num.type = 'number';
      num.min = range.min;
      num.max = range.max;
      num.step = range.step;
      num.value = String(desc.default);

      range.addEventListener('input', () => {
        const v = desc.type === 'integer' ? parseInt(range.value, 10) : parseFloat(range.value);
        num.value = String(v);
        values[key] = v;
        notify();
      });

      num.addEventListener('input', () => {
        const v = desc.type === 'integer' ? parseInt(num.value, 10) : parseFloat(num.value);
        range.value = String(v);
        values[key] = v;
        notify();
      });

      control.appendChild(range);
      control.appendChild(num);
      row.appendChild(control);

      return (v: any) => {
        range.value = String(v);
        num.value = String(v);
      };
    }

    case 'boolean': {
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = desc.default;

      check.addEventListener('change', () => {
        values[key] = check.checked;
        notify();
      });

      control.appendChild(check);
      row.appendChild(control);

      return (v: any) => {
        check.checked = !!v;
      };
    }

    case 'enum': {
      const select = document.createElement('select');
      for (const opt of desc.options) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === desc.default) option.selected = true;
        select.appendChild(option);
      }

      select.addEventListener('change', () => {
        values[key] = select.value;
        notify();
      });

      control.appendChild(select);
      row.appendChild(control);

      return (v: any) => {
        select.value = String(v);
      };
    }

    case 'vec2': {
      const vec2Div = document.createElement('div');
      vec2Div.className = 'param-vec2';

      const xLabel = document.createElement('label');
      xLabel.textContent = 'X';
      const xInput = document.createElement('input');
      xInput.type = 'number';
      xInput.value = String(desc.default.x);
      xInput.step = String(desc.step?.x ?? 0.1);
      if (desc.min) xInput.min = String(desc.min.x);
      if (desc.max) xInput.max = String(desc.max.x);
      xLabel.appendChild(xInput);

      const yLabel = document.createElement('label');
      yLabel.textContent = 'Y';
      const yInput = document.createElement('input');
      yInput.type = 'number';
      yInput.value = String(desc.default.y);
      yInput.step = String(desc.step?.y ?? 0.1);
      if (desc.min) yInput.min = String(desc.min.y);
      if (desc.max) yInput.max = String(desc.max.y);
      yLabel.appendChild(yInput);

      const update = () => {
        values[key] = { x: parseFloat(xInput.value), y: parseFloat(yInput.value) };
        notify();
      };

      xInput.addEventListener('input', update);
      yInput.addEventListener('input', update);

      vec2Div.appendChild(xLabel);
      vec2Div.appendChild(yLabel);
      control.appendChild(vec2Div);
      row.appendChild(control);

      return (v: any) => {
        xInput.value = String(v.x);
        yInput.value = String(v.y);
      };
    }
  }
}
