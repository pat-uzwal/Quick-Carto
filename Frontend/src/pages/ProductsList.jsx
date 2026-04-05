import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, LayoutGrid, List as ListIcon, AlertCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const MOCK_PRODUCTS = [
     // Beauty & Personal Care (Hair Care)
     { _id: 'h1', name: 'Head & Shoulder Cool Menthol Shampoo', price: 465, originalPrice: 465, weight: '340ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h2', name: 'Head & Shoulder Smooth & Silky Shampoo', price: 580, originalPrice: 580, weight: '340ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h3', name: 'Head & Shoulder Cool Menthol Shampoo', price: 849, originalPrice: 849, weight: '650ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h4', name: 'Head & Shoulder Anti Hairfall Shampoo', price: 465, originalPrice: 465, weight: '340ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h5', name: 'Head & Shoulder Anti Hairfall Shampoo', price: 259, originalPrice: 259, weight: '180ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h6', name: 'Clinic Plus Shampoo', price: 515, originalPrice: 515, weight: '625ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
     { _id: 'h7', name: 'Sunsilk Onion Shampoo', price: 730, originalPrice: 730, weight: '700ml', category: 'beauty-personal-care', subCategory: 'Hair Care' },
 
     // Grocery
     { _id: 'g1', name: 'Aashirvaad Superior MP Atta', price: 650, originalPrice: 650, weight: '5kg', category: 'grocery-kitchen' },
     { _id: 'g2', name: 'Fortune Soya Bean Oil', price: 220, originalPrice: 220, weight: '1L', category: 'grocery-kitchen' },
     { _id: 'g3', name: 'Tata Salt Vacuum Evaporated', price: 25, originalPrice: 25, weight: '1kg', category: 'grocery-kitchen' },
     { _id: 'g4', name: 'Maggi 2-Minute Noodles', price: 20, originalPrice: 20, weight: '70g', category: 'grocery-kitchen' },
 
     // Snacks
     { _id: 's1', name: 'Lays Magic Masala', price: 30, originalPrice: 30, weight: '40g', category: 'snacks-drinks' },
     { _id: 's2', name: 'Dairy Milk Silk Hazelnut', price: 180, originalPrice: 180, weight: '60g', category: 'snacks-drinks' },
     { _id: 's3', name: 'Coca-Cola Zero Can', price: 60, originalPrice: 60, weight: '330ml', category: 'snacks-drinks' },
 
     // Liquors
     { _id: 'l1', name: 'Old Durbar Black Chimney', price: 3250, originalPrice: 3250, weight: '750ml', category: 'liquors-smokes' },
     { _id: 'l2', name: 'Khukri XXX Rum', price: 1850, originalPrice: 1850, weight: '750ml', category: 'liquors-smokes' },
];

const ProductsList = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Backend uses 'search' as param name, frontend uses 'q'
                const res = await fetch(`${API}/products/?search=${encodeURIComponent(query)}`);
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [query]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-[#e62020] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Scouring Catalog...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-xl font-bold text-text-primary uppercase tracking-tighter">
                        {query ? `Search results for "${query}"` : 'Market Catalog'}
                    </h1>
                    <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-1.5">{products.length} items found</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-bg-secondary rounded-lg p-1 border border-border">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-text-muted'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-text-muted'}`}><ListIcon size={16} /></button>
                    </div>
                </div>
            </div>

            {products.length > 0 ? (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" 
                    : "space-y-4"}>
                    {products.map((product) => (
                        <ProductCard key={product.id || product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-gray-50/30">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-[#e62020]">
                        <SearchIcon size={32} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Items Found</h2>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto mt-2">Check spelling or try a broader category</p>
                </div>
            )}
        </div>
    );
};

export default ProductsList;
