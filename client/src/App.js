import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5001/api';
const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('inventory');
  const [listingItem, setListingItem] = useState(null);
  const [soldItem, setSoldItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [activeBucket, setActiveBucket] = useState('at_home');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await axios.get(`${API}/items`);
    setItems(res.data);
  };

  const atHome = items.filter(i => i.status === 'at_home');
  const listed = items.filter(i => i.status === 'listed');
  const sold = items.filter(i => i.status === 'sold');

  return (
    <div className="app">
      <header className="header">
        <h1>Reseller Dashboard</h1>
        <nav>
          <button onClick={() => setView('inventory')} className={view === 'inventory' ? 'active' : ''}>Inventory</button>
          <button onClick={() => setView('byplatform')} className={view === 'byplatform' ? 'active' : ''}>By Platform</button>
          <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Dashboard</button>
<button onClick={() => setView('add')} className={view === 'add' ? 'active' : ''}>+ Add Item</button>
        </nav>
      </header>

      {view === 'inventory' && (
        <div className="inventory-wrapper">
          <div className="mobile-tabs">
            <button onClick={() => setActiveBucket('at_home')} className={activeBucket === 'at_home' ? 'mobile-tab active-at-home' : 'mobile-tab'}>At Home <span>{atHome.length}</span></button>
            <button onClick={() => setActiveBucket('listed')} className={activeBucket === 'listed' ? 'mobile-tab active-listed' : 'mobile-tab'}>Listed <span>{listed.length}</span></button>
            <button onClick={() => setActiveBucket('sold')} className={activeBucket === 'sold' ? 'mobile-tab active-sold' : 'mobile-tab'}>Sold <span>{sold.length}</span></button>
          </div>
          <div className="inventory">
            <div className={`bucket at-home ${activeBucket !== 'at_home' ? 'bucket-hidden' : ''}`}>
              <h2>At Home <span>{atHome.length}</span></h2>
              {atHome.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
            </div>
            <div className={`bucket listed ${activeBucket !== 'listed' ? 'bucket-hidden' : ''}`}>
              <h2>Listed <span>{listed.length}</span></h2>
              {listed.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
            </div>
            <div className={`bucket sold ${activeBucket !== 'sold' ? 'bucket-hidden' : ''}`}>
              <h2>Sold <span>{sold.length}</span></h2>
              {sold.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
            </div>
          </div>
        </div>
      )}

      {view === 'add' && <AddItemForm refresh={fetchItems} setView={setView} />}
      {listingItem && <ListingModal item={listingItem} onClose={() => setListingItem(null)} refresh={fetchItems} />}
      {soldItem && <SoldModal item={soldItem} onClose={() => setSoldItem(null)} refresh={fetchItems} />}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} refresh={fetchItems} />}
      {deleteItem && <DeleteModal item={deleteItem} onClose={() => setDeleteItem(null)} refresh={fetchItems} />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'byplatform' && <ByPlatform onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} refresh={items} />}
    </div>
  );
}

