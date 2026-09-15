export function browserLanguage(languages: readonly string[]): 'fr' | 'en' {
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0]
    if (base === 'fr' || base === 'en') return base
  }
  return 'fr'
}
