import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, AlertTriangle, ArrowRightLeft, Package } from 'lucide-react';

const StockUpdateModal = ({ isOpen, onClose, inventoryItem, onSave }) => {
    const [action, setAction] = useState('restock');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setQuantity('');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen || !inventoryItem) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            action,
            quantity: parseInt(quantity),
            notes
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <form 
                onSubmit={handleSubmit}
                className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
            >
                {/* Header Section */}
                <div className="bg-[#e62020] p-8 text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <TrendingUp size={24} />
                        </div>
                        <button type="button" onClick={onClose} className="hover:rotate-90 transition-transform">
                            <X size={24} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Modify Stock Protocol</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-2">Product: {inventoryItem.product_name}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Hub: {inventoryItem.warehouse_name}</p>
                </div>

                <div className="p-10 space-y-8">
                    {/* Action Selector */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'restock', label: 'Restock', icon: <Package size={14} />, color: 'bg-green-500' },
                            { id: 'damage', label: 'Damage', icon: <AlertTriangle size={14} />, color: 'bg-red-500' },
                            { id: 'transfer', label: 'Transfer', icon: <ArrowRightLeft size={14} />, color: 'bg-blue-500' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                type="button"
                                onClick={() => setAction(btn.id)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all active:scale-95 ${
                                    action === btn.id 
                                    ? 'border-[#e62020] bg-red-50/30' 
                                    : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${action === btn.id ? 'bg-[#e62020]' : 'bg-gray-300'}`}>
                                    {btn.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${action === btn.id ? 'text-[#e62020]' : 'text-gray-400'}`}>
                                    {btn.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Precise Quantity Impact</label>
                        <input
                            required
                            type="number"
                            min="1"
                            placeholder="Enter amount..."
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:border-[#e62020] transition-all"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Operational Notes (Optional)</label>
                        <textarea
                            placeholder="Reason for adjustment..."
                            rows="2"
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#e62020] transition-all resize-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Action Stats */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 italic-none">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-gray-400">
                            <span>Current Stock</span>
                            <span className="text-gray-900">{inventoryItem.stock_quantity} Units</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest mt-3 pt-3 border-t border-gray-200">
                            <span className={action === 'restock' ? 'text-green-600' : 'text-[#e62020]'}>Projected Stock</span>
                            <span className="font-black text-gray-900">
                                {action === 'restock' 
                                    ? (inventoryItem.stock_quantity + (parseInt(quantity) || 0)) 
                                    : (inventoryItem.stock_quantity - (parseInt(quantity) || 0))} Units
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!quantity}
                        className="w-full bg-[#e62020] hover:bg-[#cc1b1b] disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Save size={18} />
                        Sync Stock Levels
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockUpdateModal;
