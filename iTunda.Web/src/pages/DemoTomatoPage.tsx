import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DemoTomatoCard, harvestPhoto, vinePhoto } from '../components/TomatoDemo';
import { demoDate, demoMoney, demoTomatoLots, type DemoTomatoLot } from '../lib/demoTomatoes';
import { zoneName } from '../lib/geo';

function DemoPurchase({ lot }: { lot: DemoTomatoLot }) {
  const [quantity, setQuantity] = useState('5');
  const [fulfilment, setFulfilment] = useState('Market pickup');
  const [receipt, setReceipt] = useState(false);
  const kg = Number(quantity);
  const valid = Number.isInteger(kg) && kg > 0 && kg <= lot.stockKg;
  const total = valid ? demoMoney(kg * lot.price, lot.currency) : '—';

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid) setReceipt(true);
  }

  return (
    <section className="td-panel td-purchase" aria-labelledby="td-purchase-title">
      <h2 id="td-purchase-title">Try a demo purchase</h2>
      <p>Practice choosing quantity and fulfilment. This stays in your browser.</p>
      {receipt ? (
        <div className="td-receipt" role="status">
          <strong>Demo order complete</strong>
          <p>{kg} kg · {fulfilment} · {total}</p>
          <p>Lot {lot.lotCode}. No payment or delivery was arranged.</p>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setReceipt(false)}>Start another demo order</button>
        </div>
      ) : (
        <form onSubmit={confirm}>
          <label>Quantity in kg<input className="input" type="number" min={1} max={lot.stockKg} step={1} required value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
          <label>Fulfilment<select className="select" value={fulfilment} onChange={event => setFulfilment(event.target.value)}>
            <option>Market pickup</option><option>Local delivery</option>
          </select></label>
          <div className="td-total"><span>Demo produce total</span><strong>{total}</strong></div>
          <button className="btn btn-primary" disabled={!valid}>Confirm demo order</button>
        </form>
      )}
    </section>
  );
}

export function DemoTomatoPage({ profile = false }: { profile?: boolean }) {
  const { slug } = useParams();
  const lot = demoTomatoLots.find(item => item.slug === slug);
  if (!lot) return <main className="td-page page-container"><h1>Demo lot or grower unavailable</h1><Link to="/browse/Tomatoes">See demo tomatoes →</Link></main>;

  const location = `${lot.town}, ${lot.region}, ${lot.country}`;
  if (profile) return (
    <main className="td-page page-container">
      <Link to="/farmers" className="td-back">← Grower directory</Link>
      <header className="td-hero">
        <div className="td-hero-copy">
          <span className="td-label">Demo grower</span>
          <h1>{lot.farm}</h1>
          <p>{lot.grower} · {location}</p>
          <p>{lot.farmStory}</p>
          <p>{zoneName(lot.zone)} · Fictional profile</p>
        </div>
        <img src={vinePhoto} width="500" height="610" alt="Illustrative photo of a ripe tomato growing on a vine" />
      </header>
      <section className="td-section">
        <h2>Example harvest</h2>
        <div className="td-card-grid"><DemoTomatoCard lot={lot} /></div>
      </section>
    </main>
  );

  const handoffDate = new Date(Date.parse(lot.packed) + 86_400_000).toISOString().slice(0, 10);
  const events = [
    [lot.seeded, 'Sown in the nursery', `${lot.variety} seeds labeled in a nursery tray for this batch.`],
    [lot.transplanted, 'Transplanted to the plot', `Seedlings moved to ${lot.field}. ${lot.cultivation}`],
    [lot.picked, 'Harvested and graded', `Fruit picked from ${lot.field} and sorted as ${lot.grade.toLowerCase()}.`],
    [lot.packed, 'Packed and labeled', `${lot.packaging}. The crate label carries ${lot.lotCode} and the packing date.`],
    [handoffDate, 'Ready for buyer handoff', 'The example pickup record matches the crate label to the grower, lot and quantity.'],
    [lot.bestBefore, 'Sample best-before date', 'The grower records a best-before date so the buyer can plan pickup and use.'],
  ];
  const ref = lot.priceReference;

  return (
    <main className="td-page page-container">
      <div className="td-nav"><Link to="/browse/Tomatoes" className="td-back">← Browse tomatoes</Link><Link to="/buy?c=Tomatoes" className="td-back">Buy page →</Link></div>
      <header className="td-hero">
        <div className="td-hero-copy">
          <span className="td-label">Demo lot</span>
          <h1>{lot.variety} tomatoes</h1>
          <p>{location}</p>
          <p className="td-lot-code">{lot.lotCode}</p>
          <p><Link to={`/demo/growers/${lot.slug}`}>{lot.farm} · {lot.grower} →</Link></p>
          <p>{zoneName(lot.zone)} · Sample lot of {lot.stockKg} kg</p>
        </div>
        <figure>
          <img src={harvestPhoto} width="640" height="410" alt="Illustrative photo of ripe tomatoes" />
          <figcaption>Illustrative photo · <a href="https://www.ars.usda.gov/oc/images/photos/k4667-6/">Scott Bauer, USDA ARS</a></figcaption>
        </figure>
      </header>

      <div className="td-detail-grid">
        <section className="td-panel" aria-labelledby="td-trace-title">
          <h2 id="td-trace-title">From seed to buyer</h2>
          <p>Follow the example batch from {lot.field} through harvest, packing and the best-before date.</p>
          <ol className="td-timeline">
            {events.map(([date, title, body]) => <li key={title}>
              <time dateTime={date}>{demoDate(date)}</time><h3>{title}</h3><p>{body}</p>
            </li>)}
          </ol>
          <figure className="td-vine"><img src={vinePhoto} width="500" height="610" alt="Illustrative photo of a ripe tomato on a vine" />
            <figcaption>Illustrative photo · <a href="https://commons.wikimedia.org/wiki/File:Ripe_tomato_on_tomato_plant_in_home_garden.jpg">Clintacc, CC0</a></figcaption>
          </figure>
        </section>
        <aside className="td-side">
          <section className="td-panel" aria-labelledby="td-price-title">
            <h2 id="td-price-title">Price reference</h2>
            <dl className="td-facts">
              <div><dt>Demo grower price</dt><dd>{demoMoney(lot.price, lot.currency)}/kg</dd></div>
              <div><dt>{ref.market}</dt><dd>{demoMoney(ref.price, lot.currency)}/kg</dd></div>
            </dl>
            <p>{ref.method} · {ref.period}</p>
            <p><a href={ref.source}>View published market data ↗</a></p>
          </section>
          <DemoPurchase key={lot.slug} lot={lot} />
        </aside>
      </div>
    </main>
  );
}
