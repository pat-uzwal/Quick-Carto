import { Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, Truck, LogOut, ChevronRight, Boxes, History, Settings, Shield, Activity, Store, Users, Map, BarChart2, Bell, RefreshCw, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const WarehouseSidebar = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const navItems = [
        { name: 'Dashboard', path: '/warehouse', icon: <Activity size={20} /> },
        { name: 'Orders', path: '/warehouse/orders', icon: <ClipboardList size={20} /> },
        { name: 'Inventory', path: '/warehouse/inventory', icon: <Package size={20} /> },
        { name: 'Dispatch', path: '/warehouse/dispatch', icon: <Truck size={20} /> },
        { name: 'Customers', path: '/warehouse/users', icon: <User size={20} /> },
        { name: 'Reports', path: '/warehouse/analytics', icon: <BarChart2 size={20} /> },
        { name: 'Alerts', path: '/warehouse/alerts', icon: <Bell size={20} /> },
    ];

    return (
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl shadow-gray-200/50 print:hidden">
            {/* Branding Section */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#e62020] shadow-xl shadow-gray-200/50">
                        <Store size={26} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">QuickCarto</span>
                        <span className="text-[10px] font-black text-[#e62020] uppercase tracking-widest mt-1">Warehouse Ops</span>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Access Level</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tighter truncate">{user?.assigned_warehouse_name ? `${user.assigned_warehouse_name} MANAGER` : 'HUB MANAGER'}</span>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 p-8 space-y-2 overflow-y-auto">
                <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 tracking-[0.2em]">Operations Hub</p>
                {navItems.map((item) => {
                    // Match the exact base path or exactly the route so the overview doesn't highlight when in /orders
                    const isActive = location.pathname === item.path || (item.path !== '/warehouse' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center justify-between px-5 py-4 rounded-[20px] transition-all group active:scale-[0.98] ${isActive
                                    ? 'bg-[#e62020] text-white shadow-2xl shadow-[rgba(230,32,32,0.35)] scale-[1.02]'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`transition-all ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#e62020] group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                <span className="text-[13px] font-black uppercase tracking-tight">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight size={14} strokeWidth={3} className="animate-pulse" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Action Section */}
            <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                <button
                    onClick={() => dispatch(logout())}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-gray-100 text-gray-400 hover:text-[#e62020] hover:border-[#e62020] hover:shadow-xl hover:shadow-red-500/10 rounded-[20px] transition-all text-[13px] font-black uppercase tracking-widest active:scale-95 group"
                >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform rotate-180" />
                    Exit Terminal
                </button>
            </div>
        </aside>
    );
};

export default WarehouseSidebar;
