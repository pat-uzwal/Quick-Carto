import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, ShoppingBag, List, BarChart3, LogOut, 
    ChevronRight, Settings, ShieldCheck, Package, Warehouse, ClipboardList 
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const AdminSidebar = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Products', path: '/admin/products', icon: <ShoppingBag size={20} /> },
        { name: 'Inventory', path: '/admin/inventory', icon: <Package size={20} /> },
        { name: 'Warehouses', path: '/admin/warehouses', icon: <Warehouse size={20} /> },
        { name: 'Categories', path: '/admin/categories', icon: <List size={20} /> },
        { name: 'Orders', path: '/admin/orders', icon: <ClipboardList size={20} /> },
        { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Reports', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
    ];

    return (
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-2xl shadow-gray-200/20">
            {/* Branding Section */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#e62020] shadow-xl shadow-gray-200/50">
                        <ShieldCheck size={26} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">QuickCarto</span>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Access Level</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">System Administrator</span>
                    </div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Management</p>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-[#e62020] text-white shadow-xl shadow-[rgba(230,32,32,0.3)] scale-[1.02]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-gray-400 group-hover:text-[#e62020]'}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
                            </div>
                            {isActive && <ChevronRight size={16} strokeWidth={3} className="animate-in slide-in-from-left-2 duration-300 text-white/50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex flex-col gap-3">
                    <Link to="/admin/settings" className="flex items-center gap-4 w-full px-5 py-4 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 shadow-sm rounded-2xl transition-all text-sm font-bold group">
                        <Settings size={20} className="text-gray-400 group-hover:rotate-45 transition-transform group-hover:text-gray-900" />
                        Platform Settings
                    </Link>
                    <button
                        onClick={() => dispatch(logout())}
                        className="flex items-center gap-4 w-full px-5 py-4 text-[#e62020] hover:bg-red-50 hover:border-red-100 border border-transparent rounded-2xl transition-all text-sm font-black active:scale-95 group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
                        Terminate Session
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
