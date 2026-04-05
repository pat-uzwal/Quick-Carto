import { X, Save, Tag, Hash, ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        image_url: ''
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                image_url: category.image_url || ''
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                image_url: ''
            });
        }
    }, [category]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-end p-0">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="px-10 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-100">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            {category ? 'Modify Category' : 'Create Category'}
                        </h2>
                        <p className="text-[10px] font-black text-[#e62020] uppercase tracking-[0.2em] mt-2">
                             Taxonomy Tree Configuration
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl transition-all group"
                    >
                        <X size={24} className="group-active:scale-95 transition-transform" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10 pb-40">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-gray-400">
                             <Tag size={14} className="text-[#e62020]" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Descriptor</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Display Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Beverages" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-gray-400">
                             <Hash size={14} className="text-[#e62020]" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Routing Backbone</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Slug Key (URL-friendly)</label>
                            <input name="slug" value={formData.slug} onChange={handleChange} required placeholder="beverages-and-drinks" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-mono font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-1 px-1">Must be unique and hyphenated. No spaces or symbols.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-gray-400">
                             <ImageIcon size={14} className="text-[#e62020]" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Visual Asset</span>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Pool Image Upload</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) {
                                        const reader = new FileReader();
                                        reader.readAsDataURL(file);
                                        reader.onload = () => {
                                            setFormData(prev => ({ ...prev, image_url: reader.result }));
                                        };
                                    }
                                }} 
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold text-blue-500 focus:outline-none focus:border-[#e62020] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#e62020] hover:file:bg-red-100" 
                            />
                        </div>
                        {formData.image_url && (
                            <div className="w-full h-40 bg-gray-100 rounded-[24px] overflow-hidden border border-gray-100 flex items-center justify-center p-8 transition-all hover:p-4">
                                <img src={formData.image_url} alt="Reference" className="w-full h-full object-contain" />
                            </div>
                        )}
                    </div>
                </form>

                <div className="absolute bottom-0 left-0 right-0 p-10 bg-white/95 backdrop-blur-md border-t border-gray-100 flex gap-4">
                    <button onClick={onClose} type="button" className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">
                        Discard Changes
                    </button>
                    <button onClick={handleSubmit} type="button" className="flex-[2] py-4 px-6 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <Save size={18} /> Update Tree Matrix
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
