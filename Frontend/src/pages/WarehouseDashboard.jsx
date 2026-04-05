import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import WarehouseSidebar from '../components/WarehouseSidebar';
import {
    Package, Truck, Boxes, User, LogOut, Store, CheckCircle2,
    Activity, Search, Loader2, RefreshCw, AlertCircle, MapPin, 
    ShoppingBag, ChevronRight, Edit2, Check, X, AlertTriangle,
    Clock, TrendingUp, Users, Map, BarChart2, Bell, ShieldAlert,
    ScanLine, RefreshCcw
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateProfile } from '../features/auth/authSlice';

const API = 'http://localhost:8000/api';

// ─── Shared hook ────────────────────────────────────────────────────────────────
function useWarehouseData(accessToken) {
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [loading, setLoading] = useState(true);

    const safeFetch = async (url, headers) => {
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) { return null; }
    };

    const fetchAll = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${accessToken}` };
            const [ord, inv, ana] = await Promise.all([
                safeFetch(`${API}/warehouse/orders/`, headers),
                safeFetch(`${API}/warehouse/inventory/`, headers),
                safeFetch(`${API}/warehouse/analytics/`, headers),
            ]);
            
            setOrders(Array.isArray(ord) ? ord : ord?.results || []);
            setInventory(Array.isArray(inv) ? inv : inv?.results || []);
            setAnalytics(ana || {});
        } catch (e) {
            console.error('Warehouse fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [accessToken]);
    return { orders, inventory, analytics, loading, refetch: fetchAll };
}

// ─── Shared Components ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
        packed:           'bg-blue-50 text-blue-700 border-blue-200',
        out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
        delivered:        'bg-green-50 text-green-700 border-green-200',
        cancelled:        'bg-red-50 text-[#e62020] border-red-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${map[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

const StatCard = ({ title, value, icon, sub, colorClass }) => (
    <div className="bg-white p-7 rounded-[28px] border border-gray-100 shadow-lg hover:shadow-xl transition-all h-full">
        <div className="flex justify-between items-start mb-5">
            <div className={`p-3.5 rounded-2xl ${colorClass}`}>{icon}</div>
            {sub && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{sub}</span>}
        </div>
        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
);

// ─── Dashboard Overview ──────────────────────────────────────────────────────
const DashboardOverview = () => {
    const { accessToken } = useSelector(s => s.auth);
    const { analytics, loading, refetch } = useWarehouseData(accessToken);

    if (loading || !analytics) return <div className="h-full flex items-center justify-center"><Loader2 size={36} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Real-Time Overview</h1>
                    <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[11px]">Live telemetry & hub health</p>
                </div>
                <button onClick={refetch} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:border-[#e62020] hover:text-[#e62020] transition-all">
                    <RefreshCw size={14} /> Sync Telemetry
                </button>
            </div>

            <div className="bg-gray-900 text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden flex justify-between items-center z-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 z-0"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-2">Warehouse Performance</p>
                    <div className="flex items-end gap-4">
                        <h2 className="text-4xl font-black tracking-tighter uppercase">{analytics.sla_rating || "98.2%"} <span className="text-lg text-gray-400 tracking-widest leading-none">SLA</span></h2>
                        <span className="flex items-center gap-1 text-green-400 text-sm font-black uppercase bg-green-400/10 px-3 py-1 rounded-full"><TrendingUp size={14}/> +2.4% vs Yesterday</span>
                    </div>
                </div>
                <div className="flex gap-8 relative z-10 text-right">
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Avg Pick Time</p>
                        <p className="text-xl font-black">{analytics.avg_pick_time || "2m 14s"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Avg Pack Time</p>
                        <p className="text-xl font-black">{analytics.avg_pack_time || "1m 45s"}</p>
                    </div>
                </div>
            </div>

            <h2 className="font-black text-gray-900 text-xl uppercase tracking-tighter border-b border-gray-100 pb-4 mb-6">Order Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Received (Pending)" value={analytics.pending_count || 0} icon={<ShoppingBag size={22} />} colorClass="bg-yellow-50 text-yellow-600" />
                <StatCard title="Processing (Packed)" value={analytics.packed_count || 0} icon={<Package size={22} />} colorClass="bg-blue-50 text-blue-600" />
                <StatCard title="Dispatched (Out)" value={analytics.dispatched_count || 0} icon={<CheckCircle2 size={22} />} colorClass="bg-green-50 text-green-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard title="Total Sold (Completed)" value={analytics.delivered_count || 0} icon={<Check size={22} />} colorClass="bg-green-50 text-green-700" />
                <StatCard title="Total Revenue" value={`NPR ${analytics.total_revenue?.toLocaleString() || 0}`} icon={<TrendingUp size={22} />} colorClass="bg-red-50 text-[#e62020]" />
                <StatCard title="Low Stock Alerts" value={analytics.low_stock_count || 0} icon={<AlertTriangle size={22} />} colorClass="bg-orange-50 text-orange-600" />
                <StatCard title="Out of Stock Items" value={analytics.out_of_stock_count || 0} icon={<AlertCircle size={22} />} colorClass="bg-red-50 text-[#e62020]" />
            </div>
        </div>
    );
};

// ─── Incoming Orders Module ──────────────────────────────────────────────────
const IncomingOrders = () => {
    const { accessToken } = useSelector(s => s.auth);
    const { orders, loading, refetch } = useWarehouseData(accessToken);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const filtered = orders.filter(o => {
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q || String(o.id).includes(q) || (o.user_email || '').toLowerCase().includes(q) || (o.status || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const packOrder = async (orderId) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`${API}/warehouse/orders/${orderId}/pack/`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
            if (res.ok) refetch(); else alert('Could not pack order.');
        } catch (e) {} finally { setActionLoading(null); }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 size={36} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Order Queue</h1>
                    <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2"><ShoppingBag size={13} className="text-[#e62020]" /> {orders.length} orders total</p>
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg p-5 flex justify-between items-center gap-4">
                <div className="flex gap-3">
                    {['all', 'pending', 'packed', 'out_for_delivery'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-[#e62020] text-white shadow-lg shadow-red-500/20' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                            {s.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" placeholder="Search orders..." className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:border-[#e62020]" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr><th className="px-8 py-4">ID</th><th className="px-8 py-4">Customer Info</th><th className="px-8 py-4">Summary</th><th className="px-8 py-4 text-center">Status</th><th className="px-8 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 border-gray-100">
                                <td className="px-8 py-4 font-black">#{order.id}</td>
                                <td className="px-8 py-4 text-xs font-bold text-gray-500">
                                    <span className="block text-gray-900 mb-0.5">{order.user_email || order.user}</span>
                                    {order.shipping_address && <span className="text-[10px] text-gray-400 uppercase tracking-widest">{order.shipping_address.replace(/,.*$/, '')}</span>}
                                </td>
                                <td className="px-8 py-4 text-xs font-bold text-gray-500">{order.items?.length ?? 0} items | NPR {order.total_amount}</td>
                                <td className="px-8 py-4 text-center"><StatusBadge status={order.status} /></td>
                                <td className="px-8 py-4 text-right">
                                    {order.status === 'pending' ? (
                                        <button onClick={() => packOrder(order.id)} disabled={actionLoading === order.id} className="inline-flex items-center gap-2 px-4 py-2 bg-[#e62020] text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 active:scale-95 transition-all">
                                            {actionLoading === order.id ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} Pack Order
                                        </button>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Stock Inventory Module ──────────────────────────────────────────────────
const StockInventory = () => {
    const { accessToken } = useSelector(s => s.auth);
    const { inventory, loading, refetch } = useWarehouseData(accessToken);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingStockId, setEditingStockId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const filtered = inventory.filter(item => {
        const matchStatus = statusFilter === 'all' || item.stock_status === statusFilter;
        return matchStatus && (!search || (item.product_name || '').toLowerCase().includes(search.toLowerCase()));
    });

    const handleSaveStock = async (itemId) => {
        if (editValue === '' || isNaN(editValue) || parseInt(editValue) < 0) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API}/warehouse/inventory/${itemId}/`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock_quantity: parseInt(editValue) })
            });
            if (res.ok) { setEditingStockId(null); refetch(); } else alert('Failed to update stock');
        } catch (e) { } finally { setIsSaving(false); }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 size={36} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-end">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Inventory Control</h1>
                <button onClick={refetch} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:border-[#e62020] hover:text-[#e62020] transition-all">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg p-5 flex gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {[ { key: 'all', label: 'All' }, { key: 'in_stock', label: 'In Stock' }, { key: 'low_stock', label: 'Low Stock' }, { key: 'out_of_stock', label: 'Out of Stock' } ].map(s => (
                        <button key={s.key} onClick={() => setStatusFilter(s.key)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s.key ? 'bg-[#e62020] text-white shadow-lg shadow-red-500/20' : 'bg-gray-50 text-gray-500'}`}>{s.label}</button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" placeholder="Search products..." className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:border-[#e62020]" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr><th className="px-8 py-4">SKU</th><th className="px-8 py-4">Product Name</th><th className="px-8 py-4 text-center">Net Qty</th><th className="px-8 py-4 text-center">Status</th><th className="px-8 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-red-50/10">
                                <td className="px-8 py-4 text-[10px] text-gray-400 font-mono font-bold">{item.product_sku || '—'}</td>
                                <td className="px-8 py-4 text-sm font-black text-gray-900">{item.product_name}</td>
                                <td className="px-8 py-4 text-center">
                                    {editingStockId === item.id ? (
                                        <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} disabled={isSaving} className="w-20 text-center font-black border-b-2 border-[#e62020] outline-none" autoFocus />
                                    ) : ( <span className="font-black text-base">{item.stock_quantity}</span> )}
                                </td>
                                <td className="px-8 py-4 text-center"><StatusBadge status={item.stock_status} /></td>
                                <td className="px-8 py-4 text-right">
                                    {editingStockId === item.id ? (
                                        <div className="flex justify-end gap-2 text-white">
                                            <button onClick={() => setEditingStockId(null)} className="p-1.5 bg-gray-300 rounded"><X size={14}/></button>
                                            <button onClick={() => handleSaveStock(item.id)} className="p-1.5 bg-green-500 rounded"><Check size={14}/></button>
                                        </div>
                                    ) : ( <button onClick={() => { setEditingStockId(item.id); setEditValue(item.stock_quantity); }} className="text-[10px] font-black uppercase text-[#e62020] hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100"><Edit2 size={12} className="inline mr-1"/>Update</button> )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Dispatch Module ─────────────────────────────────────────────────────────
const DispatchModule = () => {
    const { accessToken } = useSelector(s => s.auth);
    const { orders, loading, refetch } = useWarehouseData(accessToken);
    const [actionLoading, setActionLoading] = useState(null);
    const packedOrders = orders.filter(o => o.status === 'packed');

    const pingRiders = async (orderId) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`${API}/warehouse/orders/${orderId}/assign-delivery/`, { 
                method: 'POST', 
                headers: { Authorization: `Bearer ${accessToken}` } 
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.detail);
                refetch();
            } else {
                alert(data.detail || 'Failed to ping riders.');
            }
        } catch (e) {
            console.error(e);
        } finally { 
            setActionLoading(null); 
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Dispatch Queue</h1>
            
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg p-10 text-center">
                {packedOrders.length > 0 ? (
                    <div>
                        <h3 className="font-black text-gray-900 text-xl uppercase tracking-tighter border-b border-gray-100 pb-4 mb-6 text-left">Awaiting Rider Assignment</h3>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <tr><th className="px-8 py-4">Order ID</th><th className="px-8 py-4">Items / Dest</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Action</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {packedOrders.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50">
                                        <td className="px-8 py-4 font-black text-gray-900">#{o.id}</td>
                                        <td className="px-8 py-4 text-xs font-bold text-gray-500">{o.items?.length ?? 0} items for {o.shipping_address ? o.shipping_address.replace(/,.*$/, '') : 'Customer'}</td>
                                        <td className="px-8 py-4 text-sm text-blue-600 font-black uppercase">Ready for Pickup</td>
                                        <td className="px-8 py-4 text-right">
                                            <button 
                                                onClick={() => pingRiders(o.id)}
                                                disabled={actionLoading === o.id}
                                                className="bg-gray-900 hover:bg-[#e62020] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === o.id ? 'Pinging...' : 'Ping Riders'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10">
                        <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="font-black text-gray-900 text-xl uppercase mb-2">No Packages Pending</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">All packed orders are currently Dispatched.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Alerts System Module ────────────────────────────────────────────────────
const AlertsModule = () => {
    const { accessToken } = useSelector(s => s.auth);
    const { inventory, loading } = useWarehouseData(accessToken);
    const [dismissed, setDismissed] = useState(new Set());

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#e62020]" /></div>;

    const alerts = inventory.filter(i => (i.stock_status === 'low_stock' || i.stock_status === 'out_of_stock') && !dismissed.has(i.id));

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">System Alerts</h1>
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
                    <ShieldAlert size={24} className="text-[#e62020]" />
                    <h2 className="font-black text-[#e62020] text-xl uppercase tracking-tighter">Inventory Warnings</h2>
                </div>
                <div className="p-6 space-y-4">
                    {alerts.length === 0 ? <p className="text-sm font-bold text-gray-400">System operating normally. No alerts.</p> :
                        alerts.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${item.stock_status === 'out_of_stock' ? 'bg-red-100 text-[#e62020]' : 'bg-orange-100 text-orange-500'}`}><AlertTriangle size={18} /></div>
                                    <div>
                                        <p className="font-black text-gray-900 uppercase">Stock Fluctuation: SKU {item.product_sku || item.id}</p>
                                        <p className="text-xs font-bold text-gray-500 tracking-widest">{item.product_name} is currently {item.stock_status.replace(/_/g, ' ')} ({item.stock_quantity} left)</p>
                                    </div>
                                </div>
                                <button onClick={() => setDismissed(new Set(dismissed).add(item.id))} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black text-gray-500 uppercase hover:text-[#e62020] hover:border-[#e62020] transition-colors">Dismiss</button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

// ─── Customers Hub Module ────────────────────────────────────────────────────
const CustomersModule = () => {
    const { accessToken } = useSelector(s => s.auth);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch(`${API}/warehouse/customers/`, { headers: { Authorization: `Bearer ${accessToken}` } });
                const data = await res.json();
                setUsersList(Array.isArray(data) ? data : []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchCustomers();
    }, [accessToken]);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Hub Customers</h1>
            <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[11px] mb-8">Users ordering from this warehouse</p>
            
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr><th className="px-8 py-4">Customer Email</th><th className="px-8 py-4">Total Orders</th><th className="px-8 py-4">Total Spent</th><th className="px-8 py-4 text-right">Latest Order</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {usersList.map(u => (
                            <tr key={u.email} className="hover:bg-gray-50">
                                <td className="px-8 py-4 font-black text-gray-900">{u.email}</td>
                                <td className="px-8 py-4 text-xs font-bold text-gray-500">{u.orderCount} orders</td>
                                <td className="px-8 py-4 text-xs font-black text-gray-500">NPR {u.totalSpent.toFixed(2)}</td>
                                <td className="px-8 py-4 text-right text-[10px] text-gray-400 uppercase tracking-widest">{u.latestOrder ? new Date(u.latestOrder).toLocaleDateString() : '—'}</td>
                            </tr>
                        ))}
                        {usersList.length === 0 && (
                            <tr><td colSpan="4" className="p-10 text-center text-sm font-black text-gray-300 uppercase">No customer data found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Analytics Module ────────────────────────────────────────────────────────
const AnalyticsModule = () => {
    const { accessToken } = useSelector(s => s.auth);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`${API}/warehouse/reports/`, { headers: { Authorization: `Bearer ${accessToken}` } });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || data.detail || 'Failed to fetch hub pulse.');
                    return;
                }
                setReportData(data);
            } catch (e) {
                setError('Hub connection lost. Check server vault.');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [accessToken]);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#e62020]" /></div>;

    if (error) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-center h-[60vh] max-w-[600px] mx-auto">
                <div className="bg-red-50 p-10 rounded-[32px] border border-red-100 mb-6">
                    <ShieldAlert size={48} className="text-[#e62020] mx-auto mb-4" />
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tighter mb-2">Reports Hub Offline</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{error}</p>
                </div>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#e62020] transition-colors">Re-Initialize Pulse</button>
            </div>
        );
    }

    const totalItemsSold = reportData?.overall_products_sold || 0;
    const totalIncome = reportData?.total_income_gain || 0;
    const outOfStockCount = reportData?.out_of_stock_count || 0;
    const topItems = reportData?.velocity_data || [];

    return (
        <div className="p-10 space-y-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500 print:p-0 print:m-0 print:space-y-4 print:text-black print:bg-white print:w-full">
            <div className="flex justify-between items-end print:pb-4 border-b border-transparent print:border-gray-200">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Operational Reports</h1>
                    <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-[11px] mb-8 print:mb-2 text-left">Volume and SKU velocity metrics</p>
                </div>
                <button onClick={() => window.print()} className="print:hidden px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-[16px] text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] transition-all active:scale-95">
                    Save as PDF
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Overall Products Sold" value={`${totalItemsSold}`} icon={<Boxes size={22} />} colorClass="bg-red-50 text-[#e62020]" />
                <StatCard title="Total Income Gain" value={`रू ${totalIncome.toLocaleString()}`} icon={<Activity size={22} />} colorClass="bg-green-50 text-green-600" />
                <StatCard title="Out of Stock Items" value={outOfStockCount} icon={<AlertCircle size={22} />} colorClass="bg-orange-50 text-orange-600" />
            </div>

            <h2 className="font-black text-gray-900 text-xl uppercase tracking-tighter border-b border-gray-100 pb-4 mb-6 mt-10">Best Selling Products</h2>
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr><th className="px-8 py-4">Item Name</th><th className="px-8 py-4">Total Units Sold (Hub)</th><th className="px-8 py-4 text-right">Estimated Revenue</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {topItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-8 py-4 font-black flex items-center gap-3">
                                    <span className="w-6 h-6 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">{idx + 1}</span> 
                                    {item.item_name}
                                </td>
                                <td className="px-8 py-4 text-sm font-black text-[#e62020]">{item.total_units_sold} units</td>
                                <td className="px-8 py-4 text-right text-sm font-black text-gray-900">रू {item.revenue.toFixed(2)}</td>
                            </tr>
                        ))}
                        {topItems.length === 0 && <tr><td colSpan="3" className="p-10 text-center text-sm font-black text-gray-300 uppercase">No item velocity data found</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ─── User Edit Modal ────────────────────────────────────────────────────────────
const UserEditModal = ({ isOpen, onClose }) => {
    const { user, accessToken } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/users/${user.id}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const updated = await res.json();
                dispatch(updateProfile(updated));
                onClose();
            } else {
                alert("Failed to update user profile. Check network or server logs.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"><X size={16}/></button>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-6 flex items-center gap-3"><User className="text-[#e62020]"/> Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Manager Name</label>
                        <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#e62020] focus:ring-4 focus:ring-red-500/10 transition-all" required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#e62020] focus:ring-4 focus:ring-red-500/10 transition-all" required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#e62020] text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest mt-6 hover:bg-red-700 active:scale-95 transition-all outline-none">
                        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Details'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── Main Dashboard Layout ───────────────────────────────────────────────────
export const WarehouseDashboard = () => {
    const dispatch = useDispatch();
    const { user, accessToken } = useSelector((state) => state.auth);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    // Fetch analytics at the top level for the header
    const { analytics } = useWarehouseData(accessToken);

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex text-gray-900">
            <WarehouseSidebar />
            <div className="flex-1 flex flex-col ml-72 min-h-screen w-[calc(100%-18rem)] print:ml-0 print:w-full">
                <header className="h-[88px] bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-50 print:hidden">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[20px] font-black tracking-tighter uppercase leading-none text-gray-900 hidden lg:block">Warehouse Control</h1>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-gray-50 rounded-2xl border border-gray-200">
                            <MapPin size={14} className="text-[#e62020]" />
                            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{analytics.hub_name ? `${analytics.hub_name} WAREHOUSE` : (user?.assigned_warehouse_name ? `${user.assigned_warehouse_name} WAREHOUSE` : 'KATHMANDU WAREHOUSE')}</span>
                        </div>
                        <div className="flex items-center gap-4 pr-8 border-r-2 border-gray-100 cursor-pointer group hover:opacity-80 transition-opacity" onClick={() => setIsProfileModalOpen(true)}>
                            <div className="text-right">
                                <span className="block text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-[#e62020] transition-colors">{user?.full_name || 'Admin User'}</span>
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5 truncate max-w-[150px]">{user?.email}</span>
                            </div>
                            <div className="w-12 h-12 rounded-[18px] bg-gray-900 group-hover:bg-[#e62020] transition-colors flex items-center justify-center text-white font-black text-lg shadow-xl"><User size={20} strokeWidth={2.5} /></div>
                        </div>
                        <button onClick={() => dispatch(logout())} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#e62020] rounded-[18px] transition-all"><LogOut size={22} strokeWidth={2.5} /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pb-20">
                    <Routes>
                        <Route path="/"          element={<DashboardOverview />} />
                        <Route path="/orders"    element={<IncomingOrders />} />
                        <Route path="/inventory" element={<StockInventory />} />
                        <Route path="/dispatch"  element={<DispatchModule />} />
                        <Route path="/alerts"    element={<AlertsModule />} />
                        <Route path="/analytics" element={<AnalyticsModule />} />
                        <Route path="/users"     element={<CustomersModule />} />
                        
                    </Routes>
                </main>
            </div>
            <UserEditModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </div>
    );
};
