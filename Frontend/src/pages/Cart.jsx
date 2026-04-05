import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { updateQuantity, removeFromCart, clearCart } from '../features/cart/cartSlice';
import { ShoppingBasket, Trash2, ArrowLeft, ChevronRight, Zap, ShieldCheck, Minus, Plus, MapPin } from 'lucide-react';

const Cart = () => {
    const { items, totalAmount, totalItems } = useSelector((state) => state.cart);
    const { user, detectedLocation } = useSelector((state) => state.auth);
    const [nearestHub, setNearestHub] = useState(null);
    const [loadingHub, setLoadingHub] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNearestHub = async () => {
            if (items.length === 0) return;
            setLoadingHub(true);
            try {
                // Get lat/lng from user profile or browser API
                let lat = user?.latitude || 27.7172; // Fallback to KTM center
                let lng = user?.longitude || 85.3240;

                const res = await api.get(`/nearest-warehouse/?lat=${lat}&lng=${lng}&product_ids=${items.map(i => i.id).join(',')}`);
                if (res.data) setNearestHub(res.data);
            } catch (err) {
                console.warn("Hub detection failed, using fallback");
            } finally {
                setLoadingHub(false);
            }
        };

        fetchNearestHub();
    }, [items, user]);

    const handleIncrement = (id, currentQty) => {
        dispatch(updateQuantity({ id, quantity: currentQty + 1 }));
    };

    const handleDecrement = (id, currentQty) => {
        if (currentQty === 1) {
            dispatch(removeFromCart({ id }));
        } else {
            dispatch(updateQuantity({ id, quantity: currentQty - 1 }));
        }
    };

    const rawDelivery = localStorage.getItem('deliveryFee');
    const rawPlatform = localStorage.getItem('platformFee');
    const rawThreshold = localStorage.getItem('freeThreshold');

    const currentDelivery = rawDelivery ? parseFloat(rawDelivery.toString().replace(/[^0-9.]/g, '')) : 40;
    const currentPlatform = rawPlatform ? parseFloat(rawPlatform.toString().replace(/[^0-9.]/g, '')) : 10;
    const currentThreshold = rawThreshold ? parseFloat(rawThreshold.toString().replace(/[^0-9.]/g, '')) : 500;
    
    const deliveryFee = totalAmount > 0 && totalAmount < currentThreshold ? currentDelivery : 0;
    const platformFee = currentPlatform;
    const grandTotal = totalAmount + deliveryFee + platformFee;

    if (items.length === 0) {
        return (
            <div className="max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12 animate-in pb-40 px-6">
                <div className="w-64 h-64 bg-gray-50 rounded-[60px] flex items-center justify-center shadow-xl shadow-gray-200/50 rotate-3 hover:rotate-0 transition-transform duration-700 border-4 border-white">
                    <ShoppingBasket size={100} strokeWidth={1} className="text-[#e62020]/30" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Your Hub is Empty</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto">Looks like you haven't secured any fresh items yet. Let's start stocking up.</p>
                </div>
                <Link
                    to="/"
                    className="bg-[#e62020] hover:bg-[#cc1b1b] text-white flex items-center gap-3 px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] hover:scale-105 active:scale-95 transition-all"
                >
                    Explore Marketplace <ChevronRight size={18} />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-20 animate-in pb-40 px-6 mt-10">
            
            {/* Header: Clean & Airy */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-2 border-gray-100 pb-12">
                <div className="space-y-3">
                     <div className="flex items-center gap-3 text-[#e62020] font-black uppercase text-[10px] tracking-[0.3em]">
                        <Zap size={14} className="animate-pulse" /> Live Order Sync
                     </div>
                     <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">Checkout Basket</h1>
                </div>
                <div className="hidden sm:flex items-center gap-4 bg-red-50/50 px-6 py-3 rounded-2xl border border-red-100">
                    <span className="text-[14px] font-black text-[#e62020] uppercase tracking-tight">{totalItems} Fresh Items Ready</span>
                </div>
            </div>

            <div className="lg:flex lg:gap-24 items-start">
                {/* Left Side: Spacious List */}
                <div className="w-full lg:w-[65%] space-y-8">
                    <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-bl-full"></div>
                        
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                                    Items from {nearestHub?.name || (detectedLocation?.includes('Lalitpur') ? 'Lalitpur' : 'Kathmandu')} Hub
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e62020]">Verified Dispatch Center</p>
                            </div>
                            <button
                                onClick={() => dispatch(clearCart())}
                                className="flex items-center gap-2 text-[11px] font-extrabold text-red-500 hover:text-red-700 transition-all uppercase tracking-widest"
                            >
                                <Trash2 size={16} /> Reset Basket
                            </button>
                        </div>

                        <div className="space-y-10">
                            {items.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pb-10 border-b border-gray-100 last:border-0 last:pb-0 group">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[24px] flex items-center justify-center shrink-0 border border-gray-200 group-hover:bg-red-50 transition-colors duration-500 overflow-hidden text-4xl relative">
                                            {(item.image && (
                                                item.image.trim().startsWith('http') || 
                                                item.image.trim().startsWith('/') || 
                                                item.image.trim().startsWith('data:') || 
                                                item.image.trim().includes('/images/') ||
                                                /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.image.trim())
                                            )) ? (
                                                <>
                                                    <img 
                                                        src={(() => {
                                                            const path = (item.image.trim().startsWith('http') || item.image.trim().startsWith('data:')) 
                                                                ? item.image.trim() 
                                                                : (item.image.trim().startsWith('/') ? item.image.trim() : `/${item.image.trim()}`);
                                                            return encodeURI(path);
                                                        })()} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-contain p-2 mix-blend-multiply drop-shadow-sm" 
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            if (e.target.nextSibling) e.target.nextSibling.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <span className="drop-shadow-sm hidden text-4xl">📦</span>
                                                </>
                                            ) : (
                                                <span className="drop-shadow-sm text-xs break-all">{item.image || '📦'}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter group-hover:text-[#e62020] transition-colors">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none">In Stock • Fresh Pack</span>
                                            </div>
                                            <div className="text-[15px] font-black text-gray-900 mt-2">रू {item.price}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center bg-[#e62020] text-white rounded-2xl shadow-xl shadow-[rgba(230,32,32,0.25)] h-14 w-36 overflow-hidden border-b-4 border-black/10 shrink-0">
                                        <button
                                            onClick={() => handleDecrement(item.id, item.quantity)}
                                            className="flex-1 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                                        ><Minus size={20} strokeWidth={4} /></button>
                                        <span className="w-12 text-center font-black text-lg">{item.quantity}</span>
                                        <button
                                            onClick={() => handleIncrement(item.id, item.quantity)}
                                            className="flex-1 h-full hover:bg-black/10 transition-colors flex items-center justify-center"
                                        ><Plus size={20} strokeWidth={4} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/" className="inline-flex items-center gap-3 text-[13px] font-black text-[#e62020] uppercase tracking-widest bg-white border-2 border-red-100 px-10 py-5 rounded-[24px] hover:border-[#e62020] hover:bg-red-50 transition-all hover:-translate-x-2">
                        <ArrowLeft size={18} /> Add more from store
                    </Link>
                </div>

                {/* Right Side: Robust Summary Section */}
                <div className="w-full lg:w-[35%] lg:sticky top-32">
                    <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Bill Details</h2>
                            <div className="h-1.5 w-16 bg-[#e62020] rounded-full"></div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Hub Subtotal</span>
                                <span className="text-gray-900">रू {totalAmount}</span>
                            </div>

                            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Regional Delivery</span>
                                {deliveryFee === 0 ? (
                                    <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">FREE PASS</span>
                                ) : (
                                    <span className="text-gray-900">रू {deliveryFee}</span>
                                )}
                            </div>

                            {deliveryFee > 0 && (
                                <div className="p-5 bg-orange-50 border border-orange-100 rounded-[20px] shadow-sm">
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.05em] leading-relaxed">
                                        Secure <span className="underline">FREE DELIVERY</span> by adding रू {currentThreshold - totalAmount} more items.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Hub Platform Fee</span>
                                <span className="text-gray-900">रू {platformFee}</span>
                            </div>
                        </div>

                        <div className="pt-10 border-t-2 border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-[13px] text-gray-500 uppercase tracking-[0.2em]">Grand Total</span>
                                <span className="font-black text-3xl text-gray-900 tracking-tighter leading-none">रू {grandTotal}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest mb-10 opacity-60">
                                <ShieldCheck size={14} /> Total Secure Transaction
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-[#e62020] hover:bg-[#cc1b1b] text-white font-black py-6 px-10 rounded-[28px] transition-all shadow-xl shadow-[rgba(230,32,32,0.25)] text-[15px] uppercase tracking-widest flex justify-between items-center border-b-8 border-black/10 active:scale-95 group"
                            >
                                <span className="group-hover:scale-110 transition-transform">रू {grandTotal}</span>
                                <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    Proceed <ChevronRight size={20} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