function ItemCard({ item, refresh, onList, onSold, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleList = () => {
    onList(item);
  };

  const handleSold = () => {
    onSold(item);
  };

  const handleRevert = async () => {
    await axios.patch(`${API}/items/${item.id}/revert`);
    refresh();
  };

  const profit = item.status === 'sold' && item.sale_price
    ? parseFloat(item.sale_price) - parseFloat(item.cost) - parseFloat(item.platform_fees || 0) - parseFloat(item.shipping_costs || 0)
    : null;

  return (
    <div className="item-card">
      <div className="item-name">{item.name}</div>
      <div className="item-meta">{item.category} · {item.location}</div>
      <div className="item-meta">Cost: {formatCurrency(item.cost)}</div>
      {item.status === 'listed' && item.asking_price && (
        <div className="item-meta">Asking: {formatCurrency(item.asking_price)}</div>
      )}
      {item.status === 'listed' && item.platform && (
        <div className="item-meta">Platform: {item.platform}</div>
      )}
      {item.status === 'sold' && item.sale_price && (
        <div className="item-meta">Sold for: {formatCurrency(item.sale_price)}</div>
      )}
      {item.status === 'sold' && item.sold_at && (
        <div className="item-meta">Sold on: {new Date(item.sold_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      )}
      {profit && <div className="item-profit">Profit: {formatCurrency(profit)}</div>}
      <div className={`item-status ${item.status}`}>{item.status.replace('_', ' ')}</div>
      <div className="photos-toggle" onClick={async () => { await axios.patch(`${API}/items/${item.id}/photos`); refresh(); }}>
        {item.photos_ready ? '📷 Photos ready' : '📷 No photos yet'}
      </div>
      {item.status === 'listed' && item.listed_at && (
        <div className="item-meta days-sitting">
          {Math.floor((new Date() - new Date(item.listed_at)) / (1000 * 60 * 60 * 24))} days listed
        </div>
      )}
      <div className="item-actions">
        <div className="menu-wrapper" onBlur={() => setTimeout(() => setMenuOpen(false), 150)}>
          <button className="btn-menu" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
          {menuOpen && (
            <div className="menu-dropdown">
              {item.status === 'at_home' && (
                <button onClick={() => { handleList(); setMenuOpen(false); }}>Mark as Listed</button>
              )}
              {item.status === 'listed' && (
                <button onClick={() => { handleSold(); setMenuOpen(false); }}>Mark as Sold</button>
              )}
              {item.status === 'listed' && (
                <button onClick={() => { handleRevert(); setMenuOpen(false); }}>Unlist</button>
              )}
              {item.status === 'sold' && (
                <button onClick={() => { handleRevert(); setMenuOpen(false); }}>Undo Sale</button>
              )}
              <button onClick={() => { onEdit(item); setMenuOpen(false); }}>Edit</button>
              <button className="danger" onClick={() => { onDelete(item); setMenuOpen(false); }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ refresh, setView }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Electronics',
    cost: '', location: '', quantity: 1, brand: '',
    model: '', dimensions: '', color: '', condition: '', sku: ''
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('Please enter an item name.');
      return;
    }
    if (!form.cost && form.cost !== 0) {
      alert('Please enter a cost. Use 0 if it was free.');
      return;
    }
    await axios.post(`${API}/items`, {
      ...form,
      added_by: '6e9219cc-fc42-4511-be63-98536283cc50'
    });
    refresh();
    setView('inventory');
  };

  return (
    <div className="form-container">
      <h2>Add New Item</h2>
      <input placeholder="Item name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
        <option>Electronics</option>
        <option>Tools</option>
        <option>Home & Kitchen</option>
        <option>Clothing</option>
        <option>Collectibles</option>
        <option>Other</option>
      </select>
      <input placeholder="Cost ($) *" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
      <input placeholder="Location (e.g. Basement)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
      <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
      <input placeholder="Brand" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
      <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
      <input placeholder="Dimensions (e.g. 10x5x3 in)" value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} />
      <input placeholder="Color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
      <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
        <option value="">Condition</option>
        <option>New</option>
        <option>Like New</option>
        <option>Good</option>
        <option>Fair</option>
        <option>Poor</option>
      </select>
      <input placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
      <button onClick={handleSubmit}>Add Item</button>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/analytics`).then(res => setData(res.data));
  }, []);

  if (!data) return <div style={{padding: '2rem'}}>Loading...</div>;

  const { financials, byMarketplaceListed, byMarketplaceFinancials, byCategory, expiring } = data;

  return (
    <div className="dashboard">

      <section className="dash-section">
        <h2>Overall Performance</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Gross Income</div>
            <div className="stat-value">{formatCurrency(financials.gross_income)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cost</div>
            <div className="stat-value">{formatCurrency(financials.total_cost)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fees & Shipping</div>
            <div className="stat-value">{formatCurrency(parseFloat(financials.total_fees) + parseFloat(financials.total_shipping))}</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value">{formatCurrency(financials.net_profit)}</div>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <h2>Expiring Listings <span className="section-sub">sorted by soonest</span></h2>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Platform</th>
              <th>Asking Price</th>
              <th>Days Left</th>
            </tr>
          </thead>
          <tbody>
            {expiring.map(l => (
              <tr key={l.listing_id} className={l.days_left <= 7 ? 'urgent' : ''}>
                <td>{l.name}</td>
                <td>{l.platform}</td>
                <td>{formatCurrency(l.asking_price)}</td>
                <td>{l.days_left} days</td>
              </tr>
            ))}
            {expiring.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', color:'#888'}}>No active listings</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="dash-section">
        <h2>Currently Listed by Marketplace</h2>
        <table className="dash-table">
          <thead>
            <tr><th>Platform</th><th>Active Listings</th></tr>
          </thead>
          <tbody>
            {byMarketplaceListed.map(m => (
              <tr key={m.platform}>
                <td>{m.platform}</td>
                <td>{m.listed_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dash-section">
        <h2>Performance by Marketplace</h2>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Sold</th>
              <th>Gross</th>
              <th>Fees</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {byMarketplaceFinancials.map(m => (
              <tr key={m.platform}>
                <td>{m.platform}</td>
                <td>{m.total_sold}</td>
                <td>{formatCurrency(m.gross_income)}</td>
                <td>{formatCurrency(parseFloat(m.total_fees) + parseFloat(m.total_shipping))}</td>
                <td className="profit">{formatCurrency(m.net_profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dash-section">
        <h2>Performance by Category</h2>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Sold</th>
              <th>Listed</th>
              <th>At Home</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map(c => (
              <tr key={c.category}>
                <td>{c.category}</td>
                <td>{c.total_sold}</td>
                <td>{c.total_listed}</td>
                <td>{c.total_at_home}</td>
                <td className="profit">{formatCurrency(c.net_profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}

function ListingModal({ item, onClose, refresh }) {
  const [form, setForm] = useState({
    platform: 'eBay',
    asking_price: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.asking_price) {
      setError('Please enter an asking price.');
      return;
    }
    await axios.post(`${API}/listings`, {
      item_id: item.id,
      platform: form.platform,
      asking_price: parseFloat(form.asking_price)
    });
    refresh();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>List "{item.name}"</h2>
        <p className="modal-sub">Where are you listing this?</p>
        <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
          <option>eBay</option>
          <option>Mercari</option>
          <option>Facebook Marketplace</option>
          <option>OfferUp</option>
          <option>Poshmark</option>
        </select>
        <input
          placeholder="Asking price ($)"
          type="number"
          value={form.asking_price}
          onChange={e => setForm({...form, asking_price: e.target.value})}
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSubmit} className="btn-confirm">List Item</button>
        </div>
      </div>
    </div>
  );
}

function SoldModal({ item, onClose, refresh }) {
  const [form, setForm] = useState({
    sale_price: '',
    platform_fees: '',
    shipping_costs: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.sale_price) {
      setError('Please enter a sale price.');
      return;
    }
    const listingRes = await axios.get(`${API}/listings/${item.id}`);
    const listing = listingRes.data[0];
    if (!listing) {
      setError('No listing found for this item.');
      return;
    }
    await axios.patch(`${API}/listings/${listing.id}/sold`, {
      item_id: item.id,
      sale_price: parseFloat(form.sale_price),
      platform_fees: parseFloat(form.platform_fees || 0),
      shipping_costs: parseFloat(form.shipping_costs || 0)
    });
    refresh();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Mark "{item.name}" as Sold</h2>
        <p className="modal-sub">Enter the sale details</p>
        <input
          placeholder="Sale price ($)"
          type="number"
          value={form.sale_price}
          onChange={e => setForm({...form, sale_price: e.target.value})}
        />
        <input
          placeholder="Platform fees ($) — optional"
          type="number"
          value={form.platform_fees}
          onChange={e => setForm({...form, platform_fees: e.target.value})}
        />
        <input
          placeholder="Shipping costs ($) — optional"
          type="number"
          value={form.shipping_costs}
          onChange={e => setForm({...form, shipping_costs: e.target.value})}
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSubmit} className="btn-confirm">Confirm Sale</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, onClose, refresh }) {
  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || 'Electronics',
    cost: item.cost || '',
    location: item.location || '',
    quantity: item.quantity || 1,
    brand: item.brand || '',
    model: item.model || '',
    dimensions: item.dimensions || '',
    color: item.color || '',
    condition: item.condition || '',
    sku: item.sku || ''
  });

  const handleSubmit = async () => {
    await axios.patch(`${API}/items/${item.id}`, form);
    refresh();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Item</h2>
        <input placeholder="Item name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
          <option>Electronics</option>
          <option>Tools</option>
          <option>Home & Kitchen</option>
          <option>Clothing</option>
          <option>Collectibles</option>
          <option>Other</option>
        </select>
        <input placeholder="Cost ($)" type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
        <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
        <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        <input placeholder="Brand" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
        <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
        <input placeholder="Dimensions (e.g. 10x5x3 in)" value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} />
        <input placeholder="Color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
        <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
          <option value="">Condition</option>
          <option>New</option>
          <option>Like New</option>
          <option>Good</option>
          <option>Fair</option>
          <option>Poor</option>
        </select>
        <input placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSubmit} className="btn-confirm">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ item, onClose, refresh }) {
  const handleDelete = async () => {
    await axios.delete(`${API}/items/${item.id}`);
    refresh();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Delete "{item.name}"?</h2>
        <p className="modal-sub">This will permanently delete the item and all its listings. This cannot be undone.</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleDelete} className="btn-delete-confirm">Delete</button>
        </div>
      </div>
    </div>
  );
}

function PlatformCardMenu({ item, onEdit, onDelete, onSold }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="menu-wrapper" onBlur={() => setTimeout(() => setMenuOpen(false), 150)}>
      <button className="btn-menu" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
      {menuOpen && (
        <div className="menu-dropdown">
          <button onClick={() => { onSold(item); setMenuOpen(false); }}>Mark as Sold</button>
          <button onClick={() => { onEdit(item); setMenuOpen(false); }}>Edit</button>
          <button className="danger" onClick={() => { onDelete(item); setMenuOpen(false); }}>Delete</button>
        </div>
      )}
    </div>
  );
}

function ByPlatform({ onSold, onEdit, onDelete, refresh }) {
  const [items, setItems] = useState([]);

  const fetchItems = () => {
    axios.get(`${API}/items`).then(res => {
      setItems(res.data.filter(i => i.status === 'listed'));
    });
  };

  useEffect(() => {
    fetchItems();
  }, [refresh]);

  const platforms = [...new Set(items.map(i => i.platform).filter(Boolean))];

  if (items.length === 0) return (
    <div style={{padding: '2rem', color: '#888'}}>No items currently listed on any platform.</div>
  );

  return (
    <div className="byplatform">
      {platforms.map(platform => (
        <div key={platform} className="platform-column">
          <div className="platform-header">
            <h2>{platform}</h2>
            <span>{items.filter(i => i.platform === platform).length} listed</span>
          </div>
          {items.filter(i => i.platform === platform).map(item => (
            <div key={item.id} className="platform-card">
              <div className="platform-card-name">{item.name}</div>
              <div className="platform-card-row"><span>Category</span><span>{item.category}</span></div>
              <div className="platform-card-row"><span>Description</span><span>{item.description || '—'}</span></div>
              <div className="platform-card-row"><span>Location</span><span>{item.location}</span></div>
              <div className="platform-card-row"><span>Cost</span><span>{formatCurrency(item.cost)}</span></div>
              <div className="platform-card-row"><span>Asking Price</span><span>{formatCurrency(item.asking_price)}</span></div>
              <div className="platform-card-row"><span>Days Listed</span><span>{Math.floor((new Date() - new Date(item.listed_at)) / (1000 * 60 * 60 * 24))} days</span></div>
              <div className="platform-card-row"><span>Photos Ready</span><span>{item.photos_ready ? '✓ Yes' : '✗ No'}</span></div>
              {item.brand && <div className="platform-card-row"><span>Brand</span><span>{item.brand}</span></div>}
              {item.model && <div className="platform-card-row"><span>Model</span><span>{item.model}</span></div>}
              {item.dimensions && <div className="platform-card-row"><span>Dimensions</span><span>{item.dimensions}</span></div>}
              {item.color && <div className="platform-card-row"><span>Color</span><span>{item.color}</span></div>}
              {item.condition && <div className="platform-card-row"><span>Condition</span><span>{item.condition}</span></div>}
              {item.sku && <div className="platform-card-row"><span>SKU</span><span>{item.sku}</span></div>}
              {item.quantity > 1 && <div className="platform-card-row"><span>Quantity</span><span>{item.quantity}</span></div>}
              <div className="platform-card-actions">
                <PlatformCardMenu item={item} onEdit={onEdit} onDelete={onDelete} onSold={onSold} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;