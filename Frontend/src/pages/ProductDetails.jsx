import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/products/productSlice';
import { addToCart, updateQuantity, removeFromCart } from '../features/cart/cartSlice';
import { Plus, Minus, Star, ShoppingBag, Clock, ShieldCheck, Zap, ChevronLeft, ChevronRight, Share2, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { items: products, status } = useSelector((state) => state.products);
    const cartItems = useSelector((state) => state.cart?.items || []);

    const product = products.find((p) => p._id === id) || {
        _id: id,
        name: 'Organic Damask Rose Gulkand',
        price: 303,
        originalPrice: 350,
        weight: '200 g',
        description: 'Made with organic damask rose petals and rock sugar. Sun-cooked organic Gulkand to ensure freshness and nutrition for your lifestyle.',
        category: 'Jam & Spreads',
        icon: '🍯'
    };

    const cartItem = cartItems.find((item) => item.id === id);
    const quantity = cartItem ? cartItem.quantity : 0;

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts());
        }
    }, [status, dispatch]);

    const handleAddToCart = () => {
        dispatch(addToCart({ id: product._id, name: product.name, price: product.price, image: product.icon }));
    };

    const handleIncrement = () => {
        dispatch(updateQuantity({ id: product._id, quantity: quantity + 1 }));
    };

    const handleDecrement = () => {
        if (quantity === 1) {
            dispatch(removeFromCart({ id: product._id }));
        } else {
            dispatch(updateQuantity({ id: product._id, quantity: quantity - 1 }));
        }
    };

    return (
        <div className="w-full bg-white pt-[72px] pb-40 min-h-screen">
            
            {/* 1. INCREASED PAGE SIZE - 1600PX */}
            <div className="max-w-[1600px] mx-auto px-10 relative">
                
                {/* 2. BREADCRUMBS */}
                <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 my-8">
                     <Link to="/" className="hover:text-[#e62020] transition-colors">Home</Link>
                     <ChevronRight size={14} className="opacity-50" />
                     <Link to={`/category/${product.category.toLowerCase().replace(/ /g, '-')}`} className="hover:text-[#e62020] transition-colors">{product.category}</Link>
                     <ChevronRight size={14} className="opacity-50" />
                     <span className="text-gray-800 font-bold truncate">{product.name}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-20 lg:gap-32 items-start border-b border-black/5 pb-32">
                    
                    {/* 3. PRODUCT IMAGE AREA */}
                    <div className="lg:w-[500px] shrink-0">
                        <div className="relative aspect-square bg-gradient-to-b from-gray-50 to-transparent rounded-[32px] overflow-hidden flex items-center justify-center border border-gray-100 group shadow-sm hover:shadow-xl transition-all sm:w-full max-w-[500px] mx-auto">
                             <div className="group-hover:scale-110 group-hover:-translate-y-4 transition-transform duration-500 will-change-transform z-10 w-full h-full flex items-center justify-center">
                                 {product.image ? (
                                     <img src={product.image} alt={product.name} className="w-full h-full object-contain p-8 drop-shadow-lg" />
                                 ) : (
                                     <span className="text-[180px] md:text-[240px]">{product.icon || '📦'}</span>
                                 )}
                             </div>
                             <div className="absolute top-6 right-6 flex flex-col gap-4 z-20">
                                <button className="w-12 h-12 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-full flex items-center justify-center text-gray-600 hover:text-[#e62020] hover:shadow-md transition-all group/btn bg-blend-glass"><Share2 size={20} className="group-hover/btn:scale-110 transition-transform" /></button>
                             </div>
                             {/* Decorative highlight glow */}
                             <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-white/60 blur-3xl pointer-events-none rounded-full" />
                        </div>
                    </div>

                    {/* 4. SPECS AREA */}
                    <div className="flex-1 space-y-8">
                        <div>
                             <h1 className="text-[32px] md:text-[44px] font-black text-gray-900 tracking-tight leading-[1.1] mb-2">
                                 {product.name}
                             </h1>
                             <div className="text-[14px] text-gray-500 font-bold uppercase tracking-widest">{product.weight}</div>
                        </div>

                        {/* SELECT UNIT SECTION */}
                        <div className="space-y-4">
                             <span className="text-[15px] font-black tracking-tight text-gray-900">Select Unit</span>
                             <div className="flex flex-wrap gap-4">
                                 <div className="border-[2px] border-[#e62020] bg-red-50/50 p-4 px-6 rounded-[16px] flex flex-col gap-1 min-w-[160px] cursor-pointer shadow-[0_4px_12px_rgba(230,32,32,0.1)] transition-all relative overflow-hidden">
                                      {/* Active Indicator */}
                                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-[#e62020] border-l-transparent">
                                          <div className="absolute top-[-26px] right-[2px] text-white font-bold text-[10px]">✓</div>
                                      </div>
                                      <span className="text-[15px] font-bold text-gray-900">{product.weight}</span>
                                      <div className="flex items-end gap-2 text-gray-500">
                                           <span className="text-[14px] font-black text-gray-900">रू {product.price}</span>
                                           {product.originalPrice > product.price && (
                                               <span className="text-[12px] font-medium line-through">रू {product.originalPrice}</span>
                                           )}
                                      </div>
                                 </div>
                                 <div className="border border-gray-200 bg-gray-50/50 p-4 px-6 rounded-[16px] flex flex-col gap-1 min-w-[160px] opacity-60 cursor-not-allowed hidden sm:flex">
                                      <span className="text-[15px] font-semibold text-gray-600">500 g</span>
                                      <span className="text-[12px] font-bold text-gray-400 mt-auto">Out of stock</span>
                                 </div>
                             </div>
                        </div>

                        {/* PRICE & ADD BUTTON */}
                        <div className="py-8 border-y border-gray-100 flex items-center justify-between gap-6">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[40px] font-black text-gray-900 tracking-tight leading-none">रू {product.price}</span>
                                    {product.originalPrice > product.price && (
                                        <div className="flex flex-col justify-end pb-1">
                                            <span className="text-[16px] text-gray-400 line-through font-semibold leading-none mb-1 shadow-none">रू {product.originalPrice}</span>
                                            <span className="bg-orange-100 text-[#ff4500] text-[10px] font-black px-2 py-0.5 rounded leading-none">
                                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-[180px] shrink-0">
                                {quantity === 0 ? (
                                    <button onClick={handleAddToCart} className="w-full bg-[#e62020] text-white h-[54px] rounded-[16px] font-black text-[16px] shadow-[0_8px_20px_-6px_rgba(230,32,32,0.5)] hover:bg-[#cc1b1b] hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-wide">
                                          ADD
                                    </button>
                                ) : (
                                    <div className="flex items-center bg-[#e62020] text-white font-black rounded-[16px] h-[54px] shadow-[0_8px_20px_-6px_rgba(230,32,32,0.5)] hover:-translate-y-1 transition-transform">
                                        <button onClick={handleDecrement} className="w-14 h-full hover:bg-black/10 transition-colors flex items-center justify-center text-3xl active:bg-black/20 rounded-l-[16px] pb-1">−</button>
                                        <span className="flex-1 text-center text-[18px]">{quantity}</span>
                                        <button onClick={handleIncrement} className="w-14 h-full hover:bg-black/10 transition-colors flex items-center justify-center text-3xl active:bg-black/20 rounded-r-[16px] pb-1">+</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* WHY SHOP SECTION */}
                        <div className="pt-4 space-y-6">
                             <h4 className="text-[18px] font-black text-gray-900 tracking-tight">Why shop from QuickCarto?</h4>
                             <div className="flex flex-col gap-6">
                                 <div className="flex items-center gap-5 group">
                                      <div className="w-14 h-14 bg-red-50 rounded-[16px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚡</div>
                                      <div className="flex flex-col">
                                          <h5 className="text-[15px] font-bold text-gray-900 tracking-tight">Superfast Delivery</h5>
                                          <p className="text-[13px] font-medium text-gray-500 leading-snug">Get your order delivered to your doorstep at the earliest from local hubs.</p>
                                      </div>
                                 </div>
                                 <div className="flex items-center gap-5 group">
                                      <div className="w-14 h-14 bg-blue-50 rounded-[16px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💎</div>
                                      <div className="flex flex-col">
                                          <h5 className="text-[15px] font-bold text-gray-900 tracking-tight">Best Prices & Offers</h5>
                                          <p className="text-[13px] font-medium text-gray-500 leading-snug">Best price destination with awesome offers directly from the manufacturers.</p>
                                      </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="mt-48 text-center opacity-30 text-[11px] font-black uppercase tracking-[1em] pb-20">
                     © 2026 QUICKCARTO HUB PVT. LTD. NEPAL
                </div>

            </div>
        </div>
    );
};

export default ProductDetails;
