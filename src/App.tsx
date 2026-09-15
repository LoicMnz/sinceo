import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from './useTheme'
import { colors, createCounter, daysSince, decodeCounters, encodeCounters, formatDate, resetCounter, STORAGE_KEY, today, validDate } from './lib/counters'
import type { Color, Counter, CounterDraft } from './lib/counters'
import './App.css'

type ModalState = { kind: 'create' } | { kind: 'edit' | 'reset' | 'delete' | 'history'; counter: Counter }
const colorSymbols: Record<Color, string> = { sage: '✳', peach: '☀', lavender: '✦', sand: '◈' }

function Icon({ name }: { name: 'plus' | 'reset' | 'edit' | 'close' | 'calendar' | 'trash' | 'arrow' | 'sun' | 'moon' }) {
  const paths = {
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    moon: 'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',
    plus: 'M12 5v14M5 12h14',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    edit: 'm16 3 5 5-12 12H4v-5L16 3Zm-2 2 5 5',
    close: 'm6 6 12 12M6 18 18 6',
    calendar: 'M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    // Focus the heading so opening a mobile sheet does not summon the keyboard.
    dialog.querySelector<HTMLElement>('h2')?.focus()
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = previousOverflow }
  }, [])
  return (
    <dialog ref={ref} aria-labelledby="dialog-title" onCancel={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="dialog-heading">
        <h2 id="dialog-title" tabIndex={-1}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label={t('actions.close')}><Icon name="close" /></button>
      </div>
      {children}
    </dialog>
  )
}

