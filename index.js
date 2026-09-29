/**
 * dsh-skill-gate — hide the model-facing `skill` loader for the agents of the
 * preset that mounts it.
 *
 * Contract: after this row is mounted in a preset that also mounts
 * `@deepseek-ai/dsh-tool-skill`, no agent of that preset can discover or call a
 * skill on its own. Loading stays available only through the user's explicit
 * `/name` gesture, which `dsh-tool-skill` serves from a separate listener that
 * consults the skill registry rather than the tool registry.
 *
 * Two harness facts make one `restrict()` call sufficient, and both are load
 * bearing:
 *
 * - `ctx.tools.restrict()` filters what a scope INHERITS and never what its own
 *   layer registers. This row and `tool-skill` are rows of the same preset, so
 *   the `skill` definition registers into the preset's standing scope — this
 *   row's own layer. A denial issued from that scope would not touch it, and
 *   `restrict()` would reject the name as unknown. The agent scope is a child of
 *   the standing scope, so `skill` is inherited there and the same denial holds.
 * - `dsh-tool-skill` publishes its `<available_skills>` reminder only while the
 *   exact definition it registered resolves for the calling agent. Hiding the
 *   tool is therefore what suppresses the catalog, including its "call the
 *   `skill` tool" guidance.
 *
 * @module dsh-skill-gate
 */

/** Cordis plugin name. */
export const name = 'skill-gate'

/** Services this plugin reads. */
export const inject = ['tools']

/** The model-facing skill loader this row hides. */
const SKILL_TOOL_NAME = 'skill'

/**
 * Hide the skill loader for every agent this preset composes.
 * @param ctx - the preset's standing scope, which receives the preset's agents' scoped events.
 */
export function apply(ctx) {
  ctx.on('agent/created', ({ agent }) => {
    // Read the agent's own view instead of denying a fixed name: a preset that
    // mounts no skill loader has nothing to hide, and `restrict()` rejects a
    // name absent from the inherited set.
    const visible = ctx.tools.schemas(agent).some(schema => schema.name === SKILL_TOOL_NAME)
    if (!visible) return
    agent.ctx.tools.restrict({ deny: [SKILL_TOOL_NAME] })
  })
}
