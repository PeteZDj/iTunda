import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { flagUrl, ZONES } from '../lib/geo';
import './RegionSelector.css';

export default function RegionSelector() {
  const { regions, zone, region, setZone, setRegion, clear, visitor } = useRegion();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = region ? regions.find(r => r.name === region) : null;
  const label = selected ? selected.name
    : zone != null ? `Zone ${zone}`
    : visitor ? visitor.countryName
    : 'All origins';
  const triggerFlag = selected ? selected.countryCode : visitor?.countryCode;

  const go = (fn: () => void) => { fn(); setOpen(false); navigate('/browse'); };

  return (
    <div className="region-select" ref={wrapRef}>
      <button className="region-trigger" onClick={() => setOpen(o => !o)} aria-label="Choose region">
        {triggerFlag
          ? <img className="region-flag" src={flagUrl(triggerFlag)} alt="" />
          : <span className="region-globe">🌍</span>}
        <span className="region-label">{label}</span>
        <span className="region-chev">▾</span>
      </button>

      {open && (
        <div className="region-menu">
          <button className="region-item region-all" onClick={() => go(clear)}>
            <span className="region-globe">🌍</span> All origins
            {!zone && !region && <span className="region-check">✓</span>}
          </button>

          {ZONES.map(z => {
            const zoneRegions = regions.filter(r => r.zone === z.zone);
            return (
              <div key={z.zone} className="region-group">
                <button className="region-zone-head" onClick={() => go(() => setZone(z.zone))}>
                  <span>{z.name}</span>
                  {zone === z.zone && <span className="region-check">✓</span>}
                </button>
                <div className="region-zone-blurb">{z.blurb}</div>
                {zoneRegions.map(r => (
                  <button key={r.name} className="region-item" onClick={() => go(() => setRegion(r.name))}>
                    <img className="region-flag" src={flagUrl(r.countryCode)} alt="" />
                    <span className="region-item-name">{r.name}</span>
                    <span className="region-item-country">{r.country}</span>
                    <span className="region-item-count">{r.listingCount}</span>
                    {region === r.name && <span className="region-check">✓</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
