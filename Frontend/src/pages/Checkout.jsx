import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../features/cart/cartSlice';
import KhaltiCheckout from 'khalti-checkout-web';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { MapPin, CheckCircle2, Wallet, CreditCard, ChevronRight, Navigation2, Loader2, Ticket, Check, AlertTriangle } from 'lucide-react';

const Checkout = () => {
    const { items, totalAmount } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const products = useSelector((state) => state.products?.items || []);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [address, setAddress] = useState({
        street: '',
        area: '',
        city: 'Kathmandu',
        phone: ''
    });
    const [nearestWarehouse, setNearestWarehouse] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // cod or khalti
    
    // Coupon States
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        if (items.length === 0) {
            navigate('/');
        }
    }, [items, navigate]);

    // Auto-detect user address dynamically from their raw GPS location
    useEffect(() => {
        if (!user) return;

        const resolveLocationDetails = async (lat, lng) => {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const geoData = await geoRes.json();
                
                // Parse accurate fields from the OSMap API
                const addressObj = geoData.address || {};
                const resolvedCity = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || 'Kathmandu';
                const resolvedArea = addressObj.suburb || addressObj.neighbourhood || addressObj.village || addressObj.city_district || 'Bagbazaar';
                const resolvedStreet = addressObj.road || addressObj.pedestrian || addressObj.path || `${resolvedArea} Road` || 'Main Road';

                setAddress({
                    street: resolvedStreet,
                    area: resolvedArea,
                    city: resolvedCity,
                    phone: user.phone_number || user.phone || ''
                });

                // Auto assign nearest warehouse (currently static fallback unless real API implemented)
                setNearestWarehouse({
                    id: 'WH-AUTO',
                    name: `Central Hub ${resolvedCity}`,
                    distance: 'Fetching...',
                    estimatedTime: '10 mins'
                });
            } catch (err) {
                console.error("Geocoding Address Error:", err);
                setAddress({
                    street: 'Main Road',
                    area: user.current_location || 'Bagbazaar',
                    city: 'Kathmandu',
                    phone: user.phone_number || user.phone || ''
                });
            }
        };

        if (user.latitude && user.longitude) {
            resolveLocationDetails(user.latitude, user.longitude);
        } else if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolveLocationDetails(pos.coords.latitude, pos.coords.longitude),
                () => console.warn("GPS Denied at Checkout")
            );
        } else {
            // Ultimate fallback
            setAddress(prev => ({ ...prev, phone: user.phone_number || '' }));
        }

    }, [user]);

    const handleInputChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const [currentOrder, setCurrentOrder] = useState(null);
    const [showKhaltiModal, setShowKhaltiModal] = useState(false);
    const [mockPaymentStep, setMockPaymentStep] = useState(1); // 1: input, 2: otp, 3: success
    const [mockDetails, setMockDetails] = useState({ mobile: '', pin: '', otp: '' });

    const handlePlaceOrder = async (e) => {
        if (e) e.preventDefault();
        setIsProcessing(true);

        try {
            await api.post('/cart/sync/', {
                items: items.map(item => ({
                    product: item.id || item.product?.id || item._id,
                    quantity: item.quantity
                }))
            });

            const orderRes = await api.post('/orders/place/', {
                delivery_address: `${address.street}, ${address.area}, ${address.city}`,
                delivery_lat: user?.latitude ? parseFloat(user.latitude).toFixed(6) : "27.717200",
                delivery_lng: user?.longitude ? parseFloat(user.longitude).toFixed(6) : "85.324000",
                coupon_code: appliedCoupon?.code || null,
                payment_method: paymentMethod // notify backend to mark as packed
            });
            
            const order = orderRes.data;
            setCurrentOrder(order);

            if (paymentMethod === 'khalti') {
                setShowKhaltiModal(true);
                setMockPaymentStep(1);
                setMockDetails({ mobile: '', pin: '', otp: '' });
                setIsProcessing(false);
            } else {
                finishOrderSuccess();
            }
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            alert("Failed to place order.");
        }
    };

    const handleMockPaymentNext = async () => {
        if (mockPaymentStep === 1) {
            if (!mockDetails.mobile || !mockDetails.pin) return alert("Please enter mobile and PIN");
            setMockPaymentStep(3); // Skip straight to success animation
            setTimeout(() => {
                setShowKhaltiModal(false);
                finishOrderSuccess();
            }, 800);
        }
    };

    const finishOrderSuccess = () => {
        alert('Order placed successfully! Arriving in 10 minutes.');
        dispatch(clearCart());
        navigate('/orders');
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        setCouponError('');
        try {
            const res = await api.post('/coupons/validate/', {
                code: couponCode,
                cart_total: totalAmount
            });
            setAppliedCoupon(res.data);
            setCouponCode('');
        } catch (err) {
            setCouponError(err.response?.data?.detail || 'Invalid coupon');
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const rawDelivery = localStorage.getItem('deliveryFee');
    const rawPlatform = localStorage.getItem('platformFee');
    const rawThreshold = localStorage.getItem('freeThreshold');

    const currentDelivery = rawDelivery ? parseFloat(rawDelivery.toString().replace(/[^0-9.]/g, '')) : 40;
    const currentPlatform = rawPlatform ? parseFloat(rawPlatform.toString().replace(/[^0-9.]/g, '')) : 10;
    const currentThreshold = rawThreshold ? parseFloat(rawThreshold.toString().replace(/[^0-9.]/g, '')) : 500;

    const deliveryFee = totalAmount > 0 && totalAmount < currentThreshold ? currentDelivery : 0;
    const platformFee = currentPlatform;
    
    // Calculate totals with coupon
    const subtotalAfterOffers = totalAmount;
    let couponDiscount = 0;
    if (appliedCoupon) {
        couponDiscount = Math.round((subtotalAfterOffers * appliedCoupon.discount_percentage) / 100);
    }
    
    const grandTotal = subtotalAfterOffers - couponDiscount + deliveryFee + platformFee;

    // Validate any out of stock items in the cart dynamically
    const outOfStockItems = items.filter(item => {
        const productData = products.find(p => String(p.id || p._id) === String(item.id || item._id));
        return productData && productData.total_stock < item.quantity;
    });
    const hasOutOfStock = outOfStockItems.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 mt-[88px]">
                {/* Left Side: Forms */}
                <div className="flex-1 space-y-8">
                    
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none border-b-4 border-[#e62020] inline-block pb-2">Checkout</h1>

                    <form onSubmit={handlePlaceOrder} className="space-y-8">
                        {/* Delivery Details Panel */}
                        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Delivery Address</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Auto-detected Location</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Street Address</label>
                                    <input type="text" name="street" required value={address.street} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Area / Locality</label>
                                    <input type="text" name="area" required value={address.area} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">City</label>
                                    <input type="text" name="city" required value={address.city} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Contact Phone</label>
                                    <input type="tel" name="phone" required value={address.phone} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] focus:bg-white transition-all shadow-inner" />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Panel */}
                        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Payment Options</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Select your preference</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#e62020] bg-red-50/50 shadow-md shadow-red-500/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-[#e62020]' : 'border-gray-300'}`}>
                                        {paymentMethod === 'cod' && <div className="w-3 h-3 bg-[#e62020] rounded-full"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Wallet size={16} className={paymentMethod === 'cod' ? 'text-[#e62020]' : 'text-gray-400'} />
                                            <span className="text-sm font-black uppercase tracking-widest text-gray-900">COD</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Cash on Delivery</span>
                                    </div>
                                    <input type="radio" name="payment" value="cod" className="hidden" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                </label>

                                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'khalti' ? 'border-purple-600 bg-purple-50/50 shadow-md shadow-purple-500/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'khalti' ? 'border-purple-600' : 'border-gray-300'}`}>
                                        {paymentMethod === 'khalti' && <div className="w-3 h-3 bg-purple-600 rounded-full"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} className={paymentMethod === 'khalti' ? 'text-purple-600' : 'text-gray-400'} />
                                            <span className="text-sm font-black uppercase tracking-widest text-gray-900">Khalti</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Digital Wallet</span>
                                    </div>
                                    <input type="radio" name="payment" value="khalti" className="hidden" checked={paymentMethod === 'khalti'} onChange={() => setPaymentMethod('khalti')} />
                                </label>
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Promo Code</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Have an Auth Key?</p>
                                </div>
                            </div>

                            {appliedCoupon ? (
                                <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-2xl p-6 flex justify-between items-center animate-in zoom-in-95">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-500 font-black"><Check size={24} /></div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Code {appliedCoupon.code} Applied</p>
                                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">{appliedCoupon.discount_percentage}% Extra Discount Secured</p>
                                        </div>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-xs font-black uppercase text-red-500 hover:text-red-700 transition-colors px-4 py-2 hover:bg-red-50 rounded-xl">Remove</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <input 
                                            type="text" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="ENTER AUTH KEY (e.g. PARTY20)"
                                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-yellow-400 focus:bg-white transition-all placeholder:text-gray-300"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={isValidatingCoupon || !couponCode}
                                            className="px-8 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                                        >
                                            {isValidatingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <p className="text-[10px] font-black uppercase text-red-500 tracking-widest ml-1 animate-in slide-in-from-left-2 flex items-center gap-1"><AlertTriangle size={12} /> {couponError}</p>}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="space-y-4">
                            {hasOutOfStock && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-black text-red-600 uppercase tracking-widest leading-none mb-1">Items Out of Stock</p>
                                        <p className="text-[10px] font-bold text-red-500 uppercase">Please remove or reduce quantity for: {outOfStockItems.map(i => i.name).join(', ')}</p>
                                    </div>
                                </div>
                            )}
                            <button type="submit" disabled={isProcessing || hasOutOfStock} className="w-full flex items-center justify-center gap-3 bg-[#e62020] hover:bg-[#cc1b1b] text-white p-6 rounded-[24px] text-lg font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.3)] transition-all active:scale-95 disabled:opacity-50 group">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <>Place Order • <span className="text-red-200">NPR {grandTotal}</span> <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform"/></>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Side: Order Summary */}
                <div className="w-full lg:w-[400px]">
                    <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 sticky top-32">
                        
                        <div className="flex items-center gap-4 border-b-2 border-dashed border-gray-100 pb-6 mb-6">
                            <div className="w-14 h-14 bg-red-50 text-[#e62020] rounded-[20px] flex items-center justify-center shadow-inner font-black text-2xl">
                                ⏱
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">In 10 Minutes</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#e62020]">Serving from Central Hub</p>
                            </div>
                        </div>

                        <ul className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
                            {items.map(item => (
                                <li key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-100 group-hover:bg-red-50 group-hover:text-[#e62020] group-hover:border-red-100 transition-colors">
                                            {item.quantity}x
                                        </span>
                                        <span className="text-xs font-black uppercase text-gray-900 group-hover:text-[#e62020] transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-gray-500">Rs {item.price * item.quantity}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-6">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                                <span>Cart Total</span>
                                <span>Rs {totalAmount}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-green-600">
                                    <span>Coupon ({appliedCoupon.code})</span>
                                    <span>- Rs {couponDiscount}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                                <span>Handling Fee</span>
                                <span>Rs {platformFee}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-[#e62020]">
                                <span>Delivery Fee</span>
                                <span>{deliveryFee === 0 ? 'FREE' : `Rs ${deliveryFee}`}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-900 text-white rounded-[20px] p-6 shadow-xl">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Grand Total</span>
                            <span className="text-2xl font-black">NPR {grandTotal}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom High-Fidelity Khalti Mock Modal */}
            {showKhaltiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-[400px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="bg-[#5C2D91] p-6 flex flex-col items-center">
                            <img src="https://khalti.com/static/img/logo1.png" alt="Khalti" className="h-10 mb-2 brightness-0 invert" />
                            <div className="flex gap-1">
                                {[1, 3].map(i => (
                                    <div key={i} className={`h-1.5 w-1.5 rounded-full ${mockPaymentStep >= i ? 'bg-white' : 'bg-white/30'}`} />
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {mockPaymentStep === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="text-center">
                                        <h3 className="font-black text-[#5C2D91] text-lg uppercase tracking-tight">Wallet Checkout</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enter your details to proceed</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Mobile Number</label>
                                            <input 
                                                type="tel" 
                                                placeholder="98XXXXXXXX" 
                                                value={mockDetails.mobile}
                                                onChange={(e) => setMockDetails({...mockDetails, mobile: e.target.value})}
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#5C2D91]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Payment PIN</label>
                                            <input 
                                                type="password" 
                                                placeholder="XXXX" 
                                                value={mockDetails.pin}
                                                onChange={(e) => setMockDetails({...mockDetails, pin: e.target.value})}
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#5C2D91]" 
                                            />
                                        </div>
                                    </div>
                                    <button onClick={handleMockPaymentNext} className="w-full bg-[#5C2D91] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-purple-200 active:scale-95 transition-all">Pay NPR {grandTotal}</button>
                                </div>
                            )}

                            {mockPaymentStep === 3 && (
                                <div className="space-y-6 animate-in zoom-in-95 text-center py-4">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-100 animate-bounce">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight">Payment Verified</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Order successfully initiated</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[#5C2D91] font-black italic animate-pulse">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-[10px] uppercase tracking-[0.3em]">Finalizing...</span>
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setShowKhaltiModal(false)} className="w-full mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-colors">Cancel Payment</button>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-2 grayscale opacity-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Powered by</span>
                            <img src="https://khalti.com/static/img/logo1.png" alt="Khalti" className="h-4" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
