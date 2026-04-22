import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/products/productSlice';
import { ChevronRight, Package, Grid, ArrowRight, ShoppingCart } from 'lucide-react';

// Static category definitions with icons & colors
const STATIC_CATEGORIES = [
    { id: 'grocery-and-kitchen',      name: 'Grocery & Kitchen',      color: '#16a34a', bg: '#f0fdf4', accent: '#dcfce7' },
    { id: 'snacks-and-drinks',        name: 'Snacks & Drinks',        color: '#ea580c', bg: '#fff7ed', accent: '#ffedd5' },
    { id: 'liquors-and-smoke',        name: 'Liquors & Smoke',        color: '#ca8a04', bg: '#fefce8', accent: '#fef9c3' },
    { id: 'beauty-and-personal-care', name: 'Beauty & Personal Care', color: '#c026d3', bg: '#fdf4ff', accent: '#fae8ff' },
];

const AllCategories = () => {
    const dispatch = useDispatch();
    const { items: products, loading } = useSelector((s) => s.products);

    useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

    // Build dynamic categories with product counts from backend
    const categories = useMemo(() => {
        const dynamic = {};
        (products || []).forEach(p => {
            const slug = p.category_slug || (p.category || 'other').toLowerCase().replace(/ /g, '-');
            const name = p.category || slug;
            if (!dynamic[slug]) dynamic[slug] = { id: slug, name, count: 0 };
            dynamic[slug].count++;
        });

        // Merge dynamic counts into static definitions (or create fallback entries)
        const merged = STATIC_CATEGORIES.map(cat => ({
            ...cat,
            count: dynamic[cat.id]?.count || 0,
        }));

        // Add any backend categories not in our static list
        Object.values(dynamic).forEach(dynCat => {
            if (!merged.find(c => c.id === dynCat.id)) {
                merged.push({
                    ...dynCat,
                    color: '#e62020',
                    bg: '#fff5f5',
                    accent: '#fee2e2',
                });
            }
        });

        return merged.filter(c => c.count > 0 || STATIC_CATEGORIES.find(s => s.id === c.id));
    }, [products]);

    return (
        <div className="w-full min-h-screen bg-white pt-[72px] pb-24">
            <div className="max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 md:px-10">

                {/* ── PAGE HEADER ── */}
                <div className="py-12 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">
                            <Link to="/" className="hover:text-[#e62020] transition-colors">Home</Link>
                            <ChevronRight size={14} />
                            <span className="text-[#e62020]">All Categories</span>
                        </div>
                        <h1 className="text-[40px] md:text-[52px] font-black text-gray-900 tracking-tighter uppercase leading-none">
                            All Categories
                        </h1>
                        <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mt-3">
                            {categories.length} master taxonomies · {(products || []).length} total products
                        </p>
                    </div>
                    <Grid size={48} className="text-gray-100 hidden md:block" />
                </div>

                {/* ── LOADING ── */}
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-4 text-gray-300">
                        <Package size={56} className="animate-bounce" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Loading categories…</span>
                    </div>
                ) : (
                    <>
                        {/* ── CATEGORY GRID ── */}
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/category/${cat.id}`}
                                    className="group relative rounded-[28px] overflow-hidden border-2 border-transparent hover:border-current transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ '--category-color': cat.color }}
                                >
                                    {/* Card Background */}
                                    <div
                                        className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: `linear-gradient(135deg, ${cat.bg} 0%, ${cat.accent} 100%)` }}
                                    />

                                    <div className="relative p-8 flex flex-col gap-6 min-h-[200px] justify-between">
                                        <div>
                                            <h2
                                                className="text-[20px] font-black tracking-tighter uppercase leading-none mb-2 group-hover:translate-x-1 transition-transform duration-300"
                                                style={{ color: cat.color }}
                                            >
                                                {cat.name}
                                            </h2>
                                            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest">
                                                {cat.count} Products
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div
                                            className="absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                                            style={{ background: cat.color }}
                                        >
                                            <ArrowRight size={18} className="text-white" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* ── QUICK LINKS STRIP ── */}
                        <div className="mt-20 bg-gray-50 rounded-[32px] p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter">
                                    Can't find what you need?
                                </h3>
                                <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    Search across all products instantly
                                </p>
                            </div>
                            <Link
                                to="/search?q="
                                className="flex items-center gap-3 bg-[#e62020] text-white px-8 py-4 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] hover:bg-[#cc1b1b] hover:scale-105 active:scale-95 transition-all"
                            >
                                <ShoppingCart size={20} />
                                Browse All Products
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AllCategories;
