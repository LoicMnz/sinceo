import assert from 'node:assert/strict'
import test from 'node:test'
import { createCounter, decodeCounters, encodeCounters, resetCounter, today } from '../src/lib/counters.ts'

test('export payload is versioned JSON and round-trips counters with their history', () => {
  const created = createCounter({ name: 'Habitude', description: 'Un jour à la fois', color: 'sage', startDate: '2024-01-10' })
  const withHistory = resetCounter(created, '2024-02-01')
  const payload = encodeCounters([withHistory])
  const parsed: unknown = JSON.parse(payload)

  assert.deepEqual(parsed, { version: 1, counters: [withHistory] })
  assert.deepEqual(decodeCounters(payload), [withHistory])
})

test('an empty export is a valid backup', () => {
  assert.equal(encodeCounters([]), '{"version":1,"counters":[]}')
  assert.deepEqual(decodeCounters(encodeCounters([])), [])
})

test('import rejects malformed, future-dated and structurally unsafe backups', () => {
  const counter = createCounter({ name: 'Test', description: '', color: 'peach', startDate: today() })
  const valid = JSON.parse(encodeCounters([counter])) as { version: number; counters: Array<Record<string, unknown>> }

  const cases = [
    { ...valid, version: 2 },
    { ...valid, counters: [{ ...valid.counters[0], startDate: '2999-01-01' }] },
    { ...valid, counters: [{ ...valid.counters[0], resets: [{ id: 'reset', previousDate: today(), date: '2999-01-01', recordedAt: new Date().toISOString() }] }] },
    { ...valid, counters: [{ ...valid.counters[0], name: '   ' }] },
    { ...valid, counters: [{ ...valid.counters[0], color: 'neon' }] },
    { ...valid, counters: [{ ...valid.counters[0], resets: 'not-an-array' }] },
  ]

  for (const value of cases) assert.throws(() => decodeCounters(JSON.stringify(value)))
  assert.throws(() => decodeCounters('not-json'))
})

test('import preserves distinct counter and reset identifiers', () => {
  const first = createCounter({ name: 'Premier', description: '', color: 'lavender', startDate: '2024-01-01' })
  const second = createCounter({ name: 'Second', description: '', color: 'sand', startDate: '2024-02-01' })
  const imported = decodeCounters(encodeCounters([resetCounter(first, '2024-01-15'), second]))

  assert.equal(imported.length, 2)
  assert.notEqual(imported[0].id, imported[1].id)
  assert.equal(imported[0].resets.length, 1)
  assert.notEqual(imported[0].resets[0].id, imported[0].id)
})
