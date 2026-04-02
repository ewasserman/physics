---
status: done
from: pm
to: developer
date: 2026-04-02
subject: Add angular limits to distance constraints
---

# Add Angular Limits to Distance Constraints

## Context

The chain fountain demo models bead chains — spherical shells connected by short rigid wires through their centers. In a real bead chain, the wire can only pivot ~±45° from normal to the bead's surface at the attachment point. Without this limit, beads can swing freely 360° around each other, causing unphysical kinking at serpentine corners.

## What to implement

Add an optional `maxAngle` field to `DistanceConstraint` that limits the angle between:
- The **surface normal** at the anchor point (= direction from bead center to anchor, in world space)
- The **wire direction** (= direction from this anchor to the other anchor, in world space)

When the angle exceeds `maxAngle`, apply a corrective impulse to push it back within limits.

### In 2D terms

For bodyA with anchorA:
- `normalA` = world-space direction from bodyA.position to anchorA world position (i.e., the rotated local anchor, normalized)
- `wireDir` = direction from anchorA world position to anchorB world position (normalized)
- `angle = acos(normalA · wireDir)` — this is the angle between the surface normal and the wire
- If `angle > maxAngle`, apply a corrective angular impulse to bodyA (and corresponding reaction to bodyB)

Same check for bodyB with anchorB (using the reverse wire direction).

### Files to modify

1. `src/core/constraint.ts` — add optional `maxAngle?: number` to `DistanceConstraint` and `CreateDistanceConstraintOptions`
2. `src/physics/constraints.ts` — in `solveDistanceVelocity()` and/or `solveDistancePosition()`, add angle limit enforcement after the existing distance correction
3. `src/viz/scenarios/chain-fountain.ts` — pass `maxAngle: Math.PI / 4` (45°) in the distance constraint creation

### Approach

The angle limit is a unilateral constraint (only active when violated). When the angle exceeds the limit:

**Position level:** Rotate the body so the anchor-to-anchor direction falls within the cone. Only correct the violating body (the one whose normal is out of range).

**Velocity level:** Project out the angular velocity component that would increase the violation. Compute the angular velocity that would be needed to keep the angle at exactly `maxAngle`, and clamp to that.

Keep it simple — a basic position correction that rotates the body when the angle is exceeded should be sufficient for visual plausibility. We don't need a full Lagrangian treatment.

### Default

If `maxAngle` is undefined, no angular limit is applied (backward compatible).

## Branch

Work on the current branch (developer/ui-overhaul or main, check with PM).

## Tests

- Add a test that creates two bodies with a distance constraint + maxAngle, starts them at an angle exceeding the limit, and verifies the angle is corrected within a few steps
- Existing tests must pass
- Do NOT commit — just make the changes
