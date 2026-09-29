/**
 * Offline probe for dsh-skill-gate: drives `apply()` against fakes and checks the
 * restriction it issues for one created agent. Run with `node probe.mjs`.
 */

import assert from 'node:assert/strict'
import { apply, inject, name } from './index.js'

/** A fake preset context recording the `agent/created` listener it receives. */
function fakeCtx(toolNames) {
  const listeners = new Map()
  return {
    listeners,
    tools: { schemas: () => toolNames.map(toolName => ({ name: toolName })) },
    on(event, listener) {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
  }
}

/** A fake agent recording the restrictions applied to its own scope. */
function fakeAgent() {
  const restrictions = []
  return {
    restrictions,
    ctx: { tools: { restrict: filter => restrictions.push(filter) } },
  }
}

assert.equal(name, 'skill-gate')
assert.deepEqual(inject, ['tools'])

{
  const ctx = fakeCtx(['pwsh', 'skill', 'web'])
  apply(ctx)
  assert.deepEqual([...ctx.listeners.keys()], ['agent/created'])
  const agent = fakeAgent()
  ctx.listeners.get('agent/created')({ agent })
  assert.deepEqual(agent.restrictions, [{ deny: ['skill'] }])
}

{
  const ctx = fakeCtx(['pwsh', 'web'])
  apply(ctx)
  const agent = fakeAgent()
  ctx.listeners.get('agent/created')({ agent })
  assert.deepEqual(agent.restrictions, [])
}

console.log('dsh-skill-gate probe: ok')
