import { useState, useEffect, useRef } from 'react';
import { Send, Image, MessageSquare, Phone, MapPin, X, User, ShieldAlert } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const OrderChat = ({ order, isOpen, onClose, role }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [context, setContext] = useState('ORDER'); // ORDER, WAREHOUSE, SUPPORT
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const accessToken = localStorage.getItem('accessToken');

    const fetchMessages = async () => {
        if (!isOpen || !order?.id) return;
        try {
            const res = await fetch(`${API}/delivery/orders/${order.id}/chat/?context=${context}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) setMessages(await res.json());
        } catch (e) {}
    };

    useEffect(() => {
        fetchMessages();
        const int = setInterval(fetchMessages, 3000);
        return () => clearInterval(int);
    }, [isOpen, order?.id, context]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text, type = 'text') => {
        const msgText = text || newMessage;
        if (!msgText.trim()) return;

        try {
            const res = await fetch(`${API}/delivery/orders/${order.id}/chat/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: msgText, context, type })
            });
            if (res.ok) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (e) {}
    };

    const quickActions = {
        ORDER: [
            { label: "I'm on the way", msg: "I'm on the way to your location!" },
            { label: "Arriving soon", msg: "I'll be there in 2 minutes." },
            { label: "Call me", msg: "Please call me at your convenience." }
        ],
        WAREHOUSE: [
            { label: "At Pickup", msg: "I've arrived at the warehouse for pickup." },
            { label: "Item Missing", msg: "One of the items is currently unavailable here." }
        ]
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-[100] flex flex-col font-sans border-l border-gray-100 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-900 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500 rounded-2xl"><MessageSquare size={20}/></div>
                    <div>
                        <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                            Order Chat #{order?.id} 
                            <span className="opacity-40 ml-2 border-l border-white/20 pl-2">
                                {role === 'delivery' ? (order?.customer_name || 'Customer') : (order?.rider_name || 'Rider')}
                            </span>
                        </h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-200 mt-1">Status: SECURE CHANNEL • {context}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
            </header>

            {/* Context Switcher (Only for Rider/Admin) */}
            <div className="p-4 bg-gray-50 flex gap-2 border-b border-gray-100">
                {['ORDER', 'WAREHOUSE', 'SUPPORT'].map(ctx => (
                    <button 
                        key={ctx}
                        onClick={() => setContext(ctx)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${context === ctx ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white text-gray-400 border border-gray-100'}`}
                    >
                        {ctx}
                    </button>
                ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <ShieldAlert size={48} className="mb-4 text-gray-300"/>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Secure {context} Channel Established<br/>Communication is logged for safety</p>
                    </div>
                )}
                
                {messages.map((msg, i) => {
                    const isMe = msg.sender_role === role; 
                    return (
                        <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4 flex items-center gap-1">
                                    <User size={8}/> {msg.sender_name || msg.sender_role}
                                </span>
                            )}
                            <div className={`max-w-[80%] rounded-[24px] p-5 shadow-sm relative ${isMe ? 'bg-red-500 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'}`}>
                                <p className="text-sm font-bold leading-relaxed">{msg.message}</p>
                                <span className={`text-[8px] font-black uppercase tracking-widest mt-2 block opacity-60 ${isMe ? 'text-red-100 text-right' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Quick Actions */}
            {quickActions[context] && (
                <div className="p-4 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                    {quickActions[context].map((act, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSend(act.msg)}
                            className="whitespace-nowrap px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100">
                <div className="flex items-center gap-4 bg-gray-50 rounded-[28px] p-2 pl-4 border border-gray-100 group focus-within:border-red-500/30 transition-all">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type mission update..."
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-gray-300 placeholder:uppercase placeholder:text-[10px]"
                    />
                    <button onClick={() => handleSend()} className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-90 transition-all"><Send size={18}/></button>
                </div>
            </div>
        </div>
    );
};

export default OrderChat;
