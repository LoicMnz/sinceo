import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createInstance } from 'i18next'
import { browserLanguage } from '../src/lib/language.ts'
import { formatDate } from '../src/lib/counters.ts'

const fr = JSON.parse(readFileSync(new URL('../src/locales/fr.json', import.meta.url), 'utf8'))
const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'))

function entries(value: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof child === 'string' ? [[path, child]] : Object.entries(entries(child as Record<string, unknown>, path))
  }))
}

test('both languages cover the same strings and interpolation values', () => {
  const french = entries(fr)
  const english = entries(en)
  assert.deepEqual(Object.keys(french).sort(), Object.keys(english).sort())
  for (const key of Object.keys(french)) {
    assert.ok(english[key].trim(), key)
    assert.deepEqual(french[key].match(/{{.*?}}/g)?.sort(), english[key].match(/{{.*?}}/g)?.sort(), key)
  }
})

test('i18next handles plurals, language changes and French fallback', async () => {
  const instance = createInstance()
  await instance.init({ resources: { fr: { translation: fr }, en: { translation: en } }, lng: 'fr', fallbackLng: 'fr' })
  assert.equal(instance.t('days', { count: 1 }), '1 jour')
  assert.equal(instance.t('days', { count: 2 }), '2 jours')
  assert.equal(instance.t('reset.preview', { count: 1 }), 'Le compteur passera à 1 jour.')
  await instance.changeLanguage('en')
  assert.equal(instance.t('days', { count: 0 }), '0 days')
  assert.equal(instance.t('days', { count: 1 }), '1 day')
  assert.equal(instance.t('days', { count: 2 }), '2 days')
  assert.equal(instance.t('card.historyLabel', { name: 'Test', count: 1 }), 'History of Test, 1 reset')
  await instance.changeLanguage('de')
  assert.equal(instance.t('actions.close'), 'Fermer')
})

test('display dates follow the selected language without changing the day', () => {
  assert.equal(formatDate('2026-09-15', 'fr'), '15 septembre 2026')
  assert.equal(formatDate('2026-09-15', 'en'), 'September 15, 2026')
})

test('language detection respects browser preference order and regional variants', () => {
  assert.equal(browserLanguage(['en-US', 'fr-FR']), 'en')
  assert.equal(browserLanguage(['fr-CA', 'en']), 'fr')
  assert.equal(browserLanguage(['de-DE', 'en-GB']), 'en')
  assert.equal(browserLanguage(['EN-us']), 'en')
  assert.equal(browserLanguage(['ja-JP']), 'fr')
  assert.equal(browserLanguage([]), 'fr')
})
