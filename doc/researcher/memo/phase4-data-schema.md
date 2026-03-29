# Phase 4 — AI Training Data Schema Analysis

## 1. State Variables

### Core Per-Body State (record every frame)
| Variable | Type | Rationale |
|---|---|---|
| `id` | integer | Stable identity across frames |
| `position` | `[x, y]` | Primary state; essential for all physics prediction tasks |
| `velocity` | `[vx, vy]` | Needed for dynamics prediction; expensive to finite-difference from positions alone |
| `angle` | float (radians) | Rotational state |
| `angularVelocity` | float | Rotational dynamics |
| `force` | `[fx, fy]` | Net force this step; useful for force-prediction tasks |
| `torque` | float | Net torque this step |

### Static Per-Body Properties (record once in header)
| Variable | Type | Rationale |
|---|---|---|
| `mass` | float | Fundamental for dynamics |
| `inertia` | float | Rotational dynamics |
| `restitution` | float | Collision behavior |
| `friction` | float | Surface interaction |
| `isStatic` | boolean | Boundary vs dynamic object |
| `shape` | see below | Geometry |

### Shape Representation

**Recommendation: Parametric (type + params).** Our engine already uses discriminated unions (`circle`, `polygon`, `aabb`) with parameters. This is compact and sufficient:

```json
{ "type": "circle", "radius": 0.5 }
{ "type": "aabb", "halfWidth": 1.0, "halfHeight": 0.25 }
{ "type": "polygon", "vertices": [[0,0], [1,0], [0.5,1]] }
```

Mesh representations add complexity without benefit for 2D primitives. Parametric is also what PHYRE and CoPhy use for their 2D datasets.

### Derived Quantities

**Recommendation: Include KE, PE, and total momentum as per-frame scene-level summaries. Do NOT include per-body derived quantities.**

Rationale:
- Scene-level energy/momentum serve as **validation signals** (energy conservation, momentum conservation) that are cheap to compute but expensive for downstream models to reconstruct from raw state.
- Per-body KE/PE are trivially computable from `mass + velocity + position + gravity`, so including them wastes space.
- Papers on GNN-based physics (Interaction Networks, DPI-Net) generally work from raw position/velocity and do not use pre-computed per-body energy.

### Contacts

**Recommendation: Record active contacts as a per-frame list.**

```json
"contacts": [
  { "bodyA": 0, "bodyB": 2, "point": [1.2, 0.0], "normal": [0, 1], "impulse": 5.3 }
]
```

Contact information is critical for learning collision dynamics. Without it, models must infer contacts from geometry overlap, which is lossy.

### Constraints

**Recommendation: Record constraint state in the header (type, connected bodies, anchors). Record broken status per-frame only when it changes (event-based).**

## 2. Format Comparison

| Format | Pros | Cons | Parse Speed | Size |
|---|---|---|---|---|
| **JSON** | Human-readable, universal tooling, easy debugging, flexible schema | Verbose (~3-5x binary), slow to parse at scale | Moderate | Large |
| **MessagePack / CBOR** | 30-50% smaller than JSON, fast parse, schema-compatible with JSON | Not human-readable, extra dependency | Fast | Medium |
| **Flat arrays / NumPy `.npz`** | Direct tensor use, minimal overhead, best for ML pipelines | Rigid schema, no metadata inline, hard to inspect | Fastest | Smallest |
| **HDF5** | Hierarchical, supports metadata + arrays, random access | Heavy dependency, overkill for our scale | Fast | Small |

### Recommendation

**Use JSON for the prototype phase.** Reasons:
1. We are building the recording infrastructure; debuggability matters more than throughput.
2. Our scenarios are small (tens of bodies, thousands of frames) — JSON performance is adequate.
3. JSON is trivially parseable in Python (the dominant ML ecosystem) with `json.load()`.

**Migration path to binary:**
- Structure JSON so each frame is an independent object in a top-level array. This maps 1:1 to MessagePack.
- When data volume grows, switch to NDJSON (newline-delimited JSON, one frame per line) for streaming, then to MessagePack with the same schema.
- For tensor pipelines, add a `to_numpy()` converter that reads our JSON and emits `.npz` files with arrays of shape `[T, N, D]` (time, bodies, state-dims).

## 3. Temporal Resolution

### What physics ML papers use
- **PHYRE**: Variable; records keyframes at scene-change boundaries, not fixed-rate.
- **IntPhys**: 15 fps video with aligned state (subsampled from internal sim).
- **CoPhy**: 25 fps video alignment.
- **Interaction Networks (Battaglia et al.)**: 1000 Hz sim, subsampled to 100 Hz for training.
- **DPI-Net**: 100-200 Hz state capture.
- **Graph Network Simulator (Sanchez-Gonzalez et al.)**: Subsample to yield ~1000 steps per trajectory.

### Analysis
Our simulation runs at 60 Hz by default (`dt = 1/60`). With substeps, the effective internal rate can be higher but the state only changes meaningfully at the outer step rate.

- **60 Hz** (every step): Good temporal resolution for learning dynamics. Captures fast events (collisions, bounces) adequately.
- **120 Hz** (2 substeps visible): Overkill for most ML tasks; doubles file size.
- **30 Hz** (every other step): Adequate for slower dynamics but may miss collision details.

