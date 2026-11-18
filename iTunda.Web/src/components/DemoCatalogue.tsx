import { Link } from 'react-router-dom';
import { zoneName } from '../lib/geo';
import { demoDate, demoMoney } from '../lib/demoTomatoes';
import { categoryIcon } from '../lib/categories';
import { demoHarvestPath, type DemoHarvest } from '../lib/demoHarvests';
import './TomatoDemo.css';

export function DemoHarvestCard({ lot }: { lot: DemoHarvest }) {
  return (
    <article className="td-card">
      <Link to={demoHarvestPath(lot)} className="td-card-link">
        <div className="td-photo">
          {lot.photo ? <img src={lot.photo} alt="" width="640" height="410" loading="lazy" />
            : <div className="td-illustration" aria-hidden="true">{categoryIcon(lot.category)}</div>}
          <span className="td-label">Demo lot</span>
        </div>
        <div className="td-card-body">
          <p className="td-origin">{lot.region}, {lot.country}</p>
          <h3>{lot.name}</h3>
          <p>{lot.farm} · {lot.available} {lot.unit === 'stem' ? 'stems' : lot.unit} sample lot</p>
          <p>{lot.category === 'Animal Feed' ? 'Milled' : 'Harvested'} {demoDate(lot.picked)}</p>
          <div className="td-card-end"><strong>{demoMoney(lot.price, lot.currency)}/{lot.unit}</strong><span>View lot →</span></div>
        </div>
      </Link>
    </article>
  );
}

export function DemoHarvestSection({ lots, category }: { lots: DemoHarvest[]; category?: string }) {
  if (lots.length === 0) return null;
  const zones = [...new Set(lots.map(lot => lot.zone))].sort((a, b) => a - b);
  const heading = category === 'Tomatoes' ? 'Demo tomato lots' : category ? `${category} demo lots` : 'Demo harvests';
  return (
    <section className="td-section" aria-label={heading}>
      <h2>{heading}</h2>
      <p>Compare sample lots and follow a batch from origin to handoff. The grower, stock and practice order are simulated. Each lot shows its dated price reference.</p>
      {zones.map(zone => (
        <section className="td-zone" key={zone} aria-label={zoneName(zone)}>
          <h3>{zoneName(zone)}</h3>
          <div className="td-card-grid">
            {lots.filter(lot => lot.zone === zone).map(lot => <DemoHarvestCard key={lot.slug} lot={lot} />)}
          </div>
        </section>
      ))}
    </section>
  );
}

export function DemoGrowerSection({ lots }: { lots: DemoHarvest[] }) {
  if (lots.length === 0) return null;
  const profiles = [...new Map(lots.map(lot => [lot.growerSlug, lot])).values()];
  return (
    <section className="td-section" aria-label="Demo growers">
      <h2>Demo growers</h2>
      <p>Example profiles showing how buyers can identify who grew a batch and find its harvest records.</p>
      <div className="td-card-grid">
        {profiles.map(lot => (
          <article className="td-card td-grower-card" key={lot.growerSlug}>
            <span className="td-label">Demo grower</span>
            <h3><Link to={`/demo/growers/${lot.growerSlug}`}>{lot.farm}</Link></h3>
            <p>{lot.grower} · {lot.region}, {lot.country}</p>
            <p>{[...new Set(lots.filter(item => item.growerSlug === lot.growerSlug).map(item => item.category))].join(' · ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
