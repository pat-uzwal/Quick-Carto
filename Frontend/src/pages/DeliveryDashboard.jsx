import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import DeliverySidebar from '../components/DeliverySidebar';
import { Package, Truck, MapPin, User, LogOut, Navigation, Star, Clock, CheckCircle2, DollarSign, Activity, Bell, X, ChevronRight, AlertTriangle, Zap, XCircle, Phone, Map, History, Settings as SettingsIcon, FileText, Upload, Camera, Send, MessageSquare } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import OrderChat from '../components/DeliveryChat';

const API = 'http://localhost:8000/api';

/* ─── Shared Components ────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
    const configs = {
        'waiting': { label: 'Waiting for orders', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        'assigned': { label: 'Go to Store', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        'at_store': { label: 'At Store / Pickup', color: 'bg-purple-50 text-purple-600 border-purple-200' },
        'delivering': { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-600 border-orange-200' },
        'delivered': { label: 'Delivery Completed', color: 'bg-green-50 text-green-600 border-green-200' },
    };
    const config = configs[status] || configs.waiting;
    return (
        <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${config.color}`}>
             <span className="animate-pulse mr-2">●</span> {config.label}
        </div>
    );
};

const Timeline = ({ currentStatus }) => {
    const steps = [
        { key: 'assigned', label: 'Accepted', icon: <CheckCircle2 size={14}/> },
        { key: 'at_store', label: 'Arrived Store', icon: <MapPin size={14}/> },
        { key: 'picked_up', label: 'Picked Up', icon: <Package size={14}/> },
        { key: 'delivering', label: 'Out For Delivery', icon: <Truck size={14}/> },
        { key: 'delivered', label: 'Delivered', icon: <Star size={14}/> },
    ];
    const getStatusIndex = () => {
        if (!currentStatus) return -1;
        if (currentStatus === 'accepted_by_rider') return 0;
        if (currentStatus === 'reached_warehouse') return 1;
        if (currentStatus === 'picked_up') return 2;
        if (currentStatus === 'out_for_delivery') return 3;
        if (currentStatus === 'delivered') return 4;
        return -1;
    };
    const currentIndex = getStatusIndex();
    return (
        <div className="w-full bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Clock size={14} className="text-[#FF3B30]" /> Order Timeline
            </h3>
            <div className="flex justify-between relative px-2">
                <div className="absolute top-[18px] left-0 w-full h-[2px] bg-gray-100 -z-10"></div>
                <div className="absolute top-[18px] left-0 h-[2px] bg-[#FF3B30] -z-10 transition-all duration-700" style={{ width: `${currentIndex >= 0 ? (currentIndex / 4) * 100 : 0}%` }}></div>
                {steps.map((step, idx) => (
                    <div key={step.key} className="flex flex-col items-center gap-3 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${idx < currentIndex ? 'bg-[#FF3B30] border-[#FF3B30] text-white' : idx === currentIndex ? 'bg-white border-[#FF3B30] text-[#FF3B30] scale-125 shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            {idx < currentIndex ? <CheckCircle2 size={18} /> : step.icon}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tight ${idx === currentIndex ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─── Modals ─────────────────────────────────────────────── */
