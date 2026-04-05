import { X, Save, Warehouse } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const WarehouseModal = ({ isOpen, onClose, warehouse, onSave }) => {
    const { accessToken } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        is_active: true
    });

    useEffect(() => {
        if (warehouse) {
            setFormData({
                name: warehouse.name || '',
                code: warehouse.code || '',
                address: warehouse.address || '',
                is_active: warehouse.is_active !== undefined ? warehouse.is_active : true
            });
        } else {
            setFormData({
                name: '',
                code: '',
                address: '',
                is_active: true
            });
        }
    }, [warehouse]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = warehouse 
                ? `http://localhost:8000/api/admin/warehouses/${warehouse.id}/`
                : 'http://localhost:8000/api/admin/warehouses/';
            
            const method = warehouse ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSave();
            } else {
                const errorData = await res.json();
                alert(`Error: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            console.error("Network Error saving warehouse", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-end p-0">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-10 pt-10 pb-6 flex items-center justify-between bg-white border-b border-gray-100 flex-none z-20">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            {warehouse ? 'Modify Warehouse' : 'Setup New Node'}
                        </h2>
                        <p className="text-[10px] font-black text-[#e62020] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                             <Warehouse size={12} /> Global Logistics Network
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
                        <X size={24} className="group-active:scale-95 transition-transform" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Warehouse Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Kathmandu Core Hub" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Node Reference Code</label>
                            <input name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. WH-KTM" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-mono font-bold focus:outline-none focus:border-[#e62020] transition-all" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Location Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} required rows={3} placeholder="Full address coordinates..." className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#e62020] transition-all resize-none" />
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 accent-[#e62020] rounded cursor-pointer" />
                            <label htmlFor="is_active" className="text-sm font-black text-gray-900 tracking-tight cursor-pointer">
                                Node Operational Status (Active)
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-10 bg-white border-t border-gray-100 flex gap-4 flex-none z-20">
                    <button onClick={onClose} type="button" className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} type="button" className="flex-[2] py-4 px-6 bg-[#e62020] hover:bg-[#cc1b1b] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[rgba(230,32,32,0.25)] flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <Save size={18} /> Initialize Node
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarehouseModal;
