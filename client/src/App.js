import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5001/api';

function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('inventory');

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
          <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Dashboard</button>
<button onClick={() => setView('add')} className={view === 'add' ? 'active' : ''}>+ Add Item</button>
        </nav>
      </header>

      {view === 'inventory' && (
        <div className="inventory">
          <div className="bucket">
            <h2>At Home <span>{atHome.length}</span></h2>
            {atHome.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} />)}
          </div>
          <div className="bucket">
            <h2>Listed <span>{listed.length}</span></h2>
            {listed.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} />)}
          </div>
          <div className="bucket">
            <h2>Sold <span>{sold.length}</span></h2>
            {sold.map(item => <ItemCard key={item.id} item={item} refresh={fetchItems} />)}
          </div>
        </div>
      )}

      {view === 'add' && <AddItemForm refresh={fetchItems} setView={setView} />}
      {view === 'dashboard' && <Dashboard />}
    </div>
  );
}

function ItemCard({ item, refresh }) {
  const handleList = async () => {
    const platform = prompt('Which platform? (eBay, Mercari, Facebook)');
    const asking_price = prompt('Asking price?');
    if (!platform || !asking_price) return;
    await axios.post(`${API}/listings`, {
      item_id: item.id,
      platform,
      asking_price: parseFloat(asking_price)
    });
    refresh();
  };

  const handleSold = async () => {
    const sale_price = prompt('Sale price?');
    const platform_fees = prompt('Platform fees?');
    const shipping_costs = prompt('Shipping cost?');
    if (!sale_price) return;
    const listingRes = await axios.get(`${API}/listings/${item.id}`);
    const listing = listingRes.data[0];
    if (!listing) return alert('No listing found for this item');
    await axios.patch(`${API}/listings/${listing.id}/sold`, {
      item_id: item.id,
      sale_price: parseFloat(sale_price),
      platform_fees: parseFloat(platform_fees || 0),
      shipping_costs: parseFloat(shipping_costs || 0)
    });
    refresh();
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

export default App;