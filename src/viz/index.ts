export { CanvasRenderer, type RendererConfig } from './renderer.js';
export { PlaybackController, type FrameCallback } from './playback.js';
export { LiveSimulation } from './live.js';
export { createApp, type App } from './app.js';
export {
  InteractionTool,
  InteractionManager,
  type DropObjectType,
  type InteractionConfig,
} from './interaction.js';
export { registry } from './scenarios/index.js';
export type { ScenarioDescriptor, ParamSchema, ParamGroup, ParamDescriptor } from './scenarios/types.js';