const OtpModal = ({ orderId, onClose, onSubmit }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        const success = await onSubmit(orderId, otp);
        if (success) onClose(); else { setError('INVALID OTP. PLEASE VERIFY WITH CUSTOMER.'); setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 max-w-sm w-full p-10 text-center">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} strokeWidth={2.5}/>
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Final Verification</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 mb-8">Ask customer for the 6-digit code</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" className="w-full text-center text-4xl font-black tracking-[0.5em] p-6 bg-gray-50 border border-gray-200 rounded-[24px] focus:outline-none focus:ring-8 focus:ring-green-500/10 focus:border-green-500 uppercase" required />
                    {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase text-center">Dismiss</button>
                        <button type="submit" disabled={loading || otp.length < 6} className="flex-1 py-4 bg-[#22C55E] text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-50 text-center">
                            {loading ? <Activity size={18} className="animate-spin mx-auto"/> : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Dashboard Overview ────────────────────────────────────────────── */
const DeliveryOverview = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [missions, setMissions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifyingOrder, setVerifyingOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [countdown, setCountdown] = useState(15);

    const prevNotifCount = useRef(0);
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const fetchAll = useCallback(async () => {
        if (!accessToken) { setLoading(false); return; }
        try {
            const [missionsRes, notifsRes, statsRes] = await Promise.all([
                fetch(`${API}/delivery/orders/`, { headers }),
                fetch(`${API}/delivery/notifications/`, { headers }),
                fetch(`${API}/delivery/stats/`, { headers }),
            ]);
            const [missionsData, notifsData, statsData] = await Promise.all([missionsRes.json(), notifsRes.json(), statsRes.json()]);
            const items = Array.isArray(missionsData) ? missionsData : (missionsData.results || []);
            const pings = Array.isArray(notifsData) ? notifsData : (notifsData.results || []);
            setMissions(items); setNotifications(pings); setStats(statsData);
            if (pings.length > prevNotifCount.current) setCountdown(15);
            prevNotifCount.current = pings.length;
        } catch (err) { console.error("Dashboard Error:", err); } finally { setLoading(false); }
    }, [accessToken]);

    useEffect(() => {
        fetchAll();
        const int = setInterval(fetchAll, 8000);
        return () => clearInterval(int);
    }, [fetchAll]);

    useEffect(() => {
        if (notifications.length > 0 && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [notifications, countdown]);

    const handleAcceptMission = async (orderId) => {
        setActionLoading(prev => ({ ...prev, [orderId]: 'accepting' }));
        try { await fetch(`${API}/delivery/orders/${orderId}/accept/`, { method: 'POST', headers }); fetchAll(); } 
        finally { setActionLoading(prev => ({ ...prev, [orderId]: null })); }
    };

    const handleRejectMission = async (orderId) => {
        setActionLoading(prev => ({ ...prev, [orderId]: 'rejecting' }));
        try { await fetch(`${API}/delivery/orders/${orderId}/reject/`, { method: 'POST', headers, body: JSON.stringify({ reason: 'Manual Reject' }) }); fetchAll(); } 
        finally { setActionLoading(prev => ({ ...prev, [orderId]: null })); }
    };

    const handleUpdateStatus = async (orderId, status) => {
        setActionLoading(prev => ({ ...prev, [orderId]: status }));
        try { await fetch(`${API}/delivery/orders/${orderId}/update-status/`, { method: 'POST', headers, body: JSON.stringify({ status }) }); fetchAll(); } 
        finally { setActionLoading(prev => ({ ...prev, [orderId]: null })); }
    };

    const handleVerifyAndDeliver = async (orderId, otp) => {
        setActionLoading(prev => ({ ...prev, [orderId]: 'delivered' }));
        try {
            const res = await fetch(`${API}/delivery/orders/${orderId}/update-status/`, { method: 'POST', headers, body: JSON.stringify({ status: 'delivered', otp }) });
            if (res.ok) { fetchAll(); return true; } return false;
        } finally { setActionLoading(prev => ({ ...prev, [orderId]: null })); }
    };

    const getNextAction = (status) => {
        switch(status) {
            case 'accepted_by_rider': return { action: 'reached_warehouse', label: 'ARRIVED STORE', icon: <Navigation size={20}/>, color: 'bg-[#FF3B30]' };
            case 'reached_warehouse': return { action: 'picked_up', label: 'PICKED UP', icon: <Package size={20}/>, color: 'bg-purple-600' };
            case 'picked_up': return { action: 'out_for_delivery', label: 'OUT FOR DELIVERY', icon: <Navigation size={20}/>, color: 'bg-blue-600' };
            case 'out_for_delivery': return { action: 'delivered', label: 'COMPLETE JOB', icon: <CheckCircle2 size={20}/>, color: 'bg-[#22C55E]' };
            default: return null;
        }
    };

    if (loading) return (
        <div className="p-10 h-screen flex flex-col items-center justify-center gap-6 bg-[#F8FAFC]">
            <div className="w-16 h-16 border-8 border-red-100 border-t-[#FF3B30] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Booting Dashboard Suite...</p>
        </div>
    );

    const activeOrder = missions.length > 0 ? missions[0] : null;
    const currentAction = activeOrder ? getNextAction(activeOrder.status) : null;
    const ping = notifications.length > 0 ? notifications[0] : null;

    return (
        <div className="p-10 max-w-[1600px] mx-auto space-y-10">
            {verifyingOrder && <OtpModal orderId={verifyingOrder} onClose={() => setVerifyingOrder(null)} onSubmit={handleVerifyAndDeliver} />}

            <section className="relative">
                <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 min-h-[480px] flex flex-col items-center justify-center text-center p-12">
                    {!activeOrder && !ping && (
                        <div className="max-w-md">
                            <div className="w-32 h-32 bg-gray-50 text-gray-200 rounded-[48px] flex items-center justify-center mx-auto mb-10 relative border border-gray-100 shadow-inner">
                                <Package size={56} className="text-[#FF3B30]/30" />
                                <div className="absolute inset-0 rounded-[48px] border-8 border-[#FF3B30]/5 animate-pulse"></div>
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">RELAX & STAND BY</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] leading-relaxed">No missions currently pinging in your sector.<br/><span className="text-[#FF3B30] mt-6 px-6 py-2 bg-red-50 rounded-full border border-red-100 inline-flex items-center gap-3 font-black"><MapPin size={14}/> {stats?.warehouse || 'Bagbazaar Hub'}</span></p>
                        </div>
                    )}

                    {ping && !activeOrder && (
                        <div className="w-full max-w-lg">
                            <div className="flex items-center justify-center gap-4 mb-10">
                                <div className="w-16 h-16 bg-red-50 text-[#FF3B30] rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-red-500/10"><Zap size={32} /></div>
                                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">New Mission!</h3>
                            </div>
                            <div className="bg-gray-50/50 border-2 border-dashed border-red-100 rounded-[32px] p-10 mb-10 space-y-8">
                                <div className="flex justify-between items-center px-4">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fee</p>
                                        <p className="text-3xl font-black text-[#22C55E] tracking-tighter">रू {Math.round(ping.total_amount * 0.1) || 60}</p>
                                    </div>
                                    <div className="text-right text-xs font-black text-[#FF3B30]">{countdown}s</div>
                                </div>
                                <div className="space-y-4 px-4 text-left">
                                     <div className="flex items-center gap-4 text-sm font-black text-gray-900 uppercase"><MapPin size={18} className="text-blue-500" /> {ping.warehouse_name}</div>
                                     <div className="flex items-center gap-4 text-sm font-black text-gray-900 uppercase"><Navigation size={18} className="text-[#FF3B30]" /> {ping.delivery_address}</div>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <button onClick={() => handleRejectMission(ping.id)} className="flex-1 py-6 bg-white border-2 border-gray-100 text-gray-400 rounded-[24px] text-xs font-black uppercase tracking-widest">Decline</button>
                                <button onClick={() => handleAcceptMission(ping.order_id)} className="flex-[2] py-6 bg-[#FF3B30] text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3">
                                    {actionLoading[ping.order_id] === 'accepting' ? <Activity size={20} className="animate-spin"/> : <Zap size={18} fill="currentColor"/>} Accept
                                </button>
                            </div>
                        </div>
                    )}

                    {activeOrder && (
                        <div className="w-full">
                            <div className="flex flex-col items-center gap-4 mb-10">
                                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Order #{activeOrder.id}</h3>
                                 {currentAction && (
                                    <div className="flex gap-4 w-full max-w-lg">
                                        <button 
                                            onClick={() => currentAction.action === 'delivered' ? setVerifyingOrder(activeOrder.id) : handleUpdateStatus(activeOrder.id, currentAction.action)}
                                            disabled={actionLoading[activeOrder.id]}
                                            className={`flex-1 py-8 rounded-[32px] text-[13px] font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 ${currentAction.color}`}
                                        >
                                            {actionLoading[activeOrder.id] ? <Activity size={22} className="animate-spin"/> : <>{currentAction.icon} {currentAction.label}</>}
                                        </button>
                                        <button onClick={() => setChatOrder(activeOrder)} className="w-24 h-24 bg-white border-2 border-gray-100 rounded-[32px] flex items-center justify-center text-gray-900 shadow-xl hover:border-[#FF3B30] hover:text-[#FF3B30] transition-all active:scale-90"><MessageSquare size={24}/></button>
                                    </div>
                                )}
                                {activeOrder.user_phone && (
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-6 py-2 rounded-full border border-gray-100">Contact Trace: <span className="text-gray-900 ml-2">{activeOrder.user_phone}</span></p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Shift Success', value: stats?.today_delivered || 0, icon: <CheckCircle2 size={20}/>, color: 'from-green-100 to-green-50 text-green-600' },
                    { label: 'Active Pings', value: notifications.length, icon: <Bell size={20}/>, color: 'from-orange-100 to-orange-50 text-orange-600' },
                    { label: 'Partner Grade', value: '4.8 ⭐', icon: <Star size={20}/>, color: 'from-blue-100 to-blue-50 text-blue-600' },
                    { label: 'Total Payout', value: `रू ${stats?.total_earnings || 0}`, icon: <DollarSign size={20}/>, color: 'from-yellow-100 to-yellow-50 text-yellow-600' },
                 ].map((stat, i) => (
                    <div key={i} className={`p-8 bg-gradient-to-br ${stat.color} rounded-[32px] border border-white shadow-xl flex items-center justify-between group`}>
                        <div>
                             <p className="text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">{stat.label}</p>
                             <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">{stat.icon}</div>
                    </div>
                 ))}
            </div>
        </div>
    );
};

/* ─── Earnings Page ─────────────────────────────────────────────── */
const EarningsSuite = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API}/delivery/stats/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(r => r.json()),
            fetch(`${API}/delivery/orders/completed/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(r => r.json())
        ]).then(([sData, oData]) => {
            setStats(sData);
            setOrders(Array.isArray(oData) ? oData : oData.results || []);
            setLoading(false);
        });
    }, [accessToken]);

    if (loading) return <div className="p-20 text-center uppercase font-black text-xs tracking-widest text-gray-400">Loading Wallet Hub...</div>;

    return (
        <div className="p-10 max-w-[1200px] mx-auto space-y-10">
            <header><h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Earnings Hub</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Verified payouts & Statements</p></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#22C55E] text-white p-10 rounded-[40px] shadow-2xl shadow-green-500/20"><p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Wallet Balance</p><p className="text-5xl font-black tracking-tighter">रू {stats?.total_earnings || 0}</p></div>
                <div className="bg-white border border-gray-100 p-10 rounded-[40px] shadow-xl"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Today Earnings</p><p className="text-4xl font-black text-gray-900 tracking-tighter">रू {stats?.today_earnings || 0}</p></div>
                <div className="bg-white border border-gray-100 p-10 rounded-[40px] shadow-xl"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Success Rate</p><p className="text-4xl font-black text-gray-900 tracking-tighter">100%</p></div>
            </div>
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-gray-50 font-black uppercase text-xs tracking-widest flex items-center justify-between">Recent Statement 📄 <span className="text-[#FF3B30] text-[9px]">Live Data</span></div>
                <div className="p-4 overflow-x-auto"><table className="w-full text-left">
                    <thead><tr className="text-[9px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50"><th className="px-6 py-6">Mission Ref</th><th className="px-6 py-6">Timestamp</th><th className="px-6 py-6 font-center">Payout</th></tr></thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-black uppercase text-gray-900">
                         {orders.slice(0, 10).map(o => (
                            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-6">ORD#{o.id}</td>
                                <td className="px-6 py-6 font-bold text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-6 text-[#22C55E]">रू {o.delivery_fee || 60}</td>
                            </tr>
                         ))}
                         {orders.length === 0 && <tr><td colSpan="3" className="p-12 text-center text-gray-300 uppercase text-[10px] font-black">No transaction records found</td></tr>}
                    </tbody>
                </table></div>
            </div>
        </div>
    );
};

const MissionArchives = () => {
    const { accessToken } = useSelector(state => state.auth);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/delivery/orders/completed/`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
            .then(res => res.json())
            .then(data => {
                const items = Array.isArray(data) ? data : (data.results || []);
                setHistory(items);
                setLoading(false);
            });
    }, [accessToken]);

    if (loading) return <div className="p-20 text-center uppercase font-black text-xs tracking-widest text-gray-400">Archiving Logs...</div>;

    return (
        <div className="p-10 max-w-[1200px] mx-auto space-y-10">
            <header className="flex items-center justify-between">
                <div><h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Mission Archives</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Log of successful deliveries</p></div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.map(job => (
                    <div key={job.id} className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all"><History size={64}/></div>
                        <div className="flex justify-between items-start mb-10">
                            <div><span className="text-[9px] font-black text-[#FF3B30] uppercase tracking-widest mb-1 block">Completed Mission</span><h3 className="text-2xl font-black uppercase text-gray-900">ORD#{job.order_id}</h3></div>
                            <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">{job.order_status}</span>
                        </div>
                        <div className="space-y-6 mb-10">
                            <div className="flex items-start gap-4">
                                <MapPin size={18} className="text-[#FF3B30] mt-1 shrink-0"/><div className="space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Target Location</p><p className="text-sm font-black uppercase text-gray-900 leading-tight">{job.delivery_address}</p></div>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-gray-50 flex flex-col gap-6">
                            {job.rating && (
                                <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} className={i < job.rating.stars ? "fill-orange-400 text-orange-400" : "text-gray-200"} />
                                        ))}
                                        <span className="text-[10px] font-black text-orange-600 uppercase ml-2 tracking-widest">Customer Feedback</span>
                                    </div>
                                    {job.rating.review && <p className="text-[11px] font-bold text-gray-600 italic">"{job.rating.review}"</p>}
                                </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-400">
                                <div>
                                    <span>Payout: <span className="text-gray-900">रू {Math.round(job.delivery_fee || 0)}</span></span>
                                    <span className="ml-6 uppercase opacity-40">Finished: {new Date(job.delivery_assignment?.delivered_at || job.created_at).toLocaleDateString()}</span>
                                </div>
                                <button onClick={() => setChatOrder(job)} className="p-4 bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-3xl transition-all active:scale-90"><MessageSquare size={18}/></button>
                            </div>
                        </div>
                    </div>
                ))}
                {history.length === 0 && <div className="col-span-full bg-white rounded-[40px] border border-gray-100 p-32 text-center text-gray-300 uppercase text-[12px] font-black tracking-widest">No archives found. Your mission history will appear here once you complete a delivery.</div>}
            </div>
        </div>
    );
};

const RiderSettings = () => {
    const { user, accessToken } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || '',
        vehicle_details: user?.vehicle_details || '',
    });
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        setFiles({ ...files, [field]: file });
        setPreviews({ ...previews, [field]: URL.createObjectURL(file) });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true); setStatus({ type: '', message: '' });
        const data = new FormData();
        Object.keys(formData).forEach(k => data.append(k, formData[k]));
        Object.keys(files).forEach(k => data.append(k, files[k]));
        try {
            const res = await fetch(`${API}/delivery/profile/update/`, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: data });
            if (res.ok) {
                const responseData = await res.json();
                if (responseData.user) {
                    dispatch(updateProfile(responseData.user));
                }
                setStatus({ type: 'success', message: 'Profile updated & images synced!' });
            } else setStatus({ type: 'error', message: 'Profile update failed. Try again.' });
        } catch (err) { setStatus({ type: 'error', message: 'Network instability detected.' }); }
        finally { setLoading(false); }
    };

    return (
        <div className="p-10 max-w-[1000px] mx-auto space-y-10">
            <header><h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Partner Profile</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Personalize your runner credentials</p></header>
            <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl relative overflow-hidden">
                     <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="w-40 h-40 bg-gray-50 rounded-[48px] border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center relative">
                                {previews.profile_photo || user?.profile_photo ? (
                                    <img src={previews.profile_photo || user.profile_photo} className="w-full h-full object-cover" />
                                ) : ( <User size={64} className="text-gray-200" /> )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                     <Camera className="text-white" />
                                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'profile_photo')} />
                                </div>
                            </div>
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF3B30] text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Avatar</span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Official Name</label>
                            <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[28px] font-black text-sm uppercase focus:bg-white focus:border-[#FF3B30] outline-none transition-all" /></div>
                            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Phone Line</label>
                            <input type="text" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[28px] font-black text-sm uppercase focus:bg-white focus:border-[#FF3B30] outline-none transition-all" /></div>
                        </div>
                     </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl space-y-8">
                     <div className="flex items-center justify-between"><div className="flex items-center gap-4"><FileText size={20} className="text-[#FF3B30]"/><h3 className="font-black uppercase text-xs tracking-widest text-gray-900">Partner Credentials</h3></div><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user?.is_approved ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{user?.is_approved ? 'Trust Verified' : 'Compliance Pending'}</span></div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[{ f: 'bluebook_image', l: 'Bluebook (Main)', d: 'Ownership Proof' }, { f: 'license_image', l: 'License (Front)', d: 'Operator ID' }, { f: 'vehicle_image', l: 'Vehicle (Side)', d: 'Unit Photo' }].map(it => (
                            <div key={it.f} className="space-y-4">
                                <div className="aspect-[4/3] bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:bg-gray-100 transition-all cursor-pointer">
                                    {previews[it.f] || user?.[it.f] ? <img src={previews[it.f] || user[it.f]} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center"><Upload size={24} className="text-gray-300 mx-auto mb-2"/><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{it.l}</p></div>}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, it.f)} />
                                </div>
                                <p className="text-[7px] font-black text-gray-400 uppercase text-center">{it.d}</p>
                            </div>
                        ))}
                     </div>
                     <div className="space-y-2 pt-4"><label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Vehicle Unit Specs (Plate #, Model, Color)</label>
                     <textarea value={formData.vehicle_details} onChange={(e) => setFormData({...formData, vehicle_details: e.target.value})} placeholder="Example: BA 2 PA 9988 Honda Shine Black" className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[32px] font-black text-sm uppercase focus:bg-white focus:border-[#FF3B30] outline-none transition-all min-h-[120px] resize-none"></textarea></div>
                </div>

                {status.message && <div className={`p-6 rounded-[28px] text-xs font-black uppercase text-center border ${status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{status.message}</div>}
                <button type="submit" disabled={loading} className="w-full py-8 bg-gray-900 hover:bg-[#FF3B30] text-white rounded-[40px] text-xs font-black uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">{loading ? <Activity size={24} className="animate-spin" /> : 'Synchronize Profile'}</button>
            </form>
        </div>
    );
};

/* ─── Main Layout Suite ────────────────────────────────────────── */
export const DeliveryDashboard = () => {
    const navigate = useNavigate(); const dispatch = useDispatch();
    const { user, accessToken } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [chatOrder, setChatOrder] = useState(null);

    const fetchStats = useCallback(async () => {
        if (!accessToken) return;
        try { const res = await fetch(`${API}/delivery/stats/`, { headers: { 'Authorization': `Bearer ${accessToken}` } }); if (res.ok) setStats(await res.json()); } catch (e) {}
    }, [accessToken]);

    useEffect(() => {
        fetchStats(); const int = setInterval(fetchStats, 10000); return () => clearInterval(int);
    }, [fetchStats]);

    if (!user || !accessToken) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            <DeliverySidebar />
            <div className="flex-1 flex flex-col ml-20 min-h-screen">
                <header className="h-[88px] bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-6"><button onClick={async () => { await fetch(`${API}/delivery/toggle-online/`, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } }); fetchStats(); }} className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${stats?.is_online ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200 animate-pulse'}`}><div className={`w-2.5 h-2.5 rounded-full ${stats?.is_online ? 'bg-green-500' : 'bg-red-500'}`}></div> {stats?.is_online ? 'Online' : 'Offline'}</button></div>
                    <div className="flex items-center gap-10">
                        <div className="text-center"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">Balance</span><p className="text-xl font-black text-gray-900 tracking-tighter mt-1 leading-none">रू {stats?.today_earnings || 0}</p></div>
                        <div className="w-[1px] h-8 bg-gray-100 mx-2"></div>
                         <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/delivery/settings')}>
                              <div className="text-right hidden sm:block"><span className="block text-sm font-black text-gray-900 uppercase leading-none">{user?.full_name || 'Rider Runner'}</span><span className="text-[8px] font-black text-[#FF3B30] uppercase tracking-widest mt-1 block">Active Partner</span></div>
                              <div className="w-14 h-14 bg-gray-50 rounded-[20px] border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center font-black text-[#FF3B30] hover:scale-105 transition-transform">
                                 {user?.profile_photo ? <img src={user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`} className="w-full h-full object-cover" /> : (user?.full_name?.charAt(0) || <User size={24}/>)}
                              </div>
                         </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto pb-20">
                    <Routes>
                        <Route index element={<DeliveryOverview />} />
                        <Route path="earnings" element={<EarningsSuite />} />
                        <Route path="completed" element={<MissionArchives />} />
                        <Route path="settings" element={<RiderSettings />} />
                    </Routes>
                    
                    <OrderChat 
                        order={chatOrder} 
                        isOpen={!!chatOrder} 
                        onClose={() => setChatOrder(null)} 
                        role="delivery"
                    />
                </main>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
