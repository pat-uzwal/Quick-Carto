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
            <div className="w-full px-4 md:px-8 flex items-center justify-between gap-4">

                {/* LOGO & LOCATION */}
                <div className="flex items-center gap-4 md:gap-6 shrink-0">
                    <Link to="/" className="flex items-center group">
                        <span className="text-2xl md:text-3xl font-[1000] text-[#E62020] tracking-tighter uppercase italic leading-none">QuickCarto</span>
                    </Link>

                    {/* Location Selector */}
                    <div
                        onClick={() => setIsLocationModalOpen(true)}
                        className="hidden lg:flex flex-col border-l-2 border-[#e62020]/10 pl-6 cursor-pointer group hover:opacity-70 transition-all"
                    >
                        <div className="flex items-center gap-1 text-[#e62020]">
                            <span className="text-[12px] font-black uppercase tracking-tight">In 10 minutes</span>
                        </div>
                        <div className="flex items-center gap-1 text-black mt-0.5">
                            <span className="text-[13px] font-bold truncate max-w-[160px] leading-none">
                                {user?.current_location || detectedLocation || 'Detecting Area...'}
                            </span>
                            <ChevronDown size={13} className="opacity-40 group-hover:translate-y-0.5 transition-transform shrink-0" />
                        </div>
                    </div>
                </div>

                {/* SEARCH BAR - grows to fill space */}
                <div className="flex-1 min-w-0 max-w-3xl hidden md:block mx-4">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400 opacity-60" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-6 py-3 bg-[#f8f9fa] border border-black/5 rounded-[14px] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] focus:bg-white transition-all text-[14px] font-bold text-gray-900 placeholder:text-gray-400"
                            placeholder="Search bread, milk, snacks or drinks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* User menu */}
                    <div className="hidden sm:block">
                        {user ? (
                            <div className="group relative cursor-pointer py-5">
                                <div className="flex items-center gap-2 text-[13px] font-black text-gray-800 group-hover:text-[#e62020] transition-all uppercase tracking-tight">
                                    <User size={18} />
                                    <span className="max-w-[70px] truncate">{displayName}</span>
                                    <ChevronDown size={13} className="opacity-40" />
                                </div>
                                {/* Dropdown */}
                                <div className="absolute hidden group-hover:block top-full right-0 pt-1 z-50">
                                    <div className="w-52 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 py-5 text-gray-800">
                                        <Link to="/profile" className="block px-6 py-2.5 text-[11px] font-black hover:text-[#e62020] transition-colors uppercase tracking-widest">My Account</Link>
                                        <Link to="/orders" className="block px-6 py-2.5 text-[11px] font-black hover:text-[#e62020] transition-colors uppercase tracking-widest">My Orders</Link>
                                        <div className="h-px bg-gray-100 my-3 mx-6" />
                                        <button onClick={handleLogout} className="w-full text-left px-6 py-2.5 text-[11px] font-black text-[#e62020] hover:bg-red-50 transition-all uppercase tracking-widest">Logout</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="text-[13px] font-black text-gray-800 hover:text-[#e62020] transition-all uppercase tracking-widest">
                                Login
                            </Link>
                        )}
                    </div>

                    {/* MY BASKET button */}
                    <button
                        onClick={() => navigate('/cart')}
                        className="bg-[#e62020] text-white px-5 h-11 rounded-[12px] shadow-lg shadow-[rgba(230,32,32,0.25)] hover:bg-[#cc1b1b] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-black text-[12px] uppercase tracking-tight whitespace-nowrap"
                    >
                        <ShoppingCart size={18} className="fill-white shrink-0" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[9px] opacity-80 uppercase tracking-widest">My Basket</span>
                            {totalAmount > 0 && (
                                <span className="text-[12px] font-black mt-0.5">रू {totalAmount}</span>
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
