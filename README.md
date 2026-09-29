# dsh-skill-gate

Hide the model-facing `skill` loader for the agents of the preset that mounts it, so a session can
load a skill only when the user invokes it explicitly.

## What it does

Mounted in an agent preset that also mounts `@deepseek-ai/dsh-tool-skill`, this row removes one
capability from every agent the preset composes:

| Removed | Kept |
|---|---|
| the `skill` tool schema, so the model cannot call a skill on its own | the user's explicit `/name` gesture, which injects the skill body into that step |
| the `<available_skills>` session reminder and its "call the `skill` tool" guidance | the Web `/` skill menu, which reads the session skill catalog over the `skills/list` Remote |

Both removals follow from one `agent.ctx.tools.restrict({ deny: ['skill'] })` per created agent:

- `restrict()` filters what a scope *inherits* and never what its own layer registers. `tool-skill`
  is a row of the same preset, so the `skill` definition sits in the preset's standing scope — this
  row's own layer — where a denial issued from that scope would not reach it. The agent scope is a
  child of the standing scope, so `skill` is inherited there and the denial holds.
- `dsh-tool-skill` publishes its catalog reminder only while the exact definition it registered
  resolves for the calling agent, so hiding the tool suppresses the reminder too.

The user-explicit gesture lives in a different `dsh-tool-skill` listener that reads the skill
registry instead of the tool registry, which is why `/name` keeps working.

## Mount

```yaml
- id: skill-filesystem
  name: '@deepseek-ai/dsh-skill-filesystem'
- id: tool-skill
  name: '@deepseek-ai/dsh-tool-skill'
- id: skill-gate
  name: 'dsh-skill-gate'
```

The row carries no configuration. It is a no-op in a preset that mounts no skill loader.

## Why this is not a bundle

The row belongs inside a preset declaration, and the profile patch that carries that declaration is
applied after every bundle layer. A bundle patch could not contribute the row, and a layer that
contributes nothing else would be noise. The package therefore declares no `dsh.bundle.patch` and is
installed as a plain profile dependency:

From the directory that contains your checkout of this repository:

```sh
dsh plugin --profile web add ./dsh-skill-gate
```

## Known limitations

- **It hides exactly one tool name.** Only `skill` is denied, so a preset that mounts a skill
  loader under a different name is unaffected.
- **It changes what the model can call, not what the user can.** The `/name` gesture and the Web
  `/` skill menu keep working by design, so the gate narrows discovery rather than disabling skills.
- **It relies on pre-stable harness behavior.** Three things: `ctx.tools.restrict` filtering what a
  scope inherits, the `agent/created` event, and `dsh-tool-skill` publishing its catalog reminder
  only while the definition it registered resolves for the caller. A harness change to any of the
  three can change this plugin's effect.
- **A preset that mounts no skill loader needs no gate.** The row reads the agent's inherited view
  and does nothing when `skill` is absent.

## Verification

`node probe.mjs` drives `apply()` against fakes and checks both branches without a Harness.

## Uninstall

```sh
dsh plugin --profile web remove dsh-skill-gate
```

## License

MIT