### Recommendation

**Default capture rate: 60 Hz (every simulation step).** This matches our `dt` and provides the highest-fidelity recording without artificial interpolation. Offer a configurable `captureInterval` parameter (default 1 = every step, set to 2 for 30 Hz, etc.) for users who want smaller files.

For video alignment, also record a `frameIndex` (monotonically increasing integer) and `timestamp` (float seconds) per frame.

## 4. Metadata

### Scene-Level Metadata (recorded once)

```json
{
  "version": "1.0",
  "scene": {
    "name": "two-cars-colliding",
    "description": "Two cars approaching head-on"
  },
  "physics": {
    "gravity": [0, -9.81],
    "dt": 0.01667,
    "substeps": 1,
    "solverIterations": 8,
    "floorY": 0,
    "damping": 0
  },
  "objects": [
    {
      "id": 0,
      "label": "chassis-left",
      "shape": { "type": "aabb", "halfWidth": 1.0, "halfHeight": 0.25 },
      "mass": 5,
      "restitution": 0.5,
      "friction": 0.6,
      "isStatic": false,
      "compoundId": "car-left"
    }
  ],
  "constraints": [
    {
      "type": "revolute",
      "bodyA": 0,
      "bodyB": 1,
      "anchorA": [-1.5, -0.7],
      "anchorB": [0, 0]
    }
  ],
  "capture": {
    "rate": 60,
    "duration": 10.0,
    "totalFrames": 600
  }
}
```

### Video-Frame Alignment

Each frame carries:
- `frameIndex`: integer, 0-based
- `timestamp`: float seconds since sim start

To align with a rendered video at `V` fps, the consumer computes `videoFrame = floor(timestamp * V)`. No interpolation is needed if the video is rendered at the same rate as capture.

## 5. Comparison to Existing Datasets

### PHYRE (Facebook Research)
- **Format**: Custom binary (Thrift-serialized). State is positions + radii of circles/polygons.
- **Resolution**: Variable; stores initial + final state, plus intermediate keyframes.
- **Strengths**: Task-oriented (goal conditions). Good for RL.
- **Weakness**: No continuous trajectory — hard to train dynamics models.

### IntPhys (Facebook AI / ENS)
- **Format**: Video frames (PNG) + JSON metadata per scene.
- **Resolution**: 15 fps video, ~3s per clip.
- **Strengths**: Vision-focused; tests intuitive physics understanding.
- **Weakness**: No ground-truth state vectors — only pixel data.

### CoPhy (INRIA)
- **Format**: Video frames + extracted object states (position, rotation) as CSV.
- **Resolution**: 25 fps, aligned with video.
- **Strengths**: Multi-modal (vision + state). Good for causal reasoning.
- **Weakness**: Limited object types (blocks, spheres, cylinders).

### ThreeDWorld (MIT-IBM)
- **Format**: HDF5 files with full 3D state + rendered images.
- **Resolution**: Configurable; typically 30-60 fps.
- **Strengths**: Rich 3D environments, multi-modal (vision + audio + haptics).
- **Weakness**: Heavy infrastructure; massive file sizes.

### Graph Network Simulator (DeepMind)
- **Format**: TFRecord with flat arrays. Each example is a full trajectory.
- **State**: Positions + velocities + particle type. No forces or contacts.
- **Resolution**: ~1000 steps per trajectory at variable dt.
- **Strengths**: Directly usable in TF/JAX pipelines. The gold standard for GNN-based physics.
- **Weakness**: Rigid format; hard to add metadata.

### What works well for physics prediction models
1. **Position + velocity per body per timestep** is the minimum viable state.
2. **Object type / shape information** encoded categorically or parametrically.
3. **Contact / edge information** significantly helps GNN-based models.
4. **Scene-level metadata** (gravity, friction coefficients) as context.
5. **Continuous trajectories** (not just keyframes) for autoregressive prediction.

## 6. Proposed Recording Schema

### Top-Level Structure

```json
{
  "meta": { /* scene metadata, physics params, object catalog */ },
  "frames": [
    {
      "frameIndex": 0,
      "timestamp": 0.0,
      "bodies": [
        {
          "id": 0,
          "position": [1.0, 2.5],
          "velocity": [0.5, -1.0],
          "angle": 0.1,
          "angularVelocity": 0.05,
          "force": [0, -49.05],
          "torque": 0
        }
      ],
      "contacts": [
        { "bodyA": 0, "bodyB": 1, "point": [1.2, 0.0], "normal": [0, 1], "impulse": 12.3 }
      ],
      "energy": { "kinetic": 5.2, "potential": 24.5 },
      "momentum": [2.5, -5.0]
    }
  ]
}
```

### Size Model

Per body per frame (JSON): ~180 bytes (id + position + velocity + angle + angularVelocity + force + torque with keys and formatting).

Per contact per frame: ~100 bytes.

Per frame overhead (frameIndex, timestamp, energy, momentum, array delimiters): ~120 bytes.

Formula: `fileSize ≈ headerSize + numFrames * (120 + numBodies * 180 + avgContacts * 100)`
