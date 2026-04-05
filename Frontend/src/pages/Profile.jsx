import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import api from '../services/api';

const Profile = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: user?.full_name || '', phone_number: user?.phone_number || '' });

    useEffect(() => {
        if (activeTab === 'addresses') {
            fetchAddresses();
        }
    }, [activeTab]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/addresses/');
            setAddresses(res.data);
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            // Replace with actual profile endpoint
            // const res = await api.patch(`/users/${user.id}/`, editForm);
            // For now, let's assume successful API or local update.
            const updatedUser = { ...user, ...editForm };
            dispatch({ type: 'auth/updateProfile', payload: updatedUser });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Failed to update profile details");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
        { id: 'orders', label: 'My Orders', icon: <ShoppingBag size={20} />, external: true, link: '/orders' },
        { id: 'addresses', label: 'Delivery Addresses', icon: <MapPin size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="pt-[100px] min-h-screen bg-[#f8f9fa] pb-24">
            <div className="max-w-[1200px] mx-auto px-6 md:px-12">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">MY ACCOUNT</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-80 shrink-0">
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                            {/* User Header */}
                            <div className="p-6 bg-red-50/50 border-b border-gray-100 flex items-center gap-4">
                                <div className="w-14 h-14 bg-[#e62020] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
                                    <User size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-gray-900 leading-none">
                                        {user?.full_name || user?.username || 'User'}
                                    </h3>
                                    <p className="text-sm font-semibold text-gray-500 mt-1">
                                        {user?.phone_number || 'No phone added'}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="p-4 flex flex-col gap-1">
                                {tabs.map((tab) => (
                                    tab.external ? (
                                        <Link 
                                            key={tab.id}
                                            to={tab.link}
                                            className="flex items-center gap-4 px-4 py-3.5 rounded-[12px] text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="text-gray-400">{tab.icon}</span>
                                            {tab.label}
                                        </Link>
                                    ) : (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-[12px] font-bold transition-all ${
                                                activeTab === tab.id 
                                                    ? 'bg-red-50 text-[#e62020]' 
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={activeTab === tab.id ? 'text-[#e62020]' : 'text-gray-400'}>
                                                {tab.icon}
                                            </span>
                                            {tab.label}
                                        </button>
                                    )
                                ))}
                                
                                <div className="h-px bg-gray-100 my-2 mx-4"></div>
                                
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-4 px-4 py-3.5 rounded-[12px] text-red-600 font-bold hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 min-h-[500px]">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in duration-300">
                                    <h2 className="text-2xl font-black mb-6">Profile Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editForm.full_name} 
                                                    onChange={e => setEditForm({...editForm, full_name: e.target.value})} 
                                                    className="w-full p-4 bg-white rounded-[16px] font-bold border-2 border-gray-200 outline-none focus:border-[#e62020] transition-colors" 
                                                />
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-[16px] font-bold border border-gray-100">
                                                    {user?.full_name || 'Not set'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                            <div className="p-4 bg-gray-50 rounded-[16px] font-bold border border-gray-100 flex items-center justify-between">
                                                <span>{user?.email}</span>
                                                <CheckCircle2 size={18} className="text-green-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editForm.phone_number} 
                                                    onChange={e => setEditForm({...editForm, phone_number: e.target.value})} 
                                                    className="w-full p-4 bg-white rounded-[16px] font-bold border-2 border-gray-200 outline-none focus:border-[#e62020] transition-colors" 
                                                />
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-[16px] font-bold border border-gray-100">
                                                    {user?.phone_number || 'Not set'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account Role</label>
                                            <div className="p-4 bg-gray-50 rounded-[16px] font-bold border border-gray-100 capitalize">
                                                {user?.role === 'user' ? 'Customer' : user?.role || 'User'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex gap-4">
                                        {isEditing ? (
                                            <>
                                                <button onClick={handleSaveProfile} disabled={loading} className="bg-[#e62020] text-white px-8 py-3 rounded-[12px] font-black tracking-widest uppercase text-sm hover:bg-red-700 transition-colors">
                                                    {loading ? 'Saving...' : 'Save Settings'}
                                                </button>
                                                <button onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-[12px] font-black tracking-widest uppercase text-sm hover:bg-gray-200 transition-colors">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="bg-black text-white px-8 py-3 rounded-[12px] font-black tracking-widest uppercase text-sm hover:bg-gray-800 transition-colors">
                                                Edit Details
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {activeTab === 'addresses' && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-black">Delivery Addresses</h2>
                                        <button onClick={() => alert("Add delivery address feature coming soon!")} className="text-[#e62020] font-black text-sm uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-[8px] transition-colors">
                                            + Add New
                                        </button>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-[16px] border border-dashed border-gray-200">
                                            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                                            <h3 className="text-lg font-black text-gray-900 mb-2">No addresses saved</h3>
                                            <p className="text-gray-500 font-medium">Add a delivery address to checkout faster.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {addresses.map((addr) => (
                                                <div key={addr.id} className="border border-gray-200 rounded-[16px] p-5 relative group hover:border-[#e62020] transition-colors">
                                                    {addr.is_default && (
                                                        <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-[6px] tracking-widest">
                                                            Default
                                                        </span>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="text-[#e62020] mt-1" size={20} />
                                                        <div>
                                                            <p className="font-bold text-gray-900 leading-relaxed">
                                                                {addr.street}<br/>
                                                                {addr.city}, {addr.state} {addr.zip_code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className="animate-in fade-in duration-300">
                                    <h2 className="text-2xl font-black mb-6">Preferences</h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-[16px]">
                                            <div>
                                                <h4 className="font-bold text-gray-900">Email Notifications</h4>
                                                <p className="text-sm text-gray-500 font-medium mt-1">Receive order updates and offers</p>
                                            </div>
                                            <div 
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${emailNotifications ? 'bg-[#e62020]' : 'bg-gray-200'}`}
                                                onClick={() => setEmailNotifications(!emailNotifications)}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotifications ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
