import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createProduce, updateProduce, getProduceById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { categoryIcon } from '../lib/categories';
import { fileToDataUrl } from '../lib/image';
import LocationPicker from '../components/LocationPicker';
import type { CreateProduceRequest, ProduceResponse } from '../types';
import './SellPage.css';

const CATEGORIES = [
  'Avocados','Macadamia Nuts','French Beans','Tea','Peas & Mange Tout',
  'Passion Fruit','Mangoes','Bananas','Tomatoes','Onions','Capsicum & Peppers','Roses',
  'Coffee','Apples','Pineapples','Oranges','Grapes','Lemons & Limes','Strawberries',
  'Cashew Nuts','Cocoa','Vanilla','Ginger','Green Chillies','Sweet Potatoes',
];

const UNITS = ['kg', 'bunch', 'stem', 'tonne', 'crate', 'punnet', 'box'];
type Scope = 'Local' | 'Export' | 'Both';
const PENDING_KEY = 'itunda_pending_listing';

interface FormState {
  name: string; category: string; description: string; price: string; unit: string;
  quantity: string; grade: string; plantingDate: string; harvestDate: string;
  expiryDate: string; availableFrom: string;
}

const EMPTY: FormState = {
  name: '', category: '', description: '', price: '', unit: 'kg',
  quantity: '', grade: '', plantingDate: '', harvestDate: '', expiryDate: '', availableFrom: '',
};

interface Loc { lat: number | null; lng: number | null; label: string; }

interface PendingListing {
  form: FormState; images: string[]; loc: Loc; scope: Scope; sellerName: string; asDraft: boolean; editId: number | null;
}

