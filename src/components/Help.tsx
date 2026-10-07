import { useState } from 'react'
import { ExternalLink, MapPin, Phone, TramFront } from 'lucide-react'
import { useT } from '../i18n'
import { help } from '../data'

const AREAS = ['countywide', 'glendale', 'burbank', 'north-hollywood', 'hollywood']

// Google Maps transit directions to an address. Nothing is sent unless the user taps it.
const transitLink = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=transit`

export default function Help() {
  const t = useT()
  const [area, setArea] = useState('countywide')
  const places = help
    .filter((h) => h.area === area || (area !== 'countywide' && h.area === 'countywide' && h.languages.includes(t.lang)))
    .sort((a, b) => Number(b.languages.includes(t.lang)) - Number(a.languages.includes(t.lang)))
  return (
    <section className="card help-section" aria-labelledby="help-title">
      <h2 id="help-title" className="card-title"><MapPin size={20} aria-hidden="true" /> {t('ui.helpTitle')}</h2>
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
                <a className="btn btn-small btn-soft" href={`tel:${h.phone.replace(/[^\d+]/g, '')}`}>
                  <Phone size={14} aria-hidden="true" /> {h.phone}
                </a>
              )}
              {h.url && (
                <a className="btn btn-small btn-soft" href={h.url} target="_blank" rel="noopener noreferrer">
                  {t('ui.website')} <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              {h.address && (
                <a className="btn btn-small btn-soft" href={transitLink(h.address)} target="_blank" rel="noopener noreferrer">
                  <TramFront size={14} aria-hidden="true" /> {t('ui.directions')}
                  <span className="sr-only"> ({t('ui.directionsNote')})</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
