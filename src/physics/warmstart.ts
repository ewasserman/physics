import { Contact } from './collision.js';

/**
 * Contact warm-starting cache.
 * Stores accumulated impulses from the previous frame keyed by body pair.
 * Applying cached impulses at the start of solver iterations dramatically
 * improves stacking convergence and stability.
 */
export class ContactCache {
  private cache: Map<number, number> = new Map();

  /** Generate a unique numeric key for a body pair. */
  private pairKey(idA: number, idB: number): number {
    const lo = Math.min(idA, idB);
    const hi = Math.max(idA, idB);
    return lo * 100000 + hi;
  }

  /**
   * Store solved impulses for a set of contacts.
   * Called after the solver finishes each frame.
   */
  store(contacts: Contact[], impulses: number[]): void {
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const bId = c.bodyB ? c.bodyB.id : -1;
      const key = this.pairKey(c.bodyA.id, bId);
      this.cache.set(key, impulses[i]);
    }
  }

  /**
   * Retrieve cached impulse for a body pair.
   * Returns 0 if no cached impulse exists.
   */
  retrieve(bodyAId: number, bodyBId: number): number {
    const key = this.pairKey(bodyAId, bodyBId);
    return this.cache.get(key) ?? 0;
  }

  /** Clear the cache. Called at the start of each frame before new contacts. */
  clear(): void {
    this.cache.clear();
  }
}
