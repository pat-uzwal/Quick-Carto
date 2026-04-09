import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../features/products/productSlice';
import { ChevronRight, Package, ShoppingBag, Zap, Clock, ShoppingCart, Wine, Sparkles, Cherry, Play } from 'lucide-react';
import { addToCart, updateQuantity, removeFromCart } from '../features/cart/cartSlice';

/* ─── CATEGORY DATA ─── */
const CATEGORY_DATA = [
    { id: 'grocery-and-kitchen', name: 'Grocery & Kitchen', icon: <ShoppingCart className="text-green-600" size={40} />, bg: '#f0fdf4' },
    { id: 'snacks-and-drinks', name: 'Snacks & Drinks', icon: <Cherry className="text-orange-500" size={40} />, bg: '#fff7ed' },
    { id: 'liquors-and-smoke', name: 'Liquors & Smoke', icon: <Wine className="text-yellow-600" size={40} />, bg: '#fef3c7' },
    { id: 'beauty-and-personal-care', name: 'Beauty & Personal Care', icon: <Sparkles className="text-fuchsia-500" size={40} />, bg: '#fdf4ff' },
];

/* ─── INLINE PRODUCT CARD ─── */
const Card = ({ product }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((s) => s.cart?.items || []);
    const cartItem  = cartItems.find((i) => i.id === product._id);
    const qty       = cartItem ? cartItem.quantity : 0;

    const onAdd = (e) => { 
        e.preventDefault(); 
        dispatch(addToCart({ 
            id: product._id, 
            name: product.name, 
            price: product.price, 
            image: product.image 
        })); 
    };
    const onInc = (e) => { e.preventDefault(); dispatch(updateQuantity({ id: product._id, quantity: qty + 1 })); };
    const onDec = (e) => { 
        e.preventDefault(); 
        if (qty === 1) {
            dispatch(removeFromCart({ id: product._id }));
        } else {
            dispatch(updateQuantity({ id: product._id, quantity: qty - 1 }));
        }
    };

    return (
        <Link
            to={`/product/${product._id}`}
            className="flex-shrink-0 w-[190px] bg-white border border-gray-100 shadow-md rounded-[28px] p-5 flex flex-col hover:shadow-2xl hover:-translate-y-2 hover:border-[#e62020]/20 transition-all duration-300 group relative overflow-hidden"
        >
            {/* Out of Stock Overlay */}
            {product.total_stock === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-[28px]">
                    <div className="bg-red-50 text-red-600 font-black text-[11px] px-3 py-1.5 rounded-lg border border-red-200 uppercase tracking-widest shadow-sm">
                        Out of Stock
                    </div>
                </div>
            )}
            {/* Discount Badge */}
            {product.discount > 0 && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-[#ff4500] to-[#ff7300] text-white text-[10px] font-black px-3 py-1.5 rounded-br-2xl shadow-md z-10 flex items-center leading-none tracking-wide">
                    {Math.round(product.discount)}% OFF
                </div>
            )}

            {/* Image Box */}
            <div className="relative w-full h-[160px] bg-gradient-to-b from-gray-50 to-transparent rounded-[20px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4 drop-shadow-md" />
                ) : (
                    <span className="drop-shadow-md text-gray-300">{product.icon || <Package size={80} />}</span>
                )}
            </div>

            {/* Delivery Badge */}
            <div className="bg-red-50/80 border border-red-100 text-[#e62020] text-[9px] font-black px-2.5 py-1 rounded-lg flex w-max items-center gap-1.5 mb-3 shadow-[0_2px_8px_-2px_rgba(230,32,32,0.1)]">
                <span className="text-[12px]"><Zap size={12} className="text-yellow-500" /></span> 10 MINS
            </div>

            {/* Info */}
            <p className="text-[14px] font-black text-gray-900 leading-[1.3] line-clamp-2 min-h-[38px] tracking-tight group-hover:text-[#e62020] transition-colors">{product.name}</p>
            <span className="text-[12px] text-gray-400 font-bold mt-1.5 mb-4 block">{product.weight || '1 pc'}</span>

            {/* Transaction Deck */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col justify-center">
                    {product.originalPrice > product.price && (
                        <span className="text-[11px] text-gray-400 line-through font-bold leading-none mb-1">रू{product.originalPrice}</span>
                    )}
                    <span className="text-[17px] font-black text-gray-900 leading-none tracking-tight">रू{product.price}</span>
                </div>
                
                <div onClick={(e) => e.preventDefault()} className="z-10">
                    {qty === 0 ? (
                        <button
                            onClick={onAdd}
                            disabled={product.total_stock === 0}
                            className={`text-[13px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest transition-all duration-300 border-none ${
                                product.total_stock === 0
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed hidden sm:block'
                                    : 'bg-[#e62020] text-white hover:bg-[#cc1b1b] shadow-xl shadow-[rgba(230,32,32,0.2)] active:scale-90'
                            }`}
                        >
                            ADD
                        </button>
                    ) : (
                        <div className="flex items-center bg-[#e62020] shadow-xl shadow-[rgba(230,32,32,0.2)] text-white rounded-xl h-[38px] text-sm font-bold overflow-hidden w-[82px] justify-between px-1">
                            <button onClick={onDec} className="w-7 h-full flex items-center justify-center hover:bg-black/10 active:bg-black/20 transition-colors font-black">−</button>
                            <span className="text-[13px] flex-1 text-center font-black">{qty}</span>
                            <button onClick={onInc} disabled={qty >= product.total_stock} className={`w-7 h-full flex items-center justify-center transition-colors font-black ${qty >= product.total_stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10 active:bg-black/20'}`}>+</button>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

/* ─── PRODUCT SECTION ─── */
const ProductSection = ({ section }) => (
    <section id={section.id} className="mb-16 scroll-mt-[100px]">
        <div className="flex items-center justify-between px-4 py-6">
            <div>
                <h2 className="text-[32px] md:text-[36px] font-black text-gray-900 tracking-tighter uppercase leading-none">{section.title}</h2>
                <div className="h-1.5 w-12 bg-[#e62020] rounded-full mt-3 shadow-sm" />
            </div>
            <Link
                to={`/category/${section.id}`}
                className="group flex items-center gap-2 text-[13px] font-black text-[#e62020] uppercase tracking-widest hover:translate-x-1 transition-all"
            >
                Vault Explorer <ChevronRight size={18} className="transition-transform group-hover:rotate-12" />
            </Link>
        </div>
        <div
            className="flex gap-6 overflow-x-auto scroll-smooth px-4 pb-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {section.products.map((p) => <Card key={p._id} product={p} />)}
        </div>
    </section>
);

/* ─── HOME COMPONENT ─── */
const Home = () => {
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector((s) => s.products);

    useEffect(() => { 
        dispatch(fetchProducts()); 
    }, [dispatch]);

    /* Dynamically group products by category */
    const dynamicSections = useMemo(() => {
        if (!products || products.length === 0) return [];
        
        const groups = {};
        products.forEach(p => {
            const cat = p.category || 'Other Master Vault';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });

        return Object.keys(groups).map(catName => ({
            id: products.find(p => p.category === catName)?.category_slug || catName.toLowerCase().replace(/ /g, '-'),
            title: catName,
            products: groups[catName]
        })).sort((a, b) => b.products.length - a.products.length); // Primary categories first
    }, [products]);

    return (
        <div className="w-full min-h-screen bg-white pt-[72px] pb-12">
            <div className="max-w-[1440px] xl:max-w-[1600px] w-full mx-auto px-4 md:px-6">

                {/* ── HERO REGISTRY ── */}
                <div className="mt-4 rounded-[40px] relative h-[250px] md:h-[320px] bg-gradient-to-br from-[#e62020] via-[#d61b1b] to-[#b91616] flex items-center px-10 md:px-20 overflow-hidden group shadow-2xl">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]" />
                    
                    {/* Grocery Bag Photo / Masked Background */}
                    <div 
                        className="absolute right-0 top-0 h-full w-[70%] lg:w-[60%] z-0 overflow-hidden"
                        style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 20%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)' }}
                    >
                        <img 
                            src="/images/home banner.webp" 
                            onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"; }}
                            alt="Groceries" 
                            className="w-full h-full object-contain object-right scale-105 origin-right" 
                        />
                    </div>

                    <div className="relative z-20 text-white max-w-lg">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[14px] md:text-[18px] font-black italic tracking-wide border border-white/20 shadow-sm animate-pulse text-[#ffe600]">
                                #letsquickcarto
                            </div>
                        </div>

                        {/* Title Features */}
                        <div className="flex gap-4 mb-4">
                             <div className="flex items-center gap-2 bg-[#b91616] px-4 py-2 rounded-[14px] shadow-inner border border-white/10">
                                 <span className="text-[20px] md:text-[24px]"><Clock size={24} className="text-white" /></span>
                                 <div className="flex flex-col leading-none">
                                     <span className="text-[18px] md:text-[22px] font-black tracking-tighter text-white">10</span>
                                     <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-[#ffe600]">Minute<br/>Delivery</span>
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-2 bg-[#b91616] px-4 py-2 rounded-[14px] shadow-inner border border-white/10">
                                 <span className="text-[20px] md:text-[24px]"><Package size={24} className="text-white" /></span>
                                 <div className="flex flex-col leading-none justify-center">
                                     <span className="text-[12px] md:text-[14px] font-black tracking-wide text-white">FREE</span>
                                     <span className="text-[11px] md:text-[13px] font-bold text-white/90">Delivery</span>
                                 </div>
                             </div>
                        </div>
                        
                        <p className="text-[13px] opacity-90 font-bold tracking-wide mt-6 text-[#ffe600]">
                            You stay home while we haul.
                        </p>
                    </div>
                </div>

                {/* ── TAXONOMY BAR ── */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">Quick Jump</h3>
                        <div className="h-px flex-1 bg-gray-100 ml-6 hidden md:block"></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 md:gap-4 w-full">
                        {(dynamicSections.length > 0 ? dynamicSections : CATEGORY_DATA).map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className="flex-1 min-w-[160px] md:min-w-[240px] px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-[12px] font-black text-gray-800 uppercase tracking-widest hover:border-[#e62020] hover:text-[#e62020] hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 active:scale-95 text-center flex items-center justify-center min-h-[64px]"
                            >
                                {cat.name || cat.title}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── MASTER REGISTRY DYNAMIC SECTIONS ── */}
                <div className="mt-16 space-y-6">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
                           <ShoppingBag size={48} className="animate-bounce" />
                           <span className="text-xs font-black uppercase tracking-[0.3em]">Synchronizing Vault...</span>
                        </div>
                    ) : (
                        dynamicSections.map((section) => (
                            <ProductSection key={section.id} section={section} />
                        ))
                    )}
                </div>

                {/* ── ASSET PROMOTION ── */}
                <Link to="/category/liquors-and-smoke" className="mt-20 block rounded-[48px] bg-gradient-to-r from-[#2a1758] via-[#1a0f3d] to-[#0f082e] p-10 md:p-16 flex items-center justify-between overflow-hidden relative shadow-[0_24px_50px_-15px_rgba(26,15,61,0.5)] group cursor-pointer transition-transform hover:-translate-y-1">
                    
                    {/* Liquor Photo / Masked Background */}
                    <div className="absolute right-0 top-0 h-full w-[60%] lg:w-[50%] z-0 overflow-hidden mix-blend-lighten opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000">
                        {/* Gradient transition masking the image perfectly into the dark purple banner */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2a1758] via-[#1a0f3d]/90 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f082e] via-transparent to-transparent z-10 opacity-60" />
                        <img 
                            src="/images/offers.jpg" 
                            onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"; }}
                            alt="Premium Liquors" 
                            className="w-full h-full object-cover object-center" 
                        />
                    </div>

                    <div className="relative z-20 text-white max-w-lg">
                        <span className="bg-white/10 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase mb-6 flex items-center justify-center gap-2 w-max border border-white/20 backdrop-blur-sm shadow-lg text-[#ffd700]">Weekend Vault <Wine size={14} className="text-[#ffd700]" /></span>
                        <h2 className="text-[36px] md:text-[56px] font-black leading-[1] mb-4 tracking-tighter text-white drop-shadow-2xl uppercase">Premium<br/>Liquors & Smoke</h2>
                        <p className="text-[18px] md:text-[22px] text-white/90 font-black mb-10 flex items-center gap-3">Auth Key: <span className="font-black bg-white/10 px-4 py-1.5 rounded-xl tracking-widest text-[#00ffcc] border border-white/20 shadow-inner drop-shadow-md">PARTY20</span></p>
                        <div className="inline-block bg-[#00ffcc] text-[#0f082e] font-black text-[16px] px-10 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl hover:shadow-[#00ffcc]/30 uppercase tracking-[0.1em]">Explore Collection</div>
                    </div>
                </Link>

                {/* ── MASTER FOOTER ── */}
                <footer className="mt-24 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-10 mb-12 px-2 md:px-0 border-t border-gray-100 pt-16">
                        {/* Useful Links Section */}
                        <div className="md:col-span-2 lg:col-span-4 flex flex-col">
                            <h3 className="text-[20px] font-black text-gray-900 mb-6 tracking-tight">Useful Links</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-[15px] text-gray-500 font-medium">
                                <Link to="/about" className="hover:text-gray-900 transition-colors">About Us</Link>
                                <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
                                <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
                                <Link to="/delivery" className="hover:text-gray-900 transition-colors">Delivery</Link>
                                <Link to="/faqs" className="hover:text-gray-900 transition-colors">FAQs</Link>
                                <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                                <Link to="/security" className="hover:text-gray-900 transition-colors">Security</Link>
                                <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                                <Link to="/warehouse-partner" className="hover:text-gray-900 transition-colors">Warehouse</Link>
                            </div>
                        </div>

                        {/* Categories Section */}
                        <div className="md:col-span-2 lg:col-span-8 flex flex-col">
                            <div className="flex items-baseline gap-4 mb-6">
                                <h3 className="text-[20px] font-black text-gray-900 tracking-tight">Categories</h3>
                                <Link to="/categories" className="text-[15px] font-bold text-green-600 hover:text-green-700 transition-colors">see all</Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-y-4 gap-x-4 text-[15px] text-gray-500 font-medium">
                                {dynamicSections.length > 0 ? dynamicSections.map((section, idx) => (
                                    <Link key={idx} to={`/category/${section.id}`} className="hover:text-gray-900 transition-colors truncate">
                                        {section.title}
                                    </Link>
                                )) : CATEGORY_DATA.map((c, idx) => (
                                    <Link key={idx} to={`/category/${c.id}`} className="hover:text-gray-900 transition-colors truncate">
                                        {c.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="py-8 bg-gray-50/80 rounded-[24px] px-8 flex flex-col lg:flex-row items-center justify-between gap-8 mt-10">
                        {/* Copyright */}
                        <div className="text-[14px] font-bold text-gray-500 text-center lg:text-left">
                            © My Basket Private Limited, 2026
                        </div>
                        
                        {/* Download App & Socials */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex items-center gap-4">
                                <span className="text-[15px] font-black text-gray-800">Download App</span>
                                <div className="flex gap-3">
                                    <button className="bg-gray-900 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] hover:bg-black transition-all min-w-[130px]">
                                        <div className="flex flex-col items-start leading-none text-left">
                                            <span className="text-[9px] font-semibold opacity-90 mb-0.5">Download on the</span>
                                            <span className="text-[13px] font-bold">App Store</span>
                                        </div>
                                    </button>
                                    <button className="bg-gray-900 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] hover:bg-black transition-all min-w-[130px]">
                                        <span className="text-[18px] leading-none text-[#ffeb3b]"><Play size={18} /></span>
                                        <div className="flex flex-col items-start leading-none text-left">
                                            <span className="text-[9px] font-semibold opacity-90 mb-0.5">GET IT ON</span>
                                            <span className="text-[13px] font-bold">Google Play</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {[
                                    { icon: 'f', label: 'Facebook' }, 
                                    { icon: 'X', label: 'X' }, 
                                    { icon: 'in', label: 'LinkedIn' }, 
                                    { icon: 'ig', label: 'Instagram' }
                                ].map((item, idx) => (
                                    <Link key={idx} to="#" aria-label={item.label} className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[18px] hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg transition-all">
                                        {item.icon}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default Home;