function CounterForm({ counter, onSave, onClose }: { counter?: Counter; onSave: (data: CounterDraft) => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState(counter?.name ?? '')
  const [description, setDescription] = useState(counter?.description ?? '')
  const [date, setDate] = useState(counter?.startDate ?? today())
  const [color, setColor] = useState<Color>(counter?.color ?? 'sage')
  const [error, setError] = useState('')
  return (
    <form onSubmit={event => {
      event.preventDefault()
      const submittedDate = counter?.startDate ?? String(new FormData(event.currentTarget).get('startDate') ?? '')
      if (!name.trim()) { setError('errors.name'); return }
      if (!counter && (!validDate(submittedDate) || submittedDate > today())) { setError('errors.date'); return }
      onSave({ name: name.trim(), description: description.trim(), startDate: submittedDate, color })
    }}>
      <p className="dialog-intro">{t(counter ? 'form.introEdit' : 'form.introCreate')}</p>
      <label>{t('form.name')}
        <input required maxLength={80} placeholder={t('form.namePlaceholder')} value={name} onChange={event => setName(event.target.value)} />
      </label>
      <label>{t('form.description')} <span className="optional">{t('form.optional')}</span>
        <textarea maxLength={240} rows={2} placeholder={t('form.descriptionPlaceholder')} value={description} onChange={event => setDescription(event.target.value)} />
      </label>
      {!counter && <>
      <label>{t('form.date')}
        <input type="date" name="startDate" required min="0001-01-01" max={today()} value={date} onInput={event => setDate(event.currentTarget.value)} onChange={event => setDate(event.target.value)} />
      </label>
      <p className="field-help">{t('form.dayZero')}</p>
      </>}
      <fieldset>
        <legend>{t('form.color')}</legend>
        <div className="color-options">{colors.map(item => (
          <label key={item} className={`color-option ${item}`}>
            <input type="radio" name="color" value={item} checked={color === item} onChange={() => setColor(item)} />
            <span>{colorSymbols[item]} {t(`colors.${item}`)}</span>
          </label>
        ))}</div>
      </fieldset>
      {error && <p role="alert" className="error">{t(error)}</p>}
      <div className="dialog-actions">
        <button type="button" className="button secondary" onClick={onClose}>{t('actions.cancel')}</button>
        <button className="button primary" type="submit">{t(counter ? 'actions.save' : 'actions.submit')}<Icon name="arrow" /></button>
      </div>
    </form>
  )
}

function ResetForm({ counter, onReset, onClose }: { counter: Counter; onReset: (date: string) => void; onClose: () => void }) {
  const { t } = useTranslation()
  const [date, setDate] = useState(today())
  const [error, setError] = useState('')
  return (
    <form onSubmit={event => {
      event.preventDefault()
      const submittedDate = String(new FormData(event.currentTarget).get('startDate') ?? '')
      if (!validDate(submittedDate) || submittedDate > today()) { setError('errors.date'); return }
      onReset(submittedDate)
    }}>
      <p className="dialog-intro">{t('reset.intro', { name: counter.name })}</p>
      <label>{t('reset.date')}
        <input type="date" name="startDate" min="0001-01-01" max={today()} required value={date} onInput={event => setDate(event.currentTarget.value)} onChange={event => setDate(event.target.value)} />
      </label>
      <p className="reset-preview">{validDate(date) ? t('reset.preview', { count: daysSince(date) }) : t('reset.chooseDate')}</p>
      {error && <p role="alert" className="error">{t(error)}</p>}
      <div className="dialog-actions">
        <button type="button" className="button secondary" onClick={onClose}>{t('actions.cancel')}</button>
        <button className="button primary" type="submit"><Icon name="reset" />{t('actions.reset')}</button>
      </div>
    </form>
  )
}

function CounterCard({ counter, currentDay, onAction }: { counter: Counter; currentDay: string; onAction: (modal: ModalState) => void }) {
  const { t, i18n } = useTranslation()
  const days = daysSince(counter.startDate, currentDay)
  return (
    <article className={`counter-card ${counter.color}`}>
      <div className="card-top">
        <span className="card-symbol" aria-hidden="true">{colorSymbols[counter.color]}</span>
        <div className="card-tools">
          <button className="icon-button" aria-label={t('card.edit', { name: counter.name })} title={t('actions.edit')} onClick={() => onAction({ kind: 'edit', counter })}><Icon name="edit" /></button>
          <button className="icon-button delete-button" aria-label={t('card.delete', { name: counter.name })} title={t('actions.delete')} onClick={() => onAction({ kind: 'delete', counter })}><Icon name="trash" /></button>
        </div>
      </div>
      <h3>{counter.name}</h3>
      <p className="card-description">{counter.description || t('card.description')}</p>
      <div className="day-count"><strong>{days.toLocaleString(i18n.language)}</strong><span>{t('day', { count: days })}</span></div>
      <div className="card-bottom">
        <button className="reset-button" onClick={() => onAction({ kind: 'reset', counter })}><Icon name="reset" />{t('actions.reset')}</button>
        <button className="history-button" onClick={() => onAction({ kind: 'history', counter })} aria-label={t('card.historyLabel', { name: counter.name, count: counter.resets.length })}>{t('card.history')} <span>{counter.resets.length}</span></button>
      </div>
    </article>
  )
}

function History({ counter }: { counter: Counter }) {
  const { t, i18n } = useTranslation()
  const date = (value: string) => formatDate(value, i18n.language)
  return <>
    <p className="dialog-intro">{t('history.intro', { name: counter.name, date: date(counter.startDate) })}</p>
    {counter.resets.length === 0 ? <p className="history-empty">{t('history.empty')}</p> : (
      <ol className="history-list">{counter.resets.toReversed().map((reset, index) => (
        <li key={reset.id}>
          <span className="history-marker"><Icon name="reset" /></span>
          <div>
            <strong>{t('history.newStart', { date: date(reset.date) })}</strong>
            <p>{t('history.previous', { date: date(reset.previousDate) })}</p>
            <small>{t('history.recorded', { number: counter.resets.length - index, date: new Date(reset.recordedAt).toLocaleString(i18n.language) })}</small>
          </div>
        </li>
      ))}</ol>
    )}
    <p className="field-help">{t('history.help')}</p>
  </>
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [initial] = useState(() => {
    try { return { counters: decodeCounters(localStorage.getItem(STORAGE_KEY)), error: '' } }
    catch { return { counters: [], error: 'errors.read' } }
  })
  const [counters, setCounters] = useState<Counter[]>(initial.counters)
  const [storageError, setStorageError] = useState(initial.error)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [currentDay, setCurrentDay] = useState(today())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.title = t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
  }, [i18n.language, t])
  useEffect(() => {
    const update = () => setCurrentDay(today())
    const timer = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      try { setCounters(decodeCounters(event.key === null ? null : event.newValue)); setStorageError('') }
      catch { setStorageError('errors.sync') }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  function save(next: Counter[], message: string) {
    try {
      const stored = decodeCounters(localStorage.getItem(STORAGE_KEY))
      if (encodeCounters(stored) !== encodeCounters(counters)) {
        setCounters(stored); setModal(null); setStorageError('errors.conflict'); return
      }
      localStorage.setItem(STORAGE_KEY, encodeCounters(next))
      setCounters(next); setStorageError(''); setModal(null); setNotice(message)
    } catch { setStorageError('errors.save') }
  }

  const visible = counters.filter(counter => `${counter.name} ${counter.description}`.toLocaleLowerCase(i18n.language).includes(query.toLocaleLowerCase(i18n.language))).sort((a, b) => sort === 'longest' ? a.startDate.localeCompare(b.startDate) : sort === 'name' ? a.name.localeCompare(b.name, i18n.language) : b.createdAt.localeCompare(a.createdAt))
  const close = () => setModal(null)

  return <>
    <header className="site-header">
      <a href="./" className="brand" aria-label={t('home')}><span className="brand-symbol">s<span>°</span></span>sincéo<span className="brand-dot">.</span></a>
      <span className="header-note">{t('tagline')}</span>
      <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={t(theme === 'dark' ? 'theme.light' : 'theme.dark')} title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </header>
    <main>
      <section className="counters-section" aria-labelledby="counters-title">
        <div className="section-heading">
          <h1 id="counters-title">{t('counters.title')} <span className="count-badge">{counters.length}</span></h1>
          <time className="today" dateTime={currentDay}><Icon name="calendar" />{formatDate(currentDay, i18n.language)}</time>
        </div>
        {storageError && <p className="error storage-error" role="alert">{t(storageError)}</p>}
        {counters.length > 0 && <div className="toolbar">
          <label className="search"><span className="sr-only">{t('search.label')}</span><input type="search" placeholder={t('search.placeholder')} value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label className="sort">{t('sort.label')}<select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">{t('sort.recent')}</option><option value="longest">{t('sort.longest')}</option><option value="name">{t('sort.name')}</option></select></label>
        </div>}
        {counters.length === 0 ? (
          <div className="empty-state">
            <span className="empty-symbol" aria-hidden="true">✳</span>
            <p className="eyebrow">{t('empty.eyebrow')}</p><h3>{t('empty.title')}</h3><p>{t('empty.description')}</p>
            <button className="button primary" onClick={() => setModal({ kind: 'create' })}><Icon name="plus" />{t('actions.createFirst')}</button>
            <div className="inspiration"><span>{t('empty.inspiration')}</span><span>☀ {t('empty.habit')}</span><span>✦ {t('empty.memory')}</span><span>✳ {t('empty.challenge')}</span></div>
          </div>
        ) : visible.length === 0 ? (
          <div className="no-results"><h3>{t('search.emptyTitle')}</h3><p>{t('search.emptyDescription')}</p><button className="button secondary" onClick={() => setQuery('')}>{t('actions.clearSearch')}</button></div>
        ) : (
          <div className="counter-grid">
            {visible.map(counter => <CounterCard key={counter.id} counter={counter} currentDay={currentDay} onAction={setModal} />)}
            <button className="add-card" onClick={() => setModal({ kind: 'create' })}><span><Icon name="plus" /></span><strong>{t('card.another')}</strong><span>{t('actions.add')}</span></button>
          </div>
        )}
      </section>
      <aside className="gentle-note"><span aria-hidden="true">✦</span><p>{t('gentleNote')}</p></aside>
    </main>
    {counters.length > 0 && <div className="create-dock"><button className="button primary" onClick={() => setModal({ kind: 'create' })}><Icon name="plus" />{t('actions.create')}</button></div>}
    <div className="toast-region" role="status" aria-live="polite">{notice && <p className="toast">✓ {t(notice)}</p>}</div>
    {modal && <Dialog title={t(`dialog.${modal.kind}`)} onClose={close}>
      {storageError && <p className="error" role="alert">{t(storageError)}</p>}
      {(modal.kind === 'create' || modal.kind === 'edit') && <CounterForm counter={modal.kind === 'edit' ? modal.counter : undefined} onClose={close} onSave={draft => save(modal.kind === 'edit' ? counters.map(counter => counter.id === modal.counter.id ? { ...counter, name: draft.name, description: draft.description, color: draft.color } : counter) : [...counters, createCounter(draft)], modal.kind === 'edit' ? 'notice.edited' : 'notice.created')} />}
      {modal.kind === 'reset' && <ResetForm counter={modal.counter} onClose={close} onReset={date => save(counters.map(counter => counter.id === modal.counter.id ? resetCounter(counter, date) : counter), 'notice.reset')} />}
      {modal.kind === 'delete' && <>
        <p className="dialog-intro">{t('delete.description', { name: modal.counter.name, count: modal.counter.resets.length })}</p>
        <div className="dialog-actions"><button className="button secondary" onClick={close}>{t('actions.keep')}</button><button className="button danger" onClick={() => save(counters.filter(counter => counter.id !== modal.counter.id), 'notice.deleted')}>{t('actions.deleteCounter')}</button></div>
      </>}
      {modal.kind === 'history' && <><History counter={modal.counter} /><div className="dialog-actions"><button className="button secondary" onClick={close}>{t('actions.close')}</button></div></>}
    </Dialog>}
  </>
}
export default App
