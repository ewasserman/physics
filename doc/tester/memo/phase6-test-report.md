# Phase 6 Test Report — Interactive Perturbations

## Automated Test Results

**Total tests: 466 passed, 0 failed**
**Build: SUCCESS** (`npm run build` completes without errors)

### New Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/viz/interaction-validation.test.ts` | 24 | All pass |
| `tests/sim/perturbation.test.ts` | 17 | All pass |

### Existing Tests
All 425 pre-existing tests continue to pass. No regressions detected.

### Interaction Validation Coverage (`tests/viz/interaction-validation.test.ts`)

**Hit-testing edge cases (7 tests)**
- Point on circle boundary (just inside) returns body
- Point just outside circle boundary returns null
- Overlapping circles: closest body returned
- Empty world returns null
- Static bodies skipped during hit-test
- Point at AABB corner (boundary) returns body
- Overlapping circle + AABB: closest returned

**Force tool (6 tests)**
- Force magnitude scales linearly with drag distance
- Direction correct for negative X drag
- Direction correct for positive Y drag
- Perturbation log records bodyId, force vector, application point, time, step
- Velocity change scales inversely with body mass
- Mousedown miss produces no force or log entry

**Break joint (3 tests)**
- Constraint count decreases by exactly one; correct constraint removed
- Perturbation log records constraintIndex, time, step
- Click far from constraint does nothing

**Drop tool (5 tests)**
- Circle dropped at correct world position
- Box dropped at correct world position
- Circle drop log has correct shape/position/mass/radius
- Box drop log has correct shape/halfWidth/halfHeight
- Multiple drops accumulate in world and log

**Tool switching (4 tests)**
- Perturbation log persists across tool changes
- Switching mid-drag cancels force action (dragState cleared, no velocity change)
- Highlighted constraint cleared when switching from break tool
- All four tools cycle correctly

**Integration (3 tests)**
- Force during live sim: body with upward force is higher than gravity-only after 10 steps
- Break joint on car: constraint count drops, sim continues stable
- Drop circle into running sim: body falls under gravity

### Perturbation Log Coverage (`tests/sim/perturbation.test.ts`)

- Records force, break-joint, and drop-object perturbations
- Records all three types in sequence with correct ordering
- `toJSON()` produces valid, parseable JSON (round-trip via `JSON.stringify`/`JSON.parse`)
- All entries contain required fields: type (string), time (number), step (number), details (object)
- Force details preserve bodyId, force.x/y, point.x/y
- Break details preserve constraintIndex
- Drop details preserve bodyConfig with shape, position, mass, and shape-specific dimensions
- Empty log: `getAll()` returns `[]`, `toJSON()` returns `[]`, stringifies to `"[]"`
- Returned arrays are copies (mutation doesn't affect internal state)

## Manual Checklist

- [ ] Force tool: drag on body shows arrow, release applies impulse
- [ ] Break tool: hover highlights constraint, click removes it
- [ ] Drop tool: click places new object
- [ ] Tool selector UI works
- [ ] Perturbations appear in JSON export
