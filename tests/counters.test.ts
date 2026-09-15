import assert from 'node:assert/strict'
import test from 'node:test'
import { createCounter, daysSince, decodeCounters, encodeCounters, resetCounter, today, validDate } from '../src/lib/counters.ts'

test('counts calendar days across daylight-saving changes and leap years', () => {
  assert.equal(daysSince('2026-03-28', '2026-03-30'), 2)
  assert.equal(daysSince('2026-10-24', '2026-10-26'), 2)
  assert.equal(daysSince('2024-02-28', '2024-03-01'), 2)
  assert.equal(daysSince('2026-09-15', '2026-09-15'), 0)
})
test('validates actual dates', () => {
  assert.equal(validDate('2026-02-29'), false)
  assert.equal(validDate('2024-02-29'), true)
  assert.equal(validDate('0000-01-01'), false)
  assert.equal(validDate('2026-13-01'), false)
})
test('retains every reset without mutating the previous counter', () => {
  const original = createCounter({ name: ' Test ', description: '', color: 'sage', startDate: '2020-01-01' })
  const reset = resetCounter(original, today())
  const twice = resetCounter(reset, today())
  assert.equal(original.resets.length, 0)
  assert.equal(twice.resets.length, 2)
  assert.equal(reset.resets[0].previousDate, '2020-01-01')
  assert.equal(reset.startDate, today())
  assert.equal(original.name, 'Test')
  assert.notEqual(twice.resets[0].id, twice.resets[1].id)
  assert.throws(() => resetCounter(original, '2999-01-01'))
  assert.deepEqual(decodeCounters(encodeCounters([twice])), [twice])
})
test('rejects unreadable storage and duplicate identifiers', () => {
  assert.deepEqual(decodeCounters(null), [])
  assert.throws(() => decodeCounters('{invalid'))
  assert.throws(() => decodeCounters('{"version":2,"counters":[]}'))
  assert.throws(() => decodeCounters('{"version":1,"counters":[{}]}'))
  const counter = createCounter({ name: 'Test', description: '', color: 'sage', startDate: today() })
  assert.throws(() => decodeCounters(encodeCounters([counter, counter])))
})
