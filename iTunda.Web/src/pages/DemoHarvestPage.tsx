import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoHarvestSection } from '../components/DemoCatalogue';
import { demoDate, demoMoney } from '../lib/demoTomatoes';
import { demoCategoryUrl, tomatoVinePhoto, type DemoHarvest } from '../lib/demoHarvests';
import { useDemoHarvests } from '../hooks/useDemoHarvests';
import { categoryIcon } from '../lib/categories';
import { zoneName } from '../lib/geo';

function DemoPurchase({ lot }: { lot: DemoHarvest }) {
  const [quantity, setQuantity] = useState('5');
  const [fulfilment, setFulfilment] = useState('Market pickup');
  const [receipt, setReceipt] = useState<{ count: number; fulfilment: string; total: string; lotCode: string } | null>(null);
  const [expiredLot, setExpiredLot] = useState('');
  const count = Number(quantity);
  const valid = Number.isInteger(count) && count > 0 && count <= lot.available;
  const total = valid ? demoMoney(count * lot.price, lot.currency) : '—';

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    if (Date.now() >= Date.parse(lot.renewsOn)) {
      setExpiredLot(lot.lotCode);
      return;
    }
    setReceipt({ count, fulfilment, total, lotCode: lot.lotCode });
  }

  return (
    <section className="td-panel td-purchase" aria-labelledby="td-purchase-title">
      <h2 id="td-purchase-title">Try a demo purchase</h2>
      <p>Practice choosing quantity and fulfilment. This stays in your browser.</p>
      {receipt ? (
        <div className="td-receipt" role="status">
          <strong>Demo order complete</strong>
          <p>{receipt.count} {lot.unit}{lot.unit === 'stem' && receipt.count !== 1 ? 's' : ''} · {receipt.fulfilment} · {receipt.total}</p>
          <p>Lot {receipt.lotCode}. No payment or delivery was arranged.</p>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setReceipt(null)}>Start another demo order</button>
        </div>
      ) : (
        <form onSubmit={confirm}>
          <label>Quantity in {lot.unit === 'stem' ? 'stems' : lot.unit}<input className="input" type="number" min={1} max={lot.available} step={1} required value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
          <label>Fulfilment<select className="select" value={fulfilment} onChange={event => setFulfilment(event.target.value)}>
            <option>Market pickup</option><option>Local delivery</option>
          </select></label>
          <div className="td-total"><span>Demo produce total</span><strong>{total}</strong></div>
          {expiredLot === lot.lotCode && <p role="status">This demo offer expired. Check the renewed batch before confirming.</p>}
          <button className="btn btn-primary" disabled={!valid}>Confirm demo order</button>
        </form>
      )}
    </section>
  );
}

export function DemoHarvestPage({ profile = false }: { profile?: boolean }) {
  const { slug } = useParams();
  const demoHarvests = useDemoHarvests();
  const lot = demoHarvests.find(item => (profile ? item.growerSlug : item.slug) === slug);
  if (!lot) return <main className="td-page page-container"><h1>Demo lot or grower unavailable</h1><Link to="/browse">Browse demo harvests →</Link></main>;

  const location = `${lot.town}, ${lot.region}, ${lot.country}`;
  const isTomato = lot.category === 'Tomatoes';
  if (profile) return (
    <main className="td-page page-container">
      <Link to="/farmers" className="td-back">← Grower directory</Link>
      <header className="td-hero">
        <div className="td-hero-copy">
          <span className="td-label">Demo grower</span>
          <h1>{lot.farm}</h1>
          <p>{lot.grower} · {location}</p>
          {lot.farmStory && <p>{lot.farmStory}</p>}
          <p>{zoneName(lot.zone)} · Fictional profile</p>
        </div>
        {isTomato ? <img src={tomatoVinePhoto} width="500" height="610" alt="Illustrative photo of a ripe tomato growing on a vine" />
          : <div className="td-illustration" aria-hidden="true">{categoryIcon(lot.category)}</div>}
      </header>
      <DemoHarvestSection key={lot.growerSlug} lots={demoHarvests.filter(item => item.growerSlug === lot.growerSlug)} />
    </main>
  );

  const ref = lot.priceReference;

  return (
    <main className="td-page page-container">
      <div className="td-nav"><Link to={demoCategoryUrl(lot.category)} className="td-back">← Browse {lot.category}</Link><Link to={`/buy?c=${encodeURIComponent(lot.category)}`} className="td-back">Buy page →</Link></div>
      <header className="td-hero">
        <div className="td-hero-copy">
          <span className="td-label">Demo lot</span>
          <h1>{lot.name}</h1>
          <p>{location}</p>
          <p className="td-lot-code">{lot.lotCode}</p>
          <p><Link to={`/demo/growers/${lot.growerSlug}`}>{lot.farm} · {lot.grower} →</Link></p>
          <p>{zoneName(lot.zone)} · Sample lot of {lot.available} {lot.unit === 'stem' ? 'stems' : lot.unit}</p>
          <p>{lot.grade}</p>
          <p className="td-offer-end">Demo offer renews <time dateTime={lot.renewsOn}>{demoDate(lot.renewsOn)}</time></p>
        </div>
        {lot.photo ? <figure>
          <img src={lot.photo} width="640" height="410" alt={`Illustrative photo for ${lot.name}`} />
          <figcaption>Illustrative photo{isTomato && <> · <a href="https://www.ars.usda.gov/oc/images/photos/k4667-6/">Scott Bauer, USDA ARS</a></>}</figcaption>
        </figure> : <div className="td-illustration" aria-hidden="true">{categoryIcon(lot.category)}</div>}
      </header>

      <div className="td-detail-grid">
        <section className="td-panel" aria-labelledby="td-trace-title">
          <h2 id="td-trace-title">{isTomato ? 'From seed to buyer' : 'Lot traceability'}</h2>
          <p>Follow the sample from {lot.field} through packing and buyer handoff.</p>
          <ol className="td-timeline">
            {lot.trace.map(event => <li key={event.title}>
              <time dateTime={event.date}>{demoDate(event.date)}</time><h3>{event.title}</h3><p>{event.description}</p>
            </li>)}
          </ol>
          {isTomato && <figure className="td-vine"><img src={tomatoVinePhoto} width="500" height="610" alt="Illustrative photo of a ripe tomato on a vine" />
            <figcaption>Illustrative photo · <a href="https://commons.wikimedia.org/wiki/File:Ripe_tomato_on_tomato_plant_in_home_garden.jpg">Clintacc, CC0</a></figcaption>
          </figure>}
        </section>
        <aside className="td-side">
          <section className="td-panel" aria-labelledby="td-price-title">
            <h2 id="td-price-title">Price reference</h2>
            <dl className="td-facts">
              <div><dt>Demo price</dt><dd>{demoMoney(lot.price, lot.currency)}/{lot.unit}</dd></div>
              <div><dt>{ref.market}</dt><dd>{demoMoney(ref.price, lot.currency)}/{lot.unit}</dd></div>
            </dl>
            <p>{ref.method} · {ref.period}</p>
            <p><a href={ref.source}>View published market data ↗</a></p>
            <p>The offer renews at 00:00 UTC with a new batch code and dates.</p>
          </section>
          <DemoPurchase key={lot.slug} lot={lot} />
        </aside>
      </div>
    </main>
  );
}
