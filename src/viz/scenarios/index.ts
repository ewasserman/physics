// Import all scenarios to trigger self-registration.
import './bouncing.js';
import './car-crash.js';
import './rain.js';
import './double-pendulum.js';
import './chain.js';
import './chain-fountain.js';

// Re-export registry for convenience.
export { registry } from './registry.js';
export type { ScenarioDescriptor, ParamSchema, ParamGroup, ParamDescriptor, CameraHint, ScenarioCategory } from './types.js';
