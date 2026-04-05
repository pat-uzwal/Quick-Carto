import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Package, Clock, CheckCircle2, ChevronRight, XCircle, FileText, Truck, MessageSquare, Star, Send, X } from 'lucide-react';
import OrderChat from '../components/DeliveryChat';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, accessToken } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [chatOrder, setChatOrder] = useState(null);
    const [ratingOrder, setRatingOrder] = useState(null);

    useEffect(() => {
        if (!user || !accessToken) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders/');
                const data = res.data.results || res.data;
                console.log("Orders Fetched:", data);
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, accessToken, navigate]);

    const getStatusWidget = (status) => {
        const statuses = {
            'pending': { icon: <Clock className="text-yellow-500" size={16}/>, text: 'Verifying', bg: 'bg-yellow-50', border: 'border-yellow-200', textClass: 'text-yellow-700' },
            'packed': { icon: <Package className="text-blue-500" size={16}/>, text: 'Packing At Hub', bg: 'bg-blue-50', border: 'border-blue-200', textClass: 'text-blue-700' },
            'out_for_delivery': { icon: <Truck className="text-purple-500" size={16}/>, text: 'Out For Delivery', bg: 'bg-purple-50', border: 'border-purple-200', textClass: 'text-purple-700' },
            'delivered': { icon: <CheckCircle2 className="text-green-500" size={16}/>, text: 'Delivered', bg: 'bg-green-50', border: 'border-green-200', textClass: 'text-green-700' },
            'cancelled': { icon: <XCircle className="text-red-500" size={16}/>, text: 'Cancelled', bg: 'bg-red-50', border: 'border-red-200', textClass: 'text-red-700' }
        };
        const active = statuses[status] || statuses['pending'];
        return (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${active.bg} ${active.border} ${active.textClass}`}>
                {active.icon}
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{active.text}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow w-full max-w-[1000px] mx-auto px-4 py-12 mt-[88px]">
                <div className="mb-10 text-center animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-red-50 text-[#e62020] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <FileText size={28} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">My Orders</h1>
                    <p className="text-gray-400 mt-3 font-bold uppercase tracking-widest text-sm">Track your recent deliveries</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#e62020] rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-16 text-center shadow-xl border border-gray-100">
                        <Package size={64} className="mx-auto text-gray-200 mb-6" />
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">No Active Orders</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">You haven't placed any orders yet.</p>
                        <button onClick={() => navigate('/')} className="bg-[#e62020] text-white px-8 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const showOTP = order.status === 'out_for_delivery' || order.status === 'packed';
                            
                            return (
                                <div key={order.id} className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row group">
                                    {/* Left Status Area */}
                                    <div className="bg-gray-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 min-w-[240px]">
                                        {getStatusWidget(order.status)}
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Order #{order.id}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Middle Content */}
                                    <div className="p-8 flex-grow">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e62020] mb-1">Delivering To</p>
                                                <p className="font-black text-gray-900 text-sm max-w-[250px] truncate">{order.delivery_address || 'Current Location'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Amount</p>
                                                <p className="font-black text-gray-900 text-lg leading-none">NPR {order.total_amount}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {(order.items || []).slice(0, 2).map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                                                    <span className="text-xs font-black text-gray-700 uppercase">{item.product_name || `Item #${item.product}`}</span>
                                                    <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">Qty: {item.quantity}</span>
                                                </div>
                                            ))}
                                            {(order.items?.length || 0) > 2 && (
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2 pl-2">
                                                    +{order.items.length - 2} more items
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                     {/* Right Context / OTP Area / Actions */}
                                    <div className={`p-8 border-t md:border-t-0 md:border-l flex flex-col items-center justify-center min-w-[280px] ${showOTP ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                        {showOTP ? (
                                            <>
                                                <ShieldIcon />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e62020] mb-2 text-center">Delivery Verification PIN</p>
                                                <div className="bg-white border-2 border-dashed border-[#e62020] rounded-2xl px-6 py-4 shadow-sm group-hover:scale-105 transition-transform mb-6">
                                                    <p className="text-3xl font-black text-gray-900 tracking-[0.2em]">{order.delivery_otp}</p>
                                                </div>
                                                <button onClick={() => setChatOrder(order)} className="flex items-center gap-3 w-full justify-center py-4 bg-gray-900 text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"><MessageSquare size={14}/> Chat with Rider</button>
                                            </>
                                        ) : order.status === 'delivered' ? (
                                            <div className="w-full space-y-4">
                                                {!order.is_rated ? (
                                                    <button onClick={() => setRatingOrder(order)} className="flex items-center gap-3 w-full justify-center py-4 bg-[#FF3B30] text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"><Star size={14}/> Rate Delivery Boy</button>
                                                ) : (
                                                    <div className="flex flex-col items-center bg-green-50 p-6 rounded-[24px] border border-green-100">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={14} className={i < order.rating?.stars ? "fill-green-500 text-green-500" : "text-gray-200"} />
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Experience Rated</p>
                                                        {order.rating?.review && <p className="text-[11px] font-bold text-gray-500 italic text-center">"{order.rating.review}"</p>}
                                                    </div>
                                                )}
                                                <button onClick={() => navigate(`/product/${order.items?.[0]?.product}`)} className="flex items-center gap-3 w-full justify-center py-4 bg-white border border-gray-100 text-gray-900 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Order Again</button>
                                            </div>
                                        ) : (
                                            <div className="text-center opacity-40"><Package size={48} className="mx-auto mb-4"/><p className="text-[9px] font-black uppercase tracking-widest">Logs Secured</p></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} onSuccess={() => { setRatingOrder(null); window.location.reload(); }} />
            
            <OrderChat 
                order={chatOrder} 
                isOpen={!!chatOrder} 
                onClose={() => setChatOrder(null)} 
                role="customer"
            />
        </div>
    );
};

const RatingModal = ({ order, onClose, onSuccess }) => {
    const [stars, setStars] = useState(5);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    if (!order) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/orders/${order.id}/rate/`, { stars, review });
            if (res.status === 201) onSuccess();
        } catch (e) { alert("Rating submission failed. Already rated?"); }
        finally { setLoading(false); onClose(); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] rounded-[48px] shadow-2xl p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-gray-900 transition-colors"><X/></button>
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/10"><Star size={40} fill="currentColor"/></div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-gray-900">Rate Delivery</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">How was your experience with the runner?</p>
                </div>

                <div className="flex justify-center gap-3 mb-10">
                    {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setStars(s)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${stars >= s ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/20 active:scale-95' : 'bg-gray-100 text-gray-300'}`}><Star size={24} fill={stars >= s ? 'currentColor' : 'none'}/></button>
                    ))}
                </div>

                <textarea 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Describe his service... (Optional)"
                    className="w-full bg-gray-50 border border-gray-100 rounded-[32px] p-8 text-sm font-black uppercase text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-yellow-400 outline-none transition-all min-h-[160px] resize-none mb-10"
                />

                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-gray-900 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Submit Review 🚀'}
                </button>
            </div>
        </div>
    );
};

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#e62020] mb-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export default MyOrders;
