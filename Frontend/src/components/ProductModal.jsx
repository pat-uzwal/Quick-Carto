import { X, Save, Package, Tag, Layers, Truck, Image as ImageIcon, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const ProductModal = ({ isOpen, onClose, product, categories, onSave }) => {
    const { accessToken } = useSelector(state => state.auth);
    const [warehouses, setWarehouses] = useState([]);

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
    const [formData, setFormData] = useState({
        product_name: '',
        sku: '',
        brand: '',
        category: '',
        unit: 'pcs',
        weight: 1,
        mrp: 0,
        selling_price: 0,
        price: 0,
        images: [], // array of string URLs or base64 data
        description: '',
        status: 'ready',
        warehouse: 'Kathmandu Hub',
        low_stock_threshold: 10
    });

    useEffect(() => {
        if (product) {
            setFormData({
                product_name: product.name || '',
                sku: product.sku || '',
                brand: product.brand || '',
                category: product.category || product.category_id || '',
                unit: product.unit || 'pcs',
                weight: product.weight || 1,
                mrp: product.mrp || 0,
                selling_price: product.selling_price || 0,
                price: product.price || 0,
                images: Array.isArray(product.images_json) ? [...product.images_json] : [],
                description: product.description || '',
                status: product.is_active ? 'ready' : 'out_of_stock',
                warehouse: product.warehouse || 'Kathmandu Hub',
                low_stock_threshold: product.low_stock_threshold || 10
            });
        } else {
            setFormData({
                product_name: '',
                sku: '',
                brand: '',
                category: categories[0]?.id || '', // Initialize with first category if available
                unit: 'pcs',
                weight: 1,
                mrp: 0,
                selling_price: 0,
                price: 0,
                images: [],
                description: '',
                status: 'ready',
                warehouse: 'Kathmandu Hub',
                low_stock_threshold: 10
            });
        }
    }, [product, categories]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let finalValue = value;
        if (type === 'number') finalValue = parseFloat(value) || 0;
        
        setFormData(prev => {
            const newState = { ...prev, [name]: finalValue };
            // Sync price with selling_price automatically if linked
            if (name === 'selling_price') newState.price = finalValue;
            return newState;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const imagesList = Array.isArray(formData.images) ? formData.images : [];
        const payload = {
            ...formData,
            images_json: imagesList,
            image_url: imagesList.length > 0 ? imagesList[0] : '',
            name: formData.product_name, // Map product_name back to name for API
            unit_type: formData.unit, // Map unit back to unit_type for API
            weight_volume: formData.weight, // Map weight back to weight_volume for API
            is_active: formData.status === 'ready' // Map status back to is_active for API
        };
        // Remove temporary fields not needed in the final payload
        delete payload.product_name;
        delete payload.unit;
        delete payload.weight;
        delete payload.status;
        delete payload.images;

        onSave(payload);
    };

    const firstImage = Array.isArray(formData.images) && formData.images.length > 0 ? formData.images[0] : null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-end p-0">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Right Side Drawer Style */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header - Fixed */}
                <div className="px-10 pt-10 pb-6 flex items-center justify-between bg-white border-b border-gray-100 flex-none z-20">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            {product ? 'Modify Sku' : 'New Product Onboarding'}
                        </h2>
                        <p className="text-[10px] font-black text-[#e62020] uppercase tracking-[0.2em] mt-2">
                             Logistics & Pricing Registry
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl transition-all group"
                    >
                        <X size={24} className="group-active:scale-95 transition-transform" />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-20">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Product Identity</label>
                                <input name="product_name" value={formData.product_name} onChange={handleChange} required placeholder="Product Name" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Stock Keeping Unit (SKU)</label>
                                <input name="sku" value={formData.sku} onChange={handleChange} required placeholder="e.g. RICE-JB-1KG" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-mono font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Brand Designation</label>
                                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand Name" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catalog Tree node</label>
                                <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all appearance-none cursor-pointer">
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Unit Archetype</label>
                                <select name="unit" value={formData.unit} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all appearance-none cursor-pointer">
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="l">Liter (l)</option>
                                    <option value="pcs">Pieces (pcs)</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Net Weight / Volume</label>
                                <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-8">
                            <div className="flex items-center gap-2 text-[#e62020]">
                                <DollarSign size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Monetary Configuration (रू)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Maximum Retail (MRP)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">रू</span>
                                        <input type="number" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:border-[#e62020]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Selling Value</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">रू</span>
                                        <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:border-[#e62020]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Final Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">रू</span>
                                        <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:border-[#e62020]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Supply Node (Warehouse)</label>
                                <select name="warehouse" value={formData.warehouse} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all appearance-none cursor-pointer">
                                    <option value="">Select Warehouse...</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.name}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Critical Stock Trigger</label>
                                <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Life-Cycle Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all appearance-none cursor-pointer">
                                    <option value="ready">Ready for Dispatch</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Asset Registry (Upload Images)</label>
                                <input type="file" multiple accept="image/*" onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if(files.length === 0) return;
                                    Promise.all(files.map(file => {
                                        return new Promise((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.readAsDataURL(file);
                                            reader.onload = () => resolve(reader.result);
                                            reader.onerror = error => reject(error);
                                        });
                                    })).then(base64Images => {
                                        setFormData(prev => ({
                                            ...prev,
                                            images: base64Images
                                        }));
                                    });
                                }} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 text-xs font-bold text-blue-500 focus:outline-none focus:border-[#e62020] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#e62020] hover:file:bg-red-100" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Marketplace Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-gray-50 border border-gray-100 rounded-[28px] px-8 py-6 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all resize-none" />
                        </div>

                        {firstImage && (
                             <div className="w-full h-48 bg-gray-100 rounded-[24px] overflow-hidden border border-gray-100 flex items-center justify-center p-8 transition-all hover:p-4">
                                <img src={firstImage} alt="Reference" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
                             </div>
                        )}
                    </form>
                </div>

                {/* Footer Buttons - Fixed */}
                <div className="p-10 bg-white/95 backdrop-blur-md border-t border-gray-100 flex gap-4 flex-none z-20">
                    <button onClick={onClose} type="button" className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">
                        Discard Changes
                    </button>
                    <button onClick={handleSubmit} type="button" className="flex-[2] py-4 px-6 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <Save size={18} /> Sync with Master Vault
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
