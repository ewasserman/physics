import type { Simulation } from '../../sim/simulation.js';

/** A single tunable parameter descriptor. */
export type ParamDescriptor =
  | NumberParam
  | IntegerParam
  | BooleanParam
  | EnumParam
  | Vec2Param;

export interface NumberParam {
  type: 'number';
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface IntegerParam {
  type: 'integer';
  label: string;
  default: number;
  min?: number;
  max?: number;
}

export interface BooleanParam {
  type: 'boolean';
  label: string;
  default: boolean;
}

export interface EnumParam {
  type: 'enum';
  label: string;
  default: string;
  options: string[];
}

export interface Vec2Param {
  type: 'vec2';
  label: string;
  default: { x: number; y: number };
  min?: { x: number; y: number };
  max?: { x: number; y: number };
  step?: { x: number; y: number };
}

/** A group of related parameters. */
export interface ParamGroup {
  label: string;
  params: Record<string, ParamDescriptor>;
}

/** Full parameter schema for a scenario. */
export type ParamSchema = ParamGroup[];

/** Camera hint for initial framing. */
export interface CameraHint {
  /** Use 'auto' to auto-fit all bodies, or 'manual' with cx/cy/zoom. */
  mode: 'auto' | 'manual';
  cx?: number;
  cy?: number;
  zoom?: number;
}

/** Category for grouping scenarios in the picker. */
export type ScenarioCategory = 'basics' | 'vehicles' | 'constraints' | 'advanced';

/** A registered scenario descriptor. */
export interface ScenarioDescriptor {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  /** Parameter schema defines what the user can tune. */
  params: ParamSchema;
  /** Camera hint for initial framing. */
  camera?: CameraHint;
  /** Create the simulation from the current parameter values. */
  setup: (values: Record<string, any>) => Simulation;
}
