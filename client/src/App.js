import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5001/api';

function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('inventory');
  const [listingItem, setListingItem] = useState(null);
  const [soldItem, setSoldItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

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
        <div className="inventory">
          <div className="bucket">
            <h2>At Home <span>{atHome.length}</span></h2>
            {atHome.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
          </div>
          <div className="bucket">
            <h2>Listed <span>{listed.length}</span></h2>
            {listed.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
          </div>
          <div className="bucket">
            <h2>Sold <span>{sold.length}</span></h2>
            {sold.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} onList={setListingItem} onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />)}
          </div>
        </div>
      )}

      {view === 'add' && <AddItemForm refresh={fetchItems} setView={setView} />}
      {listingItem && <ListingModal item={listingItem} onClose={() => setListingItem(null)} refresh={fetchItems} />}
      {soldItem && <SoldModal item={soldItem} onClose={() => setSoldItem(null)} refresh={fetchItems} />}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} refresh={fetchItems} />}
      {deleteItem && <DeleteModal item={deleteItem} onClose={() => setDeleteItem(null)} refresh={fetchItems} />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'byplatform' && <ByPlatform onSold={setSoldItem} onEdit={setEditItem} onDelete={setDeleteItem} />}
    </div>
  );
}

function ItemCard({ item, refresh, onList, onSold, onEdit, onDelete }) {
  const handleList = () => {
    onList(item);
  };

  const handleSold = () => {
    onSold(item);
  };

  const profit = item.status === 'sold' && item.sale_price
    ? (parseFloat(item.sale_price) - parseFloat(item.cost)).toFixed(2)
    : null;

  return (
    <div className="item-card">
      <div className="item-name">{item.name}</div>
      <div className="item-meta">{item.category} · {item.location}</div>
      <div className="item-meta">Cost: ${item.cost}</div>
      {profit && <div className="item-meta profit">Profit: ${profit}</div>}
      <div className={`item-status ${item.status}`}>{item.status.replace('_', ' ')}</div>
      {item.status === 'listed' && item.listed_at && (
        <div className="item-meta days-sitting">
          {Math.floor((new Date() - new Date(item.listed_at)) / (1000 * 60 * 60 * 24))} days listed
        </div>
      )}
      <div className="item-actions">
        {item.status === 'at_home' && (
          <button onClick={handleList} className="btn-list">Mark as Listed</button>
        )}
        {item.status === 'listed' && (
          <button onClick={handleSold} className="btn-sold">Mark as Sold</button>
        )}
        <button onClick={() => onEdit(item)} className="btn-edit">Edit</button>
        <button onClick={() => onDelete(item)} className="btn-delete">Delete</button>
      </div>
    </div>
  );
}

function AddItemForm({ refresh, setView }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'Electronics',
    cost: '', location: ''
  });

  const handleSubmit = async () => {
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
      <input placeholder="Location (e.g. Basement)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
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
            <div className="stat-value">${parseFloat(financials.gross_income).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cost</div>
            <div className="stat-value">${parseFloat(financials.total_cost).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fees & Shipping</div>
            <div className="stat-value">${(parseFloat(financials.total_fees) + parseFloat(financials.total_shipping)).toFixed(2)}</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value">${parseFloat(financials.net_profit).toFixed(2)}</div>
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
                <td>${parseFloat(l.asking_price).toFixed(2)}</td>
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
                <td>${parseFloat(m.gross_income).toFixed(2)}</td>
                <td>${(parseFloat(m.total_fees) + parseFloat(m.total_shipping)).toFixed(2)}</td>
                <td className="profit">${parseFloat(m.net_profit).toFixed(2)}</td>
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
                <td className="profit">${parseFloat(c.net_profit).toFixed(2)}</td>
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
    location: item.location || ''
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

function ByPlatform({ onSold, onEdit, onDelete }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${API}/items`).then(res => {
      setItems(res.data.filter(i => i.status === 'listed'));
    });
  }, []);

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
              <div className="platform-card-row"><span>Cost</span><span>${item.cost}</span></div>
              <div className="platform-card-row"><span>Asking Price</span><span>${item.asking_price}</span></div>
              <div className="platform-card-row"><span>Days Listed</span><span>{Math.floor((new Date() - new Date(item.listed_at)) / (1000 * 60 * 60 * 24))} days</span></div>
              <div className="platform-card-row">
                <span>Photos Ready</span>
                <span>{item.photos_ready ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="platform-card-actions">
                <button onClick={() => onEdit(item)} className="btn-edit">Edit</button>
                <button onClick={() => onDelete(item)} className="btn-delete">Delete</button>
                <button onClick={() => onSold(item)} className="btn-sold">Mark as Sold</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;