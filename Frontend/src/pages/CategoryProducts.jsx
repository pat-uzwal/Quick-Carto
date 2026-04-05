import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/products/productSlice';
import { ChevronRight, Filter, LayoutGrid, List as ListIcon, AlertCircle, ShoppingBag, Store, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
    { id: 'grocery-and-kitchen', name: 'Grocery & Kitchen', icon: '🛒', sub: ['Rice', 'Daal', 'Cooking Oil', 'Tea & Coffee'] },
    { id: 'snacks-and-drinks', name: 'Snacks & Drinks', icon: '🍿', sub: ['Chips, Cheese Balls, Rings & Sticks', 'Chocolates & Sweets', 'Soft Drinks, Coke & Juices'] },
    { id: 'liquors-and-smoke', name: 'Liquors & Smokes', icon: '🍾', sub: ['Hard Drinks & Liquors', 'Smokes'] },
    { id: 'beauty-and-personal-care', name: 'Beauty & Personal Care', icon: '💄', sub: ['Baby Care Essentials', 'Hair Care Essentials', 'Skin Care Essentials', 'Deodorants & Perfumes'] },
];

const CategoryProducts = () => {
    const { categoryId } = useParams();
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector((state) => state.products);
    
    const currentCategory = useMemo(() => 
        CATEGORIES.find(c => c.id === categoryId) || 
        { id: categoryId, name: categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), icon: '📦', sub: ['All'] }
    , [categoryId]);

    const [activeSub, setActiveSub] = useState('All');

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch, categoryId]);

    useEffect(() => {
        // Reset sub filter when category changes
        setActiveSub('All');
    }, [categoryId]);

    const filteredProducts = useMemo(() => {
        // 1. Universal Content Matcher: Build a base set of everything that MIGHT belong here
        const baseSet = products.filter(p => {
            const pName = (p.name || '').toLowerCase();
            const pCat = (p.category || '').toLowerCase();
            const mainCatName = currentCategory.name.toLowerCase();
            
            // 1. Standard Category Container match (Strictly follow the DB category if possible)
            const isMainCat = p.category_slug === categoryId ||
                            p.category_id?.toString() === categoryId ||
                            pCat.replace(/ & /g, '-and-').replace(/ /g, '-') === categoryId ||
                            pCat === mainCatName;
            
            // 2. High-Precision Rejection: Exclude Beauty/Personal items from other pages
            const beautyKeywords = ['soap', 'shampoo', 'face wash', 'lotion', 'cream', 'toothpaste', 'brush', 'bath', 'perfume', 'deodorant', 'pads', 'shave', 'comb', 'serum', 'retinol', 'retional', 'rhyn'];
            if (categoryId !== 'beauty-and-personal-care') {
                if (beautyKeywords.some(k => pName.includes(k))) return false;
            }

            // Block sweets and snacks from grocery (even if they are in that cat in DB)
            if (categoryId === 'grocery-and-kitchen') {
                if (pName.includes('gulab jamun') || pName.includes('snicker') || pName.includes('chocolate') || pName.includes('chips') || pName.includes('lays') || pName.includes('beer') || pName.includes('vodka')) return false;
            }

            if (isMainCat) return true;

            // 3. Tactical Cross-Category Tunneling: High-Precision matching by page
            let tunnelKeywords = [];
            if (categoryId === 'snacks-and-drinks') {
                tunnelKeywords = ['chocolate', 'choco', 'lays', 'kurkure', 'chips', 'coke', 'cola', 'pepsi', 'fanta', 'sprite', 'juice', 'gulab', 'jamun', 'rasbhari', 'titaura', 'candy', 'rabbit', 'haldiram'];
            } else if (categoryId === 'liquors-and-smoke') {
                tunnelKeywords = ['vodka', 'vodak', '8848', 'whiskey', 'whisky', 'gin', 'beer', 'wine', 'rum', 'tuborg', 'tuberg', 'cigarette', 'khukuri', 'surya', 'esse'];
            } else if (categoryId === 'beauty-and-personal-care') {
                tunnelKeywords = beautyKeywords;
            }

            return tunnelKeywords.some(k => pName.includes(k));
        });

        // 2. Filter by Sub-Category (activeSub) with High-Performance Isolation
        if (activeSub === 'All') return baseSet;
        
        return baseSet.filter(p => {
            const name = (p.name || '').toLowerCase();
            const sub = activeSub.toLowerCase();
            
            // High-Precision Expansion for Sub-Sections
            const clean = (w) => w.toLowerCase().replace(/[,.]/g, '').replace(/s$/, '').trim();
            let expandedKeywords = sub.split(/[ &]+/).map(clean).filter(k => k.length >= 3);
            
            if (sub.includes('smoke')) {
                expandedKeywords = [...expandedKeywords, 'cigarette', 'cigar', 'smoke', 'esse', 'surya'];
            }
            if (sub.includes('liquor')) {
                expandedKeywords = [...expandedKeywords, 'vodka', 'vodak', '8848', 'whiskey', 'whisky', 'gin', 'beer', 'wine', 'rum', 'tuborg', 'tuberg'];
            }
            if (sub.includes('drink') || sub.includes('juice')) {
                // Strict Isolation for Drinks: No chips or chocolates
                if (name.includes('chips') || (name.includes('chocolate') && !name.includes('shake'))) return false;
                expandedKeywords = [...expandedKeywords, 'coke', 'cola', 'pepsi', 'drink', 'juice', 'soda', 'fanta', 'sprite', 'shake', 'milk'];
            }
            if (sub.includes('choco') || sub.includes('sweet')) {
                // ABSOLUTE INCLUSION: If it says chocolate or choco or brand, IT IS IN.
                if (name.includes('chocolate') || name.includes('choco') || name.includes('cadbury') || name.includes('snickers') || name.includes('kit kat') || name.includes('kitkat') || name.includes('rafello') || name.includes('white rabbit') || name.includes('titaura') || name.includes('sweets') || name.includes('candy') || name.includes('haldiram') || name.includes('rasbhari')) return true;
                expandedKeywords = [...expandedKeywords, 'sugar', 'dark', 'silk', 'oreo', 'munch', 'gulab', 'jamun'];
            }
            if (sub.includes('chips') || sub.includes('snack')) {
                expandedKeywords = [...expandedKeywords, 'lays', 'potato', 'onion', 'ring', 'stick', 'kurkure', 'cheese', 'ball', 'sitan'];
            }
            if (sub.includes('baby')) {
                expandedKeywords = [...expandedKeywords, 'baby', 'johnson', 'diaper', 'pampers', 'cerelac', 'himalaya'];
            }
            if (sub.includes('hair')) {
                // Strict Isolation for Hair Care: No face/body care or fragrance
                if (name.includes('deo') || name.includes('spray') || name.includes('perfume') || name.includes('face wash') || name.includes('soap') || name.includes('lotion') || name.includes('cream')) return false;
                expandedKeywords = [...expandedKeywords, 'shampoo', 'hair', 'conditioner', 'rescue', 'oil', 'vatika', 'clinic', 'sunsilk', 'dove', 'pantene', 'head'];
            }
            if (sub.includes('skin')) {
                // Strict Isolation for Skin Care: No hair care or fragrance
                if (name.includes('deo') || name.includes('spray') || name.includes('perfume') || name.includes('shampoo') || name.includes('hair') || name.includes('conditioner')) return false;
                expandedKeywords = [...expandedKeywords, 'skin', 'face wash', 'face', 'soap', 'cream', 'lotion', 'serum', 'retinol', 'retional', 'rhyn', 'nivea', 'pond', 'dove', 'garnier', 'fair'];
            }
            if (sub.includes('deodorant') || sub.includes('perfume')) {
                // Strict Isolation for Fragrance: No skin care/hair care items
                if (name.includes('face wash') || name.includes('soap') || name.includes('lotion') || name.includes('cream') || name.includes('shampoo') || name.includes('hair') || name.includes('rescue')) return false;
                expandedKeywords = [...expandedKeywords, 'deodorant', 'deo', 'spray', 'perfume', 'fogg', 'fragrance', 'axe', 'nivea', 'engage', 'fog'];
            }

            return expandedKeywords.some(k => name.includes(k));
        });
    }, [products, categoryId, activeSub, currentCategory]);

    return (
        <div className="w-full bg-white pt-[72px] min-h-screen">
            <div className="max-w-[1600px] mx-auto flex">
                
                {/* Tactical Sidebar */}
                <aside className="w-[340px] shrink-0 border-r border-gray-100 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto no-scrollbar bg-white p-8">
                    <div className="space-y-6">
                        <div className="pb-8 border-b border-gray-50 flex items-center gap-4">
                            <div className="text-[40px] drop-shadow-sm">{currentCategory.icon}</div>
                            <div>
                                <h2 className="text-[20px] font-black text-gray-900 tracking-tighter uppercase leading-none">{currentCategory.name}</h2>
                                <p className="text-[9px] font-black text-[#e62020] uppercase tracking-[0.2em] mt-2">Master Taxonomy Filter</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {['All', ...(currentCategory?.sub || [])].map((subName, index) => (
                                <div 
                                    onClick={() => setActiveSub(subName)}
                                    key={index} 
                                    className={`flex items-center gap-4 px-6 py-5 cursor-pointer rounded-2xl transition-all border-2 active:scale-95 ${activeSub === subName ? 'border-[#e62020] bg-red-50/30' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeSub === subName ? 'bg-white shadow-sm' : 'bg-gray-100 opacity-40 grayscale'}`}>
                                        <div className="text-[16px]">{currentCategory.icon}</div>
                                    </div>
                                    <span className={`text-[13px] font-black tracking-widest uppercase ${activeSub === subName ? 'text-[#e62020]' : 'text-gray-400'}`}>
                                        {subName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 pb-32">
                    {/* Tactical Header Strip */}
                     <div className="px-14 py-12 border-b border-gray-50 flex items-center justify-between sticky top-[72px] bg-white/95 backdrop-blur-md z-20">
                          <div className="flex flex-col gap-2">
                             <h1 className="text-[36px] font-black text-gray-900 tracking-tighter uppercase leading-none">Deploying {activeSub}</h1>
                             <div className="flex items-center gap-3">
                                 <div className="h-2 w-10 bg-[#e62020] rounded-full" />
                                 <span className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">{filteredProducts.length} Assets Registered</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <button className="flex items-center gap-3 text-[11px] font-black text-gray-900 border-2 border-gray-100 px-10 py-4 rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest shadow-sm">
                                Filter Protocols <ChevronDown size={14} className="text-[#e62020]" />
                            </button>
                         </div>
                    </div>

                    {/* Operational Grid */}
                    {loading ? (
                         <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
                            <ShoppingBag size={48} className="animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Downloading SKU Registry...</span>
                         </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-6 p-12">
                            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center border border-gray-100">
                                <AlertCircle size={40} className="text-gray-200" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-gray-900 uppercase">Operational Deficit</h3>
                                <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">No assets found for "{activeSub}" in the master vault.</p>
                            </div>
                            <button onClick={() => setActiveSub('All')} className="px-8 py-3 bg-[#e62020] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-[rgba(230,32,32,0.2)]">Clear Active Protocols</button>
                        </div>
                    ) : (
                        <div className="p-14 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {filteredProducts.map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    )}

                    {/* SEO Operational Insight */}
                    <section className="mt-32 px-14 py-40 bg-gray-50 border-y border-gray-100">
                        <div className="max-w-[1200px] mx-auto space-y-24">
                            <div className="space-y-8">
                                <div className="inline-block px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-[#e62020] uppercase tracking-widest shadow-sm">Master Guide</div>
                                <h2 className="text-[44px] font-black text-gray-900 uppercase tracking-tighter leading-none">{currentCategory.name} Logistics</h2>
                                <p className="text-[16px] font-bold text-gray-500 leading-relaxed uppercase opacity-70 tracking-tight">
                                    Our {currentCategory.name.toLowerCase()} registry is sourced directly from certified tactical hubs. We prioritize high-impact nutrients and essential daily assets for 10-minute ground deployment within your sector.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                                <div className="space-y-10">
                                     <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-4">
                                         <div className="w-2 h-10 bg-[#e62020] rounded-full" />
                                         Tactical Value
                                     </h3>
                                     <ul className="space-y-8">
                                         {['High-Precision Nutrients', 'Certified Flash Storage (10 Mins)', 'Direct Protocol Sourcing'].map(v => (
                                             <li key={v} className="flex items-center gap-6 text-[13px] font-black text-gray-400 uppercase tracking-widest">
                                                 <div className="w-4 h-4 rounded-lg bg-[#e62020] shadow-[0_4px_12px_rgba(230,32,32,0.3)]"></div> {v}
                                             </li>
                                         ))}
                                     </ul>
                                </div>
                                <div className="space-y-10">
                                     <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-widest">Master Price registry</h3>
                                     <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50">
                                         {filteredProducts.slice(0, 4).map((row, idx) => (
                                            <div key={idx} className={`flex justify-between px-10 py-8 text-[12px] font-black uppercase tracking-widest border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                <span className="text-gray-400">{row.name}</span>
                                                <span className="text-gray-900">रू {row.price}</span>
                                            </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-40 text-center opacity-30 text-[10px] font-black uppercase tracking-[1em] pb-24">
                         © 2026 QUICKBASKET HUB PVT. LTD. NEPAL
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CategoryProducts;
