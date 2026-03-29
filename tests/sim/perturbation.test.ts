import { describe, it, expect } from 'vitest';
import { PerturbationLog } from '../../src/sim/perturbation.js';
import type { Perturbation, ForceDetails, BreakDetails, DropDetails } from '../../src/sim/perturbation.js';

describe('PerturbationLog', () => {
  describe('recording entries', () => {
    it('should record a force perturbation', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 1.0,
        step: 60,
        details: { bodyId: 0, force: { x: 100, y: 0 }, point: { x: 0, y: 0 } },
      });

      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('force');
    });

    it('should record a break-joint perturbation', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'break-joint',
        time: 2.5,
        step: 150,
        details: { constraintIndex: 3 },
      });

      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('break-joint');
    });

    it('should record a drop-object perturbation', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'drop-object',
        time: 0.5,
        step: 30,
        details: {
          bodyConfig: {
            shape: 'circle',
            position: { x: 1, y: 2 },
            mass: 1,
            radius: 0.5,
          },
        },
      });

      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('drop-object');
    });

    it('should record all three types in sequence', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 0.1,
        step: 6,
        details: { bodyId: 0, force: { x: 50, y: 0 }, point: { x: 0, y: 0 } },
      });
      log.add({
        type: 'break-joint',
        time: 0.5,
        step: 30,
        details: { constraintIndex: 0 },
      });
      log.add({
        type: 'drop-object',
        time: 1.0,
        step: 60,
        details: {
          bodyConfig: {
            shape: 'box',
            position: { x: 3, y: 4 },
            mass: 1,
            halfWidth: 0.5,
            halfHeight: 0.5,
          },
        },
      });

      const entries = log.getAll();
      expect(entries.length).toBe(3);
      expect(entries[0].type).toBe('force');
      expect(entries[1].type).toBe('break-joint');
      expect(entries[2].type).toBe('drop-object');
    });
  });

  describe('toJSON()', () => {
    it('should produce valid parseable JSON', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 1.5,
        step: 90,
        details: { bodyId: 2, force: { x: 100, y: -50 }, point: { x: 3, y: 4 } },
      });

      const json = log.toJSON();
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].type).toBe('force');
    });

    it('should include all required fields on every entry', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 1.0,
        step: 60,
        details: { bodyId: 0, force: { x: 10, y: 20 }, point: { x: 0, y: 0 } },
      });
      log.add({
        type: 'break-joint',
        time: 2.0,
        step: 120,
        details: { constraintIndex: 1 },
      });
      log.add({
        type: 'drop-object',
        time: 3.0,
        step: 180,
        details: {
          bodyConfig: {
            shape: 'circle',
            position: { x: 5, y: 5 },
            mass: 2,
            radius: 1,
          },
        },
      });

      const json = log.toJSON();
      for (const entry of json) {
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('time');
        expect(entry).toHaveProperty('step');
        expect(entry).toHaveProperty('details');
        expect(typeof entry.type).toBe('string');
        expect(typeof entry.time).toBe('number');
        expect(typeof entry.step).toBe('number');
        expect(typeof entry.details).toBe('object');
      }
    });

    it('should produce correct force details in JSON', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 0.5,
        step: 30,
        details: { bodyId: 5, force: { x: 42, y: -13 }, point: { x: 1, y: 2 } },
      });

      const json = log.toJSON();
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str) as Perturbation[];
      const details = parsed[0].details as ForceDetails;

      expect(details.bodyId).toBe(5);
      expect(details.force.x).toBe(42);
      expect(details.force.y).toBe(-13);
      expect(details.point.x).toBe(1);
      expect(details.point.y).toBe(2);
    });

    it('should produce correct break details in JSON', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'break-joint',
        time: 1.0,
        step: 60,
        details: { constraintIndex: 7 },
      });

      const json = log.toJSON();
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str) as Perturbation[];
      const details = parsed[0].details as BreakDetails;

      expect(details.constraintIndex).toBe(7);
    });

    it('should produce correct drop details in JSON', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'drop-object',
        time: 2.0,
        step: 120,
        details: {
          bodyConfig: {
            shape: 'box',
            position: { x: 10, y: 20 },
            mass: 3,
            halfWidth: 1,
            halfHeight: 2,
          },
        },
      });

      const json = log.toJSON();
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str) as Perturbation[];
      const details = parsed[0].details as DropDetails;

      expect(details.bodyConfig.shape).toBe('box');
      expect(details.bodyConfig.position.x).toBe(10);
      expect(details.bodyConfig.position.y).toBe(20);
      expect(details.bodyConfig.mass).toBe(3);
      expect(details.bodyConfig.halfWidth).toBe(1);
      expect(details.bodyConfig.halfHeight).toBe(2);
    });
  });

  describe('empty log', () => {
    it('should return empty array from getAll() when no entries', () => {
      const log = new PerturbationLog();
      expect(log.getAll()).toEqual([]);
    });

    it('should return empty array from toJSON() when no entries', () => {
      const log = new PerturbationLog();
      expect(log.toJSON()).toEqual([]);
    });

    it('should produce valid JSON string from empty log', () => {
      const log = new PerturbationLog();
      const str = JSON.stringify(log.toJSON());
      expect(str).toBe('[]');
      const parsed = JSON.parse(str);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });

  describe('immutability', () => {
    it('should not allow mutation of returned entries via getAll()', () => {
      const log = new PerturbationLog();
      log.add({
        type: 'force',
        time: 1.0,
        step: 60,
        details: { bodyId: 0, force: { x: 10, y: 0 }, point: { x: 0, y: 0 } },
      });

      const entries = log.getAll();
      entries.length = 0; // mutate the returned array

      // Original should be unaffected
      expect(log.getAll().length).toBe(1);
    });
  });
});
