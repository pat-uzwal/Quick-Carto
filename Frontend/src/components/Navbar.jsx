import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingCart, ChevronDown, User, Store, MapPin } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import LocationModal from './LocationModal';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, detectedLocation } = useSelector((state) => state.auth);
    const { totalItems, totalAmount } = useSelector((state) => state.cart);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    // Safely get user's first name, or fallback to 'Account'
    const displayName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Account';

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-black/5 h-[72px] flex items-center">
            {/* 1. INCREASED PAGE SIZE - 1600PX WIDE */}
            <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 flex items-center justify-between gap-12 md:gap-24">

                {/* LOGO & LOCATION */}
                <div className="flex items-center gap-12 shrink-0">
                    <Link to="/" className="flex items-center gap-3 group">
                         <div className="w-12 h-12 bg-[#e62020] rounded-[12px] flex items-center justify-center text-white shadow-xl shadow-[rgba(230,32,32,0.25)] group-hover:scale-110 transition-transform">
                            <Store size={26} strokeWidth={2.5} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[26px] font-[900] text-black tracking-tighter uppercase leading-none">QuickCarto</span>
                         </div>
                    </Link>

                     {/* Red Location Selector */}
                    <div 
                        onClick={() => setIsLocationModalOpen(true)}
                        className="hidden lg:flex flex-col border-l-2 border-[#e62020]/10 pl-10 cursor-pointer group hover:opacity-70 transition-all"
                    >
                         <div className="flex items-center gap-1 text-[#e62020]">
                            <span className="text-[13px] font-black uppercase tracking-tight">In 10 minutes</span>
                         </div>
                         <div className="flex items-center gap-1 text-black mt-1">
                            <span className="text-[14px] font-bold truncate max-w-[200px] leading-none">
                                {user?.current_location || detectedLocation || 'Detecting Area...'}
                            </span>
                            <ChevronDown size={14} className="opacity-40 group-hover:translate-y-0.5 transition-transform" />
                         </div>
                    </div>
                </div>

                {/* 2. CENTERED SEARCH BAR */}
                <div className="flex-1 max-w-4xl hidden md:block">
                    <form onSubmit={handleSearch} className="relative group/search">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search size={22} className="text-gray-400 transition-colors opacity-60" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-14 pr-10 py-4 bg-[#f8f9fa] border border-black/5 rounded-[16px] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] focus:bg-white transition-all text-[15px] font-bold text-gray-900 placeholder:text-gray-400"
                            placeholder='Search bread, milk, snacks or drinks...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* 3. ACTIONS - MY BASKET REBRAND */}
                <div className="flex items-center gap-8 md:gap-12 shrink-0">
                    <div className="hidden sm:block">
                        {user ? (
                            <div className="group relative cursor-pointer py-4">
                                <div className="flex items-center gap-3 text-[14px] font-black text-gray-800 group-hover:text-[#e62020] transition-all uppercase tracking-tight min-w-[100px] justify-center">
                                    <User size={20} />
                                    <span className="truncate max-w-[100px]">{displayName}</span>
                                    <ChevronDown size={14} className="opacity-40" />
                                </div>
                                {/* Invisible Bridge Container to prevent hover loss */}
                                <div className="absolute hidden group-hover:block top-full right-0 pt-2 z-50">
                                    <div className="w-64 bg-white rounded-[16px] shadow-2xl shadow-black/10 border border-gray-100 py-6 animate-in slide-in-from-top-2 duration-200 text-gray-800">
                                        <Link to="/profile" className="block px-8 py-3 text-[12px] font-black hover:text-[#e62020] transition-colors uppercase tracking-widest">My Account</Link>
                                        <Link to="/orders" className="block px-8 py-3 text-[12px] font-black hover:text-[#e62020] transition-colors uppercase tracking-widest">Orders Basket</Link>
                                        <div className="h-px bg-gray-100 my-4 mx-10"></div>
                                        <button onClick={handleLogout} className="w-full text-left px-8 py-3 text-[12px] font-black text-[#e62020] hover:bg-red-50 transition-all uppercase tracking-widest">Logout</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="text-[14px] font-black text-gray-800 hover:text-[#e62020] transition-all uppercase tracking-widest">
                                 Login
                            </Link>
                        )}
                    </div>

                    {/* My Basket RED Button */}
                    <button
                        onClick={() => navigate('/cart')}
                        className="bg-[#e62020] text-white px-8 h-14 rounded-[14px] shadow-xl shadow-[rgba(230,32,32,0.25)] hover:scale-105 hover:bg-[#cc1b1b] active:scale-95 transition-all flex items-center justify-center gap-4 font-black text-[15px] uppercase tracking-tight"
                    >
                         <ShoppingCart size={24} className="fill-white" />
                         <div className="flex flex-col items-start leading-none gap-0.5">
                             <span className="text-[10px] opacity-80 uppercase tracking-widest leading-none">My Basket</span>
                             {totalAmount > 0 && (
                                <span className="text-[14px] font-black leading-none mt-1">रू {totalAmount}</span>
                             )}
                         </div>
                    </button>
                </div>
            </div>
            <LocationModal 
                isOpen={isLocationModalOpen} 
                onClose={() => setIsLocationModalOpen(false)} 
            />
        </nav>
    );
};

export default Navbar;
