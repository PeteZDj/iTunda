import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCIES } from '../lib/currency';
import { flagUrl } from '../lib/geo';
import './CurrencySelector.css';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="ccy-selector" ref={ref}>
      <button className="ccy-trigger" onClick={() => setOpen(o => !o)} title="Change currency">
        <img className="ccy-flag" src={flagUrl(active.countryCode)} alt="" />
        <span className="ccy-code">{active.code}</span>
        <span className="ccy-caret">▾</span>
      </button>
      {open && (
        <div className="ccy-menu">
          <div className="ccy-menu-head">Display prices in</div>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              className={`ccy-item ${c.code === currency ? 'active' : ''}`}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
            >
              <img className="ccy-flag" src={flagUrl(c.countryCode)} alt="" />
              <span className="ccy-item-code">{c.code}</span>
              <span className="ccy-item-symbol">{c.symbol}</span>
              <span className="ccy-item-name">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
