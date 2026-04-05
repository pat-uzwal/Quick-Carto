import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, LogOut, ChevronRight, Zap, History, Settings, Truck } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useState } from 'react';

const DeliverySidebar = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const [isExpanded, setIsExpanded] = useState(false);

    const navItems = [
        { name: 'Active', path: '/delivery', icon: <Zap size={22} /> },
        { name: 'Earnings', path: '/delivery/earnings', icon: <Truck size={22} /> },
        { name: 'History', path: '/delivery/completed', icon: <History size={22} /> },
        { name: 'Settings', path: '/delivery/settings', icon: <Settings size={22} /> },
    ];

    return (
        <aside 
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`${isExpanded ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-[100] transition-all duration-500 ease-in-out shadow-2xl shadow-gray-200/50 overflow-hidden`}
        >
            {/* Minimal Logo */}
            <div className="h-[88px] flex items-center px-6 border-b border-gray-50 bg-gray-50/30">
                <div className="w-8 h-8 bg-[#FF3B30] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                    <Truck size={18} className="text-white" strokeWidth={2.5} />
                </div>
                {isExpanded && (
                    <div className="ml-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <h2 className="text-lg font-black text-gray-900 tracking-tighter uppercase leading-none">Rider</h2>
                        <span className="text-[9px] text-[#FF3B30] font-black uppercase tracking-widest mt-1 block">Pro Suite</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center h-12 rounded-2xl transition-all group relative ${isActive
                                    ? 'bg-[#FF3B30] text-white shadow-xl shadow-red-500/25'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                {item.icon}
                            </div>
                            {isExpanded && (
                                <span className="ml-2 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                                    {item.name}
                                </span>
                            )}
                            {isActive && !isExpanded && (
                                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                <button
                    onClick={() => dispatch(logout())}
                    className="flex items-center h-12 w-full text-gray-400 hover:text-[#FF3B30] hover:bg-red-50 rounded-2xl transition-all group"
                >
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    {isExpanded && (
                        <span className="ml-2 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                            Exit
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default DeliverySidebar;
