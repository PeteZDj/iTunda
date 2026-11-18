import { Link } from 'react-router-dom';
import { zoneName } from '../lib/geo';
import { demoDate, demoMoney, type DemoTomatoLot } from '../lib/demoTomatoes';
import './TomatoDemo.css';

export const harvestPhoto = '/images/demo-tomatoes/harvest.webp';
export const vinePhoto = '/images/demo-tomatoes/vine.webp';

export function DemoTomatoCard({ lot }: { lot: DemoTomatoLot }) {
  return (
    <article className="td-card">
      <Link to={`/demo/tomatoes/${lot.slug}`} className="td-card-link">
        <div className="td-photo">
          <img src={lot.variety === 'Vine' ? vinePhoto : harvestPhoto} alt="" width="640" height="410" loading="lazy" />
          <span className="td-label">Demo lot</span>
        </div>
        <div className="td-card-body">
          <p className="td-origin">{lot.region}, {lot.country}</p>
          <h3>{lot.variety} tomatoes</h3>
          <p>{lot.farm} · {lot.stockKg} kg sample lot</p>
          <p>Picked {demoDate(lot.picked)}</p>
          <div className="td-card-end"><strong>{demoMoney(lot.price, lot.currency)}/kg</strong><span>View lot →</span></div>
        </div>
      </Link>
    </article>
  );
}

export function DemoTomatoSection({ lots }: { lots: DemoTomatoLot[] }) {
  if (lots.length === 0) return null;
  const zones = [...new Set(lots.map(lot => lot.zone))];
  return (
    <section className="td-section" aria-label="Demo tomato lots">
      <h2>Demo tomato lots</h2>
      <p>Compare regional prices and follow a batch from planting to packing. Growers, stock and orders are simulated. Each lot shows its dated market reference.</p>
      {zones.map(zone => (
        <section className="td-zone" key={zone} aria-label={zoneName(zone)}>
          <h3>{zoneName(zone)}</h3>
          <div className="td-card-grid">
            {lots.filter(lot => lot.zone === zone).map(lot => <DemoTomatoCard key={lot.slug} lot={lot} />)}
          </div>
        </section>
      ))}
    </section>
  );
}

export function DemoGrowerSection({ lots }: { lots: DemoTomatoLot[] }) {
  if (lots.length === 0) return null;
  return (
    <section className="td-section" aria-label="Demo growers">
      <h2>Demo growers</h2>
      <p>Example profiles showing how buyers can identify who grew a batch and find its harvest records.</p>
      <div className="td-card-grid">
        {lots.map(lot => (
          <article className="td-card td-grower-card" key={lot.slug}>
            <span className="td-label">Demo grower</span>
            <h3><Link to={`/demo/growers/${lot.slug}`}>{lot.farm}</Link></h3>
            <p>{lot.grower} · {lot.region}, {lot.country}</p>
            <p>{lot.variety} tomatoes</p>
          </article>
        ))}
      </div>
    </section>
  );
}
