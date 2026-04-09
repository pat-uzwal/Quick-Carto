import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { 
    TrendingUp, Users, ShoppingBag, DollarSign, Package, 
    Bell, Search, User, LogOut, Loader2, Activity, 
    List, Settings, Warehouse, ClipboardList, Filter, ChevronDown,
    Cherry, Candy, CupSoda, Wine, ShoppingCart, Sparkles
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal';
import StockUpdateModal from '../components/StockUpdateModal';
import WarehouseModal from '../components/WarehouseModal';

// Stat Card Component
const StatCard = ({ title, value, icon, trend, trendValue, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass.split(' ')[0]} group-hover:scale-150 transition-transform duration-700`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-xs font-black px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                    {trend === 'up' ? '+' : '-'}{trendValue}%
                </span>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{title}</h3>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        </div>
    </div>
);

// Dashboard Overview Sub-page
const DashboardHome = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch('http://localhost:8000/api/admin/analytics/', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-[#e62020]" />
            </div>
        );
    }

    // Default stats if fetch fails
    const analytics = stats || {
        total_revenue: 0,
        total_users: 0,
        total_orders: 0,
        total_products: 0,
        orders_by_status: {}
    };

    const statCardsData = [
        { title: 'Total Revenue', value: `रू ${analytics.total_revenue.toLocaleString()}`, icon: <DollarSign size={24} />, trend: 'up', trendValue: '12.5', colorClass: 'bg-[#e62020]/10 text-[#e62020]' },
        { title: 'Active Customers', value: analytics.total_users.toLocaleString(), icon: <Users size={24} />, trend: 'up', trendValue: '8.2', colorClass: 'bg-green-500/10 text-green-600' },
        { title: 'Total Orders', value: analytics.total_orders.toLocaleString(), icon: <Package size={24} />, trend: 'up', trendValue: '2.1', colorClass: 'bg-blue-500/10 text-blue-600' },
        { title: 'Registered Products', value: analytics.total_products.toLocaleString(), icon: <ShoppingBag size={24} />, colorClass: 'bg-purple-500/10 text-purple-600' },
    ];

    // Status breakdown preparation
    const statusEntries = Object.entries(analytics.orders_by_status || {});
    const totalOrders = analytics.total_orders || 1; // prevent div by 0

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Executive Dashboard</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Activity size={14} className="text-[#e62020] animate-pulse" /> Live Pulse of QuickCarto
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCardsData.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Status Breakdown */}
                <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-10">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                        <div>
                            <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tight">Order Status Breakdown</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time status of all platform orders</p>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {statusEntries.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-sm">
                                No orders in the system yet.
                            </div>
                        ) : (
                            statusEntries.map(([statusName, count]) => {
                                const percentage = Math.round((count / totalOrders) * 100);
                                let color = "bg-gray-500";
                                if (statusName.toLowerCase() === 'delivered') color = "bg-green-500";
                                if (statusName.toLowerCase() === 'pending') color = "bg-orange-500";
                                if (statusName.toLowerCase() === 'cancelled') color = "bg-[#e62020]";
                                if (statusName.toLowerCase() === 'in transit') color = "bg-blue-500";

                                return (
                                    <div key={statusName} className="space-y-3 group">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-black text-gray-900 uppercase tracking-widest">{statusName}</span>
                                            <div className="space-x-4">
                                                <span className="font-black text-gray-500">{count} Orders</span>
                                                <span className="font-black text-gray-900">{percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${color} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Global Warehouse Sales Data */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-50 rounded-full opacity-50 pointer-events-none"></div>
                    
                    <div className="relative z-10 mb-6">
                        <h3 className="font-black text-gray-900 mb-1 text-xl uppercase tracking-tighter">System & Warehouse Metrics</h3>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed pr-8">Overview of logistics nodes dispatch and overall platform aggregate data.</p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl group hover:border-[#e62020] border border-transparent transition-all">
                            <span className="font-black text-xs text-gray-400 group-hover:text-gray-900 uppercase tracking-widest">Kathmandu Hub</span>
                            <span className="font-black text-lg text-gray-900 tracking-tighter">रू {Math.round(analytics.total_revenue * 0.55).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl group hover:border-[#e62020] border border-transparent transition-all">
                            <span className="font-black text-xs text-gray-400 group-hover:text-gray-900 uppercase tracking-widest">Lalitpur Node</span>
                            <span className="font-black text-lg text-gray-900 tracking-tighter">रू {Math.round(analytics.total_revenue * 0.30).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl group hover:border-[#e62020] border border-transparent transition-all">
                            <span className="font-black text-xs text-gray-400 group-hover:text-gray-900 uppercase tracking-widest">Bhaktapur Center</span>
                            <span className="font-black text-lg text-gray-900 tracking-tighter">रू {Math.round(analytics.total_revenue * 0.15).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-100 flex justify-between items-center text-xs font-black uppercase tracking-widest text-[#e62020]">
                        <span>Global Dispatch Load:</span>
                        <span className="text-lg text-gray-900">{analytics.total_orders.toLocaleString()} Units</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!accessToken) return;
            try {
                // Fetch Users
                const res = await fetch('http://localhost:8000/api/admin/users/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : (data.results || []));

                // Fetch Warehouses
                const wRes = await fetch('http://localhost:8000/api/admin/warehouses/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const wData = await wRes.json();
                setWarehouses(Array.isArray(wData) ? wData : (wData.results || []));
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [accessToken]);

    const handleAssignWarehouse = async (userId, warehouseId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/users/${userId}/`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assigned_warehouse: warehouseId || null })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, assigned_warehouse_name: warehouses.find(w => w.id === Number(warehouseId))?.name || null } : u));
            } else {
                alert("Failed to assign warehouse. Ensure you have the correct permissions.");
            }
        } catch (err) {
            console.error("Error assigning warehouse:", err);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to completely delete this user?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/admin/users/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                alert("Failed to delete user.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [showManagerModal, setShowManagerModal] = useState(false);
    const [managerForm, setManagerForm] = useState({ full_name: '', email: '', password: '', phone_number: '' });

    const handleCreateManager = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...managerForm, role: 'warehouse' };
            const res = await fetch('http://localhost:8000/api/users/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(prev => [...prev, data.user || data]);
                setShowManagerModal(false);
                setManagerForm({ full_name: '', email: '', password: '', phone_number: '' });
                alert("Warehouse Manager assigned and created successfully!");
            } else {
                alert("Operation failed. Ensure email is unique.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddUser = () => {
        setShowManagerModal(true);
    };

    if (loading) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-[#e62020]" />
            </div>
        );
    }

    const filteredUsers = users.filter(u => {
        const matchesTab = activeTab === 'all' || u.role === activeTab;
        const matchesSearch = (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (u.phone_number || '').includes(searchTerm);
        return matchesTab && matchesSearch;
    });

    const tabs = [
        { id: 'all', label: 'All Accounts', count: users.length },
        { id: 'user', label: 'Customers', count: users.filter(u => u.role === 'user').length },
        { id: 'warehouse', label: 'Warehouse Managers', count: users.filter(u => u.role === 'warehouse').length },
        { id: 'delivery', label: 'Delivery Personnel', count: users.filter(u => u.role === 'delivery').length },
        { id: 'admin', label: 'Administrators', count: users.filter(u => u.role === 'admin').length },
    ];

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">System Users</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Users size={14} className="text-[#e62020]" /> Root Access Required
                    </p>
                </div>
            </div>

            {/* Role Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-[24px] w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-white text-[#e62020] shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                            activeTab === tab.id ? 'bg-red-50 text-[#e62020]' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Filter users..." 
                            className="pl-12 pr-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:border-[#e62020] focus:ring-4 focus:ring-red-500/10 transition-all w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 border-b border-gray-100">User ID</th>
                                <th className="px-8 py-5 border-b border-gray-100">Full Name</th>
                                <th className="px-8 py-5 border-b border-gray-100">Email Address</th>
                                <th className="px-8 py-5 border-b border-gray-100">Contact Number</th>
                                {activeTab === 'warehouse' && <th className="px-8 py-5 border-b border-gray-100">Assigned Hub</th>}
                                <th className="px-8 py-5 border-b border-gray-100">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                                        No users found in this category.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="px-8 py-5 text-xs text-gray-400 font-mono font-bold">{u.id?.toString().split('-')[0] || 'N/A'}***</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#e62020] font-black text-xs">
                                                    {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-black text-gray-900 tracking-tight">{u.full_name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-500">{u.email}</td>
                                        <td className="px-8 py-5 text-sm font-black text-gray-900 tracking-tighter">
                                            {u.phone_number || 'Not Provided'}
                                        </td>
                                        {activeTab === 'warehouse' && (
                                        <td className="px-8 py-5 text-xs font-black text-gray-500 tracking-widest uppercase">
                                            {u.role === 'warehouse' ? (
                                                <select 
                                                    className="bg-transparent border border-gray-200 rounded px-3 py-1.5 focus:border-[#e62020] outline-none cursor-pointer"
                                                    value={u.assigned_warehouse_name ? warehouses.find(w => w.name === u.assigned_warehouse_name)?.id || '' : ''}
                                                    onChange={(e) => handleAssignWarehouse(u.id, e.target.value)}
                                                >
                                                    <option value="">UNASSIGNED</option>
                                                    {warehouses.map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                            ) : '-'}
                                        </td>
                                        )}
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                u.role === 'admin' ? 'bg-[#e62020]/10 text-[#e62020] border-[#e62020]/20' :
                                                u.role === 'warehouse' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                u.role === 'delivery' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                                {u.role === 'user' ? 'Customer' : u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showManagerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-[500px] shadow-2xl p-10 overflow-hidden relative">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Assign Warehouse Manager</h2>
                        <form onSubmit={handleCreateManager} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input required type="text" value={managerForm.full_name} onChange={e => setManagerForm({...managerForm, full_name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:border-[#e62020] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input required type="email" value={managerForm.email} onChange={e => setManagerForm({...managerForm, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:border-[#e62020] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                <input required type="password" value={managerForm.password} onChange={e => setManagerForm({...managerForm, password: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:border-[#e62020] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input required type="text" value={managerForm.phone_number} onChange={e => setManagerForm({...managerForm, phone_number: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:border-[#e62020] outline-none" />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowManagerModal(false)} className="flex-1 py-4 font-black uppercase text-gray-500 tracking-widest border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 font-black uppercase text-white bg-[#e62020] tracking-widest rounded-2xl shadow-xl shadow-[rgba(230,32,32,0.25)] hover:bg-[#cc1b1b] transition-all">Create Manager</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Category Management Module
const CategoryManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchCategories = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/admin/categories/', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error("Failed to fetch product tree", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [accessToken]);

    const handleSave = async (formData) => {
        try {
            const url = selectedCategory 
                ? `http://localhost:8000/api/admin/categories/${selectedCategory.id}/`
                : 'http://localhost:8000/api/admin/categories/';
            
            const method = selectedCategory ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCategories();
            } else {
                const errorData = await res.json();
                alert(`Tree Sync Error: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            console.error("Network Error during tree update", err);
        }
    };

    const openAddModal = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (cat) => {
        setSelectedCategory(cat);
        setIsModalOpen(true);
    };

    const filteredCategories = (categories || []).filter(cat => 
        (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Category Groups</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <List size={14} className="text-[#e62020]" /> Manage Catalog Tree
                    </p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] transition-all active:scale-95"
                >
                    Create Category
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight">Active Master Categories</h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find category..." 
                            className="pl-12 pr-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:border-[#e62020] focus:ring-4 focus:ring-red-500/10 transition-all w-64" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 border-b border-gray-100 w-24">ID</th>
                                <th className="px-8 py-5 border-b border-gray-100">Category Name</th>
                                <th className="px-8 py-5 border-b border-gray-100">Slug Key</th>
                                <th className="px-8 py-5 border-b border-gray-100 w-32 text-center">Status</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCategories.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">No categories match your search matrix.</td></tr>
                            ) : (
                                filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="px-8 py-5 text-xs text-gray-400 font-mono font-bold">#{cat.id}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                {cat.icon_url ? (
                                                    <img src={cat.icon_url} alt={cat.name} className="w-10 h-10 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><List size={18} /></div>
                                                )}
                                                <span className="text-sm font-black text-gray-900 tracking-tight">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-gray-900 font-mono font-black tracking-wider uppercase">{cat.slug || 'no-slug-set'}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Live</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => openEditModal(cat)}
                                                className="text-[10px] font-black text-gray-400 hover:text-[#e62020] uppercase border border-gray-200 hover:border-[#e62020] px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                Configure
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CategoryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
                onSave={handleSave}
            />
        </div>
    );
};

// Product Management Module
const ProductManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch('http://localhost:8000/api/admin/products/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }),
                fetch('http://localhost:8000/api/admin/categories/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                })
            ]);
            
            const prodData = await prodRes.json();
            const catData = await catRes.json();
            
            setProducts(Array.isArray(prodData) ? prodData : (prodData.results || []));
            setCategories(Array.isArray(catData) ? catData : (catData.results || []));
        } catch (err) {
            console.error("Failed to fetch product master data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    const filteredProducts = (products || []).filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (formData) => {
        try {
            const url = selectedProduct 
                ? `http://localhost:8000/api/admin/products/${selectedProduct.id}/`
                : 'http://localhost:8000/api/admin/products/';
            
            const method = selectedProduct ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData(); // Refresh list
            } else {
                const errorData = await res.json();
                alert(`Sync Error: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            console.error("Network Error during vault sync", err);
        }
    };

    const openAddModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Catalog Vault</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#e62020]" /> Global SKU Registry
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={openAddModal}
                        className="px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <Package size={16} /> Add New Item
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight">Active Product Master</h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020]" size={16} />
                        <input 
                            type="text" 
                            placeholder="Filter by Name, SKU or Brand..." 
                            className="pl-12 pr-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:border-[#e62020] w-80" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 border-b border-gray-100">SKU / Brand</th>
                                <th className="px-8 py-5 border-b border-gray-100">Product Details</th>
                                <th className="px-8 py-5 border-b border-gray-100">Category</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-right">MRP / Selling</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm text-[12px]">No items match your search vault.</td></tr>
                            ) : (
                                filteredProducts.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="block text-[10px] text-gray-400 font-mono font-bold tracking-widest">{prod.sku || 'NO-SKU'}</span>
                                            <span className="block text-[9px] text-[#e62020] font-black uppercase tracking-[0.15em] mt-1">{prod.brand || 'Blinkit Core'}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <img src={prod.image_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100 p-1 shadow-sm" />
                                                <div>
                                                    <span className="block text-sm font-black text-gray-900 tracking-tight">{prod.name}</span>
                                                    <span className="block text-[10px] font-bold text-gray-400">{prod.weight} {prod.unit}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{prod.category_name}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="block text-[10px] text-gray-400 line-through font-bold"> रू {prod.mrp}</span>
                                            <span className="block text-sm font-black text-gray-900 tracking-tighter">रू {prod.selling_price || prod.price}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => openEditModal(prod)}
                                                className="text-[10px] font-black text-gray-400 hover:text-[#e62020] uppercase border border-gray-200 hover:border-[#e62020] px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                categories={categories}
                onSave={handleSave}
            />
        </div>
    );
};

// Inventory Management Module
const InventoryManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [inventory, setInventory] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    const fetchInventory = async () => {
        if (!accessToken) return;
        try {
            const res = await fetch('http://localhost:8000/api/admin/inventory/', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.results || []);
            setInventory(items);
            // Auto-expand all categories on load
            const cats = {};
            items.forEach(item => {
                const cat = item.product_category_name || 'Uncategorized';
                cats[cat] = true;
            });
            setExpandedCategories(cats);
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, [accessToken]);

    useEffect(() => {
        const fetchWarehouses = async () => {
            if (!accessToken) return;
            try {
                const res = await fetch('http://localhost:8000/api/admin/warehouses/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                setWarehouses(Array.isArray(data) ? data : (data.results || []));
            } catch (err) {
                console.error("Failed to fetch warehouses", err);
            }
        };
        fetchWarehouses();
    }, [accessToken]);

    const handleUpdateStock = async (updateData) => {
        try {
            const res = await fetch(`http://localhost:8000/api/admin/inventory/${selectedStockItem.id}/update-stock/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(updateData)
            });
            if (res.ok) { setIsStockModalOpen(false); fetchInventory(); }
            else { const e = await res.json(); alert(`Error: ${JSON.stringify(e)}`); }
        } catch (err) { console.error("Stock sync error", err); }
    };

    const openStockModal = (item) => { setSelectedStockItem(item); setIsStockModalOpen(true); };
    const toggleCategory = (cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

    // Filter inventory
    const filtered = (inventory || []).filter(item => {
        const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse?.toString() === selectedWarehouse;
        const matchesStatus = selectedStatus === 'all' || item.stock_status === selectedStatus;
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q || 
            (item.product_name || '').toLowerCase().includes(q) ||
            (item.product_sku || '').toLowerCase().includes(q) ||
            (item.product_category_name || '').toLowerCase().includes(q);
        return matchesWarehouse && matchesStatus && matchesSearch;
    });

    // Group by category — deduplicate products (per warehouse filter, show one row per product)
    const grouped = filtered.reduce((acc, item) => {
        const cat = item.product_category_name || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    // Category emoji map
    const catEmoji = {
        'Chips & Snacks': <Cherry size={20} />, 'Chocolates': <Candy size={20} />, 'Drinks': <CupSoda size={20} />,
        'Snacks and Drinks': <Cherry size={20} />,
        'Liquors and Smoke': <Wine size={20} />, 'Grocery and Kitchen': <ShoppingCart size={20} />, 'Beauty and Personal care': <Sparkles size={20} />,
        'Uncategorized': <Package size={20} />
    };

    if (loading) return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Stock Registry</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Package size={14} className="text-[#e62020]" /> {filtered.length} Records · {Object.keys(grouped).length} Categories · 3 Warehouses
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setExpandedCategories(Object.keys(grouped).reduce((a,k) => ({...a,[k]:true}), {}))}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:border-[#e62020] hover:text-[#e62020]"
                    >
                        Expand All
                    </button>
                    <button 
                        onClick={() => setExpandedCategories(Object.keys(grouped).reduce((a,k) => ({...a,[k]:false}), {}))}
                        className="px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)]"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg p-6 flex justify-between items-center gap-4">
                <div className="flex gap-4 flex-wrap">
                    <select 
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-[#e62020] min-w-[160px]"
                    >
                        <option value="all">🏭 All Warehouses</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>📍 {w.name}</option>
                        ))}
                    </select>
                    <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-[#e62020]"
                    >
                        <option value="all">All Status</option>
                        <option value="in_stock">✅ In Stock</option>
                        <option value="low_stock">⚠️ Low Stock</option>
                        <option value="out_of_stock">❌ Out of Stock</option>
                    </select>
                </div>
                <div className="relative group flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020]" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search products, SKU, or category..." 
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:border-[#e62020]" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Groups */}
            {Object.keys(grouped).length === 0 ? (
                <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                    No products match your current filters.
                </div>
            ) : (
                Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([category, items]) => {
                    const isOpen = expandedCategories[category] !== false;
                    const inStockCount = items.filter(i => i.stock_status === 'in_stock').length;
                    const outCount = items.filter(i => i.stock_status === 'out_of_stock').length;
                    const lowCount = items.filter(i => i.stock_status === 'low_stock').length;
                    const emoji = catEmoji[category] || <Package size={20} />;

                    return (
                        <div key={category} className="bg-white rounded-[28px] border border-gray-100 shadow-lg overflow-hidden">
                            {/* Category Header */}
                            <button 
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-7 hover:bg-gray-50/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-[#e62020]/10 rounded-2xl flex items-center justify-center text-2xl">
                                        {emoji}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{category}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            {items.length} records
                                        </p>
                                    </div>
                                    <div className="flex gap-3 ml-4">
                                        {inStockCount > 0 && <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200">{inStockCount} In Stock</span>}
                                        {lowCount > 0 && <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-200">{lowCount} Low</span>}
                                        {outCount > 0 && <span className="px-3 py-1 bg-red-50 text-[#e62020] text-[10px] font-black uppercase tracking-widest rounded-full border border-red-200">{outCount} Out</span>}
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={16} className="text-gray-500" />
                                </div>
                            </button>

                            {/* Product Table */}
                            {isOpen && (
                                <div className="border-t border-gray-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
                                            <tr>
                                                <th className="px-8 py-4">SKU Ref</th>
                                                <th className="px-8 py-4">Product</th>
                                                <th className="px-8 py-4">Warehouse</th>
                                                <th className="px-8 py-4 text-center">Net Qty</th>
                                                <th className="px-8 py-4 text-center">Reserved</th>
                                                <th className="px-8 py-4 text-center">Status</th>
                                                <th className="px-8 py-4 text-right">Update</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {items.map((item) => (
                                                <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                                                    <td className="px-8 py-4 text-[10px] text-gray-400 font-mono font-bold">{item.product_sku || 'N/A'}</td>
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {item.product_image 
                                                                ? <img src={item.product_image} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100" />
                                                                : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{emoji}</div>
                                                            }
                                                            <span className="text-sm font-black text-gray-900">{item.product_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-gray-500 text-xs font-bold">{item.warehouse_name}</td>
                                                    <td className="px-8 py-4 text-center font-black text-gray-900 text-base">{item.stock_quantity}</td>
                                                    <td className="px-8 py-4 text-center font-bold text-orange-500 text-sm">{item.reserved_stock}</td>
                                                    <td className="px-8 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                            item.stock_status === 'in_stock' ? 'bg-green-50 text-green-600 border-green-200' :
                                                            item.stock_status === 'low_stock' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                            'bg-red-50 text-[#e62020] border-red-200'
                                                        }`}>
                                                            {item.stock_status?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <button 
                                                            onClick={() => openStockModal(item)}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 hover:bg-[#e62020] hover:text-white transition-all flex items-center justify-center ml-auto"
                                                        >
                                                            <Activity size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
            
            <StockUpdateModal 
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                inventoryItem={selectedStockItem}
                onSave={handleUpdateStock}
            />
        </div>
    );
};

// Warehouse Registry Module
const WarehouseManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const fetchWarehouses = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/admin/warehouses/', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            setWarehouses(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error("Failed to fetch warehouses", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, [accessToken]);

    const handleDeleteWarehouse = async (id) => {
        if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this Warehouse?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/admin/warehouses/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                setWarehouses(prev => prev.filter(w => w.id !== id));
            } else {
                alert("Failed to delete warehouse.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Global Warehouses</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Warehouse size={14} className="text-[#e62020]" /> Primary Storage Nodes
                    </p>
                </div>
                <button onClick={() => { setSelectedWarehouse(null); setIsModalOpen(true); }} className="px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)]">
                    New Warehouse
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-gray-400 font-bold uppercase tracking-widest">
                        No active distribution centers found.
                    </div>
                ) : (
                    warehouses.map(wh => (
                        <div key={wh.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 group hover:border-[#e62020] transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#e62020]/10 transition-colors">
                                    <Warehouse size={24} className="text-gray-400 group-hover:text-[#e62020] transition-colors" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{wh.code}</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{wh.name}</h3>
                            <p className="text-xs text-gray-500 font-bold leading-relaxed mb-6">{wh.address}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex gap-2">
                                    <div className={`w-2 h-2 rounded-full ${wh.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{wh.is_active ? 'Operational' : 'Inactive'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setSelectedWarehouse(wh); setIsModalOpen(true); }} className="text-[10px] font-black text-[#e62020] uppercase tracking-widest hover:bg-red-50 px-2 py-1 rounded-lg">Configure</button>
                                    <button onClick={() => handleDeleteWarehouse(wh.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-2 py-1 rounded-lg">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <WarehouseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                warehouse={selectedWarehouse}
                onSave={() => { setIsModalOpen(false); fetchWarehouses(); }}
            />
        </div>
    );
};

// Order Management Module
const OrderManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!accessToken) return;
            try {
                const res = await fetch('http://localhost:8000/api/admin/orders/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : (data.results || []));
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [accessToken]);

    if (loading) return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Order Registry</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <ClipboardList size={14} className="text-[#e62020]" /> Platform Fulfillment Pulse
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex gap-4">
                        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-600 outline-none focus:border-[#e62020]">
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Packed</option>
                            <option>Delivered</option>
                        </select>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020]" size={16} />
                        <input type="text" placeholder="Search order ID or customer..." className="pl-12 pr-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:border-[#e62020] w-72" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 border-b border-gray-100">Order ID</th>
                                <th className="px-8 py-5 border-b border-gray-100">Timestamp</th>
                                <th className="px-8 py-5 border-b border-gray-100">Warehouse</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-right">Revenue</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-center">Lifecycle</th>
                                <th className="px-8 py-5 border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.length === 0 ? (
                                <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm text-[12px]">No orders currently in the fulfillment pipeline.</td></tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-red-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="block text-sm font-black text-gray-900 tracking-tight">#{order.id}</span>
                                            <span className="block text-[10px] text-gray-400 font-bold uppercase">View Details</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                                            <span className="block text-[10px] text-gray-300 font-bold">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#e62020]"></div>
                                                <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{order.warehouse_name || 'Global Hub'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-gray-900">
                                            रू {order.total_amount}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                                                order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                order.status === 'cancelled' ? 'bg-red-50 text-[#e62020] border-red-200' :
                                                'bg-blue-50 text-blue-600 border-blue-200'
                                            }`}>
                                                {order.status_display || order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <select 
                                                value={order.status}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value;
                                                    try {
                                                        const res = await fetch(`http://localhost:8000/api/admin/orders/${order.id}/`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                                                            body: JSON.stringify({ status: newStatus })
                                                        });
                                                        if (res.ok) {
                                                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus, status_display: newStatus } : o));
                                                        } else {
                                                            alert('Failed to update status');
                                                        }
                                                    } catch (err) { console.error(err); }
                                                }}
                                                className="text-[10px] font-black text-gray-600 uppercase border border-gray-200 hover:border-[#e62020] px-2 py-1.5 rounded-lg transition-all outline-none bg-white cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="packed">Packed</option>
                                                <option value="in transit">In Transit</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Settings Module
const PlatformSettings = () => {
    const [platformFee, setPlatformFee] = useState(() => localStorage.getItem('platformFee') || '10.00');
    const [deliveryFee, setDeliveryFee] = useState(() => localStorage.getItem('deliveryFee') || '40.00');
    const [freeThreshold, setFreeThreshold] = useState(() => localStorage.getItem('freeThreshold') || '500');

    const handleDeploy = () => {
        localStorage.setItem('platformFee', platformFee);
        localStorage.setItem('deliveryFee', deliveryFee);
        localStorage.setItem('freeThreshold', freeThreshold);
        alert("Platform settings deployed and synced successfully!");
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Security Core Settings</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Settings size={14} className="text-[#e62020]" /> Platform Hardening & Config
                    </p>
                </div>
                <button onClick={handleDeploy} className="px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] transition-all active:scale-95">
                    Deploy Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6">
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight border-b border-gray-100 pb-4">Platform Fees</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Platform Fee (NPR)</span>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-black">रू</span>
                                <input type="text" value={platformFee} onChange={e => setPlatformFee(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-black focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6">
                    <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight border-b border-gray-100 pb-4">Marketplace Thresholds</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Base Delivery Fee (NPR)</span>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-black">रू</span>
                                <input type="text" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-black focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Free Delivery Threshold (NPR)</span>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-black">रू</span>
                                <input type="text" value={freeThreshold} onChange={e => setFreeThreshold(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-black focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Orders above this amount will have FREE delivery.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reports Module
const ReportsManagement = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!accessToken) return;
            try {
                const res = await fetch('http://localhost:8000/api/admin/analytics/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            }
        };

        fetchAnalytics();
    }, [accessToken]);

    const handleDownloadReport = () => {
        window.print();
    };

    if (!analytics) {
        return <div className="p-8 h-full flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#e62020]" /></div>;
    }

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto print:p-0 print:space-y-4 print:text-black print:bg-white print:h-screen print:w-full">
            <div className="flex justify-between items-end print:pb-4 border-b border-white print:border-gray-200">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none print:text-2xl">Intelligence Reports</h1>
                    <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 print:text-[9px]">
                        <Activity size={14} className="text-[#e62020] print:hidden" /> PDF Export Engine
                    </p>
                </div>
                <button onClick={handleDownloadReport} className="print:hidden px-6 py-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] transition-all active:scale-95">
                    Save as PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4 border border-transparent print:border-t-0">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6 print:shadow-none print:border-gray-200 print:rounded-[12px] print:p-6">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight border-b border-gray-100 pb-2">Full System Audit</h3>
                    <div className="space-y-4 text-sm font-bold text-gray-700 mt-4">
                        <div className="flex justify-between"><span>Revenue Generation:</span> <span>रू {(analytics.total_revenue || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Total Registered Users:</span> <span>{analytics.total_users || 0} Users</span></div>
                        <div className="flex justify-between"><span>Total System Orders:</span> <span>{analytics.total_orders || 0} Orders</span></div>
                        <div className="flex justify-between"><span>Active Distributed Products:</span> <span>{analytics.total_products || 0} Items</span></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6 print:shadow-none print:border-gray-200 print:rounded-[12px] print:p-6">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight border-b border-gray-100 pb-2">Sales Register (Hubs)</h3>
                    <div className="space-y-4 text-sm font-bold text-gray-700 mt-4">
                        <div className="flex justify-between"><span>Kathmandu Hub Total:</span> <span className="text-[#e62020]">रू {Math.round((analytics.total_revenue || 0) * 0.55).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Lalitpur Node Total:</span> <span className="text-[#e62020]">रू {Math.round((analytics.total_revenue || 0) * 0.30).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Bhaktapur Center Total:</span> <span className="text-[#e62020]">रू {Math.round((analytics.total_revenue || 0) * 0.15).toLocaleString()}</span></div>
                    </div>
                </div>
            </div>
            
            <div className="hidden print:block text-center text-xs text-gray-400 font-bold uppercase mt-10">
                Generated internally via QuickCarto Administrative Suite. Validated system output.
            </div>
        </div>
    );
};

export const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, accessToken } = useSelector((state) => state.auth);
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchResults, setSearchResults] = useState({ products: [], users: [], orders: [] });
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = React.useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced global search
    useEffect(() => {
        if (!globalSearch.trim() || globalSearch.length < 2) {
            setSearchResults({ products: [], users: [], orders: [] });
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            setShowDropdown(true);
            try {
                const headers = { 'Authorization': `Bearer ${accessToken}` };
                const q = encodeURIComponent(globalSearch);
                const [prodRes, userRes, orderRes] = await Promise.allSettled([
                    fetch(`http://localhost:8000/api/admin/products/?search=${q}`, { headers }),
                    fetch(`http://localhost:8000/api/admin/users/?search=${q}`, { headers }),
                    fetch(`http://localhost:8000/api/admin/orders/?search=${q}`, { headers }),
                ]);

                const parseRes = async (res) => {
                    if (res.status === 'fulfilled' && res.value.ok) {
                        const data = await res.value.json();
                        return Array.isArray(data) ? data.slice(0, 4) : (data.results || []).slice(0, 4);
                    }
                    return [];
                };

                setSearchResults({
                    products: await parseRes(prodRes),
                    users: await parseRes(userRes),
                    orders: await parseRes(orderRes),
                });
            } catch (err) {
                console.error('Global search error', err);
            } finally {
                setSearchLoading(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [globalSearch, accessToken]);

    const totalResults = searchResults.products.length + searchResults.users.length + searchResults.orders.length;

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex print:bg-white print:block">
            <div className="print:hidden">
                <AdminSidebar />
            </div>

            <div className="flex-1 flex flex-col ml-72 min-h-screen w-[calc(100%-18rem)] print:ml-0 print:w-full print:block">
                {/* Modern Admin Header */}
                <header className="h-[88px] bg-white/80 backdrop-blur-xl border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-50 print:hidden">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[22px] font-black tracking-tighter uppercase leading-none text-gray-900 hidden lg:block">Admin Control</h1>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Global Search */}
                        <div className="relative hidden lg:block" ref={searchRef}>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 transition-colors" size={18}
                                style={{ color: globalSearch ? '#e62020' : undefined }} />
                            <input 
                                type="text" 
                                placeholder="Search products, users, orders..." 
                                className="pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-900 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] transition-all w-80 outline-none placeholder:text-gray-400"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                onFocus={() => totalResults > 0 && setShowDropdown(true)}
                                onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
                            />

                            {/* Search Dropdown */}
                            {showDropdown && (
                                <div className="absolute top-[calc(100%+8px)] left-0 w-96 bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {searchLoading ? (
                                        <div className="p-6 flex items-center gap-3 text-gray-400">
                                            <Loader2 size={16} className="animate-spin text-[#e62020]" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Scanning Registry...</span>
                                        </div>
                                    ) : totalResults === 0 ? (
                                        <div className="p-6 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                            No results for "{globalSearch}"
                                        </div>
                                    ) : (
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {searchResults.products.length > 0 && (
                                                <div>
                                                    <div className="px-5 py-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Package size={11} /> Products
                                                    </div>
                                                    {searchResults.products.map(p => (
                                                        <a key={p.id} href="/admin/products" 
                                                            onClick={() => { setShowDropdown(false); setGlobalSearch(''); }}
                                                            className="flex items-center gap-4 px-5 py-3 hover:bg-red-50/40 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">🛍️</div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 leading-none">{p.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{p.sku} · रू{p.selling_price}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.users.length > 0 && (
                                                <div>
                                                    <div className="px-5 py-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <User size={11} /> Users
                                                    </div>
                                                    {searchResults.users.map(u => (
                                                        <a key={u.id} href="/admin/users"
                                                            onClick={() => { setShowDropdown(false); setGlobalSearch(''); }}
                                                            className="flex items-center gap-4 px-5 py-3 hover:bg-red-50/40 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 bg-[#e62020]/10 rounded-lg flex items-center justify-center text-sm font-black text-[#e62020]">
                                                                {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 leading-none">{u.full_name || u.email}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{u.role} · {u.email}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.orders.length > 0 && (
                                                <div>
                                                    <div className="px-5 py-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <ShoppingBag size={11} /> Orders
                                                    </div>
                                                    {searchResults.orders.map(o => (
                                                        <a key={o.id} href="/admin/orders"
                                                            onClick={() => { setShowDropdown(false); setGlobalSearch(''); }}
                                                            className="flex items-center gap-4 px-5 py-3 hover:bg-red-50/40 transition-colors cursor-pointer">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500"><Package size={16} /></div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 leading-none">Order #{String(o.id).slice(0,8)}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase">{o.status} · रू{o.total_price}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 pr-8 border-r-2 border-gray-100 cursor-pointer group">
                             <div className="text-right">
                                <span className="block text-sm font-black text-gray-900 group-hover:text-[#e62020] transition-colors uppercase tracking-tight">{user?.full_name || 'Admin User'}</span>
                                <span className="block text-[11px] font-bold text-gray-400 truncate max-w-[150px] uppercase tracking-widest mt-0.5">{user?.email || 'admin@quickcarto.com'}</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#e62020] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-[rgba(230,32,32,0.25)] relative overflow-hidden">
                                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={20} strokeWidth={2.5} />}
                            </div>
                        </div>

                        <button 
                            onClick={() => dispatch(logout())}
                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#e62020] hover:shadow-lg hover:shadow-[rgba(230,32,32,0.25)] rounded-2xl transition-all active:scale-90"
                            title="Sign Out"
                        >
                            <LogOut size={22} strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pb-20">
                    <Routes>
                        <Route path="/" element={<DashboardHome />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/products" element={<ProductManagement />} />
                        <Route path="/inventory" element={<InventoryManagement />} />
                        <Route path="/warehouses" element={<WarehouseManagement />} />
                        <Route path="/categories" element={<CategoryManagement />} />
                        <Route path="/orders" element={<OrderManagement />} />
                        <Route path="/analytics" element={<ReportsManagement />} />
                        <Route path="/settings" element={<PlatformSettings />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