export default function SellPage() {
  const { isLoggedIn, name: authName } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit') ? Number(params.get('edit')) : null;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [loc, setLoc] = useState<Loc>({ lat: null, lng: null, label: '' });
  const [scope, setScope] = useState<Scope>('Local');
  const [sellerName, setSellerName] = useState(authName ?? '');

  const [imgBusy, setImgBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ id: number | null; draft: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const restoredRef = useRef(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Load an existing listing for editing ───────────────────────────────
  useEffect(() => {
    if (editId == null) return;
    getProduceById(editId).then((p: ProduceResponse) => {
      setForm({
        name: p.name, category: p.category, description: p.description ?? '',
        price: String(p.price), unit: p.unit, quantity: String(p.quantityAvailable),
        grade: p.gradeQuality ?? '',
        plantingDate: p.plantingDate?.slice(0, 10) ?? '',
        harvestDate: p.harvestDate?.slice(0, 10) ?? '',
        expiryDate: p.expiryDate?.slice(0, 10) ?? '',
        availableFrom: p.availableFrom?.slice(0, 10) ?? '',
      });
      setImages(p.gallery?.length ? p.gallery.filter(g => g.startsWith('data:') || g.startsWith('http')) : []);
      setScope((p.deliveryScope as Scope) || 'Local');
      if (p.farmLatitude != null && p.farmLongitude != null)
        setLoc({ lat: p.farmLatitude, lng: p.farmLongitude, label: [p.town, p.county, p.country].filter(Boolean).join(', ') });
    }).catch(() => setErr('Could not load this listing for editing.'));
  }, [editId]);

  // ── Restore a pending guest draft after sign-up / sign-in ───────────────
  useEffect(() => {
    if (editId != null || restoredRef.current) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    restoredRef.current = true;
    try {
      const p: PendingListing = JSON.parse(raw);
      setForm(p.form); setImages(p.images || []); setLoc(p.loc); setScope(p.scope);
      setSellerName(p.sellerName || authName || '');
      if (isLoggedIn) {
        localStorage.removeItem(PENDING_KEY);
        setNotice('Welcome back! Your listing details are ready — review and publish below.');
      }
    } catch { /* ignore */ }
  }, [isLoggedIn, editId, authName]);

  useEffect(() => { if (isLoggedIn && !sellerName && authName) setSellerName(authName); }, [isLoggedIn, authName, sellerName]);

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImgBusy(true);
    try {
      const encoded = await Promise.all(files.slice(0, 6).map(f => fileToDataUrl(f)));
      setImages(prev => [...prev, ...encoded].slice(0, 6));
    } catch { setErr('Could not process one of the images.'); }
    finally { setImgBusy(false); e.target.value = ''; }
  };

  const buildPayload = (asDraft: boolean): CreateProduceRequest => ({
    name: form.name.trim(),
    category: form.category,
    description: form.description || null,
    price: parseFloat(form.price) || 0,
    unit: form.unit,
    quantityAvailable: parseFloat(form.quantity) || 0,
    plantingDate: form.plantingDate || null,
    harvestDate: form.harvestDate || null,
    expiryDate: form.expiryDate || null,
    availableFrom: form.availableFrom || null,
    gradeQuality: form.grade || null,
    isExportReady: scope !== 'Local',
    farmLatitude: loc.lat,
    farmLongitude: loc.lng,
    images,
    isDraft: asDraft,
    deliveryScope: scope,
  });

  const validate = (asDraft: boolean): string | null => {
    if (!form.name.trim()) return 'Give your listing a name (e.g. "Hass Avocado").';
    if (!form.category) return 'Pick a category.';
    if (asDraft) return null; // drafts can be incomplete
    if (!(parseFloat(form.price) > 0)) return 'Enter a price.';
    if (!(parseFloat(form.quantity) > 0)) return 'Enter the available quantity.';
    if (images.length === 0) return 'Add at least one photo of your produce.';
    if (!form.plantingDate) return 'Add the planting date.';
    if (!form.expiryDate) return 'Add the best-before date.';
    if (loc.lat == null || loc.lng == null) return 'Set your farm location on the map.';
    return null;
  };

  const submit = async (asDraft: boolean) => {
    setErr('');
    const problem = validate(asDraft);
    if (problem) { setErr(problem); return; }

    // Gate: filling is free, but publishing/saving requires an account.
    if (!isLoggedIn) {
      const pending: PendingListing = { form, images, loc, scope, sellerName, asDraft, editId };
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); }
      catch { /* images may exceed quota; continue without persisting */ }
      const qs = new URLSearchParams({ next: '/sell' });
      if (sellerName.trim()) qs.set('name', sellerName.trim());
      navigate(`/register?${qs.toString()}`);
      return;
    }

    setBusy(true);
    try {
      const payload = buildPayload(asDraft);
      const res = editId != null ? await updateProduce(editId, payload) : await createProduce(payload);
      localStorage.removeItem(PENDING_KEY);
      setDone({ id: res.id, draft: asDraft });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setErr(e?.response?.data || 'Could not save your listing. Please try again.');
    } finally { setBusy(false); }
  };

  const scopeInfo: Record<Scope, string> = useMemo(() => ({
    Local: 'Sell and deliver within your country. Buyers see local freight estimates.',
    Export: 'International buyers only. Requires export-ready handling and certification.',
    Both: 'Available to local and international buyers.',
  }), []);

  if (done) {
    return (
      <div className="sell-page">
        <div className="sell-done card">
          <div className="sell-done-badge">{done.draft ? '📝' : '🎉'}</div>
          <h2>{done.draft ? 'Draft saved' : 'Your listing is live!'}</h2>
          <p>
            {done.draft
              ? 'We saved this as a draft. Finish the details and publish it any time from your account.'
              : 'Buyers across the exchange can now find and order your produce.'}
          </p>
          <div className="sell-done-actions">
            {!done.draft && done.id != null && (
              <Link to={`/produce/${done.id}`} className="btn btn-primary">View my listing →</Link>
            )}
            <Link to="/account" className="btn btn-outline">Manage my ads</Link>
            <button className="btn btn-outline" onClick={() => { setDone(null); setForm(EMPTY); setImages([]); setLoc({ lat: null, lng: null, label: '' }); setScope('Local'); }}>
              Post another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-page">
      <header className="sell-head">
        <span className="sell-kicker">＋ {editId != null ? 'Edit listing' : 'Sell on iTunda'}</span>
        <h1>{editId != null ? 'Update your produce listing' : 'List your produce to the world'}</h1>
        <p>
          Fill in your produce below — no account needed to start.{' '}
          {!isLoggedIn && <strong>You'll create a free account (or sign in) to publish at the end.</strong>}
        </p>
      </header>

      {notice && <div className="alert alert-success sell-alert">{notice}</div>}
      {err && <div className="alert alert-error sell-alert">{err}</div>}

      <div className="sell-form card">
        {/* Photos */}
        <div className="field-group">
          <label className="field-label">Produce photos <span className="sell-hint">— take a picture or upload (up to 6)</span></label>
          <div className="sell-uploader">
            {images.map((src, i) => (
              <div key={i} className="sell-thumb">
                <img src={src} alt={`photo ${i + 1}`} />
                <button type="button" className="sell-thumb-x" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="sell-add-photo">
                <input type="file" accept="image/*" capture="environment" multiple onChange={handleImages} hidden />
                {imgBusy ? '…' : <><span>＋</span><small>Add photo</small></>}
              </label>
            )}
          </div>
        </div>

        <div className="form-row-2">
          <div className="field-group">
            <label className="field-label">Produce name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Hass Avocado" />
          </div>
          <div className="field-group">
            <label className="field-label">Category</label>
            <select className="select" value={form.category} onChange={set('category')}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon(c)}  {c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row-3">
          <div className="field-group">
            <label className="field-label">Price</label>
            <input className="input" type="number" min="0" step="any" value={form.price} onChange={set('price')} placeholder="0.00" />
          </div>
          <div className="field-group">
            <label className="field-label">Unit</label>
            <select className="select" value={form.unit} onChange={set('unit')}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Quantity available</label>
            <input className="input" type="number" min="0" step="any" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 1250.5" />
          </div>
        </div>

        <div className="form-row-3">
          <div className="field-group">
            <label className="field-label">Planting date</label>
            <input className="input" type="date" value={form.plantingDate} onChange={set('plantingDate')} />
          </div>
          <div className="field-group">
            <label className="field-label">Harvest date</label>
            <input className="input" type="date" value={form.harvestDate} onChange={set('harvestDate')} />
          </div>
          <div className="field-group">
            <label className="field-label">Best before</label>
            <input className="input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
        </div>

        {/* Delivery scope */}
        <div className="field-group">
          <label className="field-label">Delivery</label>
          <div className="sell-scope">
            {(['Local', 'Export', 'Both'] as Scope[]).map(s => (
              <button key={s} type="button" className={`sell-scope-btn ${scope === s ? 'active' : ''}`} onClick={() => setScope(s)}>
                {s === 'Local' ? '🏠 Local (in-country)' : s === 'Export' ? '✈ Export' : '🌍 Local + Export'}
              </button>
            ))}
          </div>
          <p className="sell-hint">{scopeInfo[scope]}</p>
        </div>

        {/* Farm location */}
        <div className="field-group">
          <label className="field-label">Farm / pickup location</label>
          <LocationPicker
            lat={loc.lat} lng={loc.lng} label={loc.label}
            onChange={v => setLoc({ lat: v.lat, lng: v.lng, label: v.label ?? loc.label })}
            onLabelChange={l => setLoc(prev => ({ ...prev, label: l }))}
          />
        </div>

        <div className="form-row-2">
          <div className="field-group">
            <label className="field-label">Grade / quality <span className="sell-hint">(optional)</span></label>
            <input className="input" value={form.grade} onChange={set('grade')} placeholder="e.g. Grade A, Export Grade" />
          </div>
          <div className="field-group">
            <label className="field-label">Available from <span className="sell-hint">(optional schedule)</span></label>
            <input className="input" type="date" value={form.availableFrom} onChange={set('availableFrom')} />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Description <span className="sell-hint">(optional)</span></label>
          <textarea className="input textarea" rows={4} value={form.description} onChange={set('description')} placeholder="Variety, growing conditions, packaging, minimum order…" />
        </div>

        {!isLoggedIn && (
          <div className="field-group">
            <label className="field-label">Your name / seller name</label>
            <input className="input" value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Used for your temporary profile until you sign up" />
            <p className="sell-hint">We'll use this to set up your free account when you publish.</p>
          </div>
        )}

        <div className="sell-actions">
          <button className="btn btn-buy sell-publish" disabled={busy} onClick={() => submit(false)}>
            {busy ? 'Working…' : isLoggedIn ? (editId != null ? '✔ Save & publish' : '🌿 Publish listing') : '🌿 Continue to publish'}
          </button>
          <button className="btn btn-outline" disabled={busy} onClick={() => submit(true)}>
            {isLoggedIn ? 'Save as draft' : 'Save draft (sign up)'}
          </button>
        </div>
        {!isLoggedIn && (
          <p className="sell-signin-note">
            Already have an account? <Link to={`/login?next=/sell`}>Sign in</Link> to publish instantly.
          </p>
        )}
      </div>
    </div>
  );
}
