import { useState } from 'react'
import { ChevronDown, ExternalLink, Landmark, Phone, TramFront } from './Icons'
import { useT } from '../i18n'
import { help, zips } from '../data'

const AREAS = ['countywide', 'glendale', 'burbank', 'north-hollywood', 'hollywood']

// The help-directory area for a ZIP, from its city name ("Los Angeles (North Hollywood)" → north-hollywood).
// "north-hollywood" is checked before "hollywood". Anything else is countywide.
export const areaOf = (zip?: string) => {
  const city = (zip && zips[zip]?.city.toLowerCase()) || ''
  return AREAS.slice(1).find((a) => city.includes(a.replace('-', ' '))) ?? 'countywide'
}

// Google Maps transit directions to an address. Nothing is sent unless the user taps it.
const transitLink = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=transit`

// Starts folded, like the other reference sections at the bottom of Results.
export default function Help({ zip }: { zip?: string }) {
  const t = useT()
  const [area, setArea] = useState(() => areaOf(zip))
  const places = help
    .filter((h) => h.area === area || (area !== 'countywide' && h.area === 'countywide' && h.languages.includes(t.lang)))
    .sort((a, b) => Number(b.languages.includes(t.lang)) - Number(a.languages.includes(t.lang)))
  return (
    <details className="card person-results person-fold help-section">
      <summary className="person-results-head">
        <h2 className="fold-title">{t('ui.helpTitle')}</h2>
        <ChevronDown className="fold-icon" size={22} aria-hidden="true" />
      </summary>
      <p className="help">{t('ui.helpIntro')}</p>
      <div className="area-chips" role="group" aria-label={t('ui.helpTitle')}>
        {AREAS.map((a) => (
          <button key={a} className="chip-btn" aria-pressed={area === a} onClick={() => setArea(a)}>{t(`help.areas.${a}`)}</button>
        ))}
      </div>
      <ul className="places">
        {places.map((h) => (
          <li key={h.id} className="place">
            <p className="place-kind">{t(`help.kinds.${h.kind}`)}</p>
            <h3 lang="en">{h.name}</h3>
            {h.address && <p className="muted">{h.address}</p>}
            <p className="small muted">{t('ui.speaks', { langs: h.languages.map((l) => (t.has(`lang.${l}`) ? t(`lang.${l}`) : l.toUpperCase())).join(', ') })}</p>
            <div className="place-actions">
              {h.phone && (
                <a className="btn btn-small btn-secondary" href={`tel:${h.phone.replace(/[^\d+]/g, '')}`}>
                  <Phone size={14} aria-hidden="true" /> {h.phone}
                </a>
              )}
              {h.url && (
                <a className="btn btn-small btn-secondary" href={h.url} target="_blank" rel="noopener noreferrer">
                  {t('ui.website')} <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              {h.address && (
                <a className="btn btn-small btn-secondary" href={transitLink(h.address)} target="_blank" rel="noopener noreferrer">
                  <TramFront size={14} aria-hidden="true" /> {t('ui.directions')}
                  <span className="sr-only"> ({t('ui.directionsNote')})</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* Federal casework: one neutral pointer, no office address. The link only opens on tap. */}
      <p className="note-info rep-help">
        <Landmark size={18} aria-hidden="true" />
        <span>
          {t('ui.repHelp')}{' '}
          <a href="https://www.house.gov/representatives/find-your-representative" target="_blank" rel="noopener noreferrer">{t('ui.repLink')}</a>
        </span>
      </p>
    </details>
  )
}
