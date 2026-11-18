import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zoneName } from '../lib/geo';
import { demoDate, demoMoney } from '../lib/demoTomatoes';
import { categoryIcon } from '../lib/categories';
import { demoHarvestPath, type DemoHarvest } from '../lib/demoHarvests';
import './TomatoDemo.css';

const pageSize = 12;

function usePage<T>(items: T[]) {
  const [requested, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requested, pages);
  const start = (page - 1) * pageSize;
  return { page, pages, start, setPage, items: items.slice(start, start + pageSize) };
}

function DemoPager({ total, page, pages, start, setPage }: {
  total: number; page: number; pages: number; start: number; setPage: (page: number) => void;
}) {
  return <div className="td-pagination" aria-label="Demo pagination">
    <p aria-live="polite" className="td-page-count">Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}</p>
    {pages > 1 && <div className="td-page-buttons">
      <button type="button" className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      <select className="select" aria-label="Demo page" value={page} onChange={event => setPage(Number(event.target.value))}>
        {Array.from({ length: pages }, (_, index) => <option value={index + 1} key={index}>Page {index + 1} of {pages}</option>)}
      </select>
      <button type="button" className="btn btn-outline btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
    </div>}
  </div>;
}

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
          <p>Renews <time dateTime={lot.renewsOn}>{demoDate(lot.renewsOn)}</time></p>
          <div className="td-card-end"><strong>{demoMoney(lot.price, lot.currency)}/{lot.unit}</strong><span>View lot →</span></div>
        </div>
      </Link>
    </article>
  );
}

export function DemoHarvestSection({ lots, category }: { lots: DemoHarvest[]; category?: string }) {
  const paging = usePage(lots);
  if (lots.length === 0) return null;
  const zones = [...new Set(paging.items.map(lot => lot.zone))].sort((a, b) => a - b);
  const heading = category === 'Tomatoes' ? 'Demo tomato lots' : category ? `${category} demo lots` : 'Demo harvests';
  return (
    <section className="td-section" aria-label={heading}>
      <h2>{heading}</h2>
      <p>Compare simulated offers and trace each batch from origin to handoff. When a demo offer expires, a fresh batch replaces it automatically.</p>
      <DemoPager total={lots.length} {...paging} />
      {zones.map(zone => (
        <section className="td-zone" key={zone} aria-label={zoneName(zone)}>
          <h3>{zoneName(zone)}</h3>
          <div className="td-card-grid">
            {paging.items.filter(lot => lot.zone === zone).map(lot => <DemoHarvestCard key={lot.slug} lot={lot} />)}
          </div>
        </section>
      ))}
    </section>
  );
}

export function DemoGrowerSection({ lots }: { lots: DemoHarvest[] }) {
  const growers = new Map<string, { lot: DemoHarvest; categories: Set<string> }>();
  for (const lot of lots) {
    const profile = growers.get(lot.growerSlug) ?? { lot, categories: new Set<string>() };
    profile.categories.add(lot.category);
    growers.set(lot.growerSlug, profile);
  }
  const profiles = [...growers.values()];
  const paging = usePage(profiles);
  if (lots.length === 0) return null;
  return (
    <section className="td-section" aria-label="Demo growers">
      <h2>Demo growers</h2>
      <p>Example profiles showing how buyers can identify who grew a batch and find its harvest records.</p>
      <DemoPager total={profiles.length} {...paging} />
      <div className="td-card-grid">
        {paging.items.map(({ lot, categories }) => (
          <article className="td-card td-grower-card" key={lot.growerSlug}>
            <span className="td-label">Demo grower</span>
            <h3><Link to={`/demo/growers/${lot.growerSlug}`}>{lot.farm}</Link></h3>
            <p>{lot.grower} · {lot.region}, {lot.country}</p>
            <p>{[...categories].join(' · ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
