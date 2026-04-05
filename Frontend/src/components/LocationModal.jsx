import { X, MapPin, Navigation, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setDetectedLocation, updateProfile } from '../features/auth/authSlice';

const NEPAL_LOCATIONS = [
    { name: 'Bagbazaar, Kathmandu', lat: 27.7052, lng: 85.3193 },
    { name: 'Putalisadak, Kathmandu', lat: 27.7042, lng: 85.3213 },
    { name: 'Thamel, Kathmandu', lat: 27.7149, lng: 85.3123 },
    { name: 'Jawalakhel, Lalitpur', lat: 27.6744, lng: 85.3142 },
    { name: 'Patan Durbar Square, Lalitpur', lat: 27.6738, lng: 85.3252 },
    { name: 'Bhaktapur Durbar Square', lat: 27.6722, lng: 85.4292 },
    { name: 'Koteshwor, Kathmandu', lat: 27.6757, lng: 85.3468 },
    { name: 'Baneshwor, Kathmandu', lat: 27.6913, lng: 85.3331 },
];

const LocationModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { user, accessToken } = useSelector((state) => state.auth);

    if (!isOpen) return null;

    const handleLocationSelect = async (loc) => {
        // 1. Update Global State
        dispatch(setDetectedLocation(loc.name));

        // 2. If logged in, sync with backend
        if (user && accessToken) {
            try {
                await fetch('http://localhost:8000/api/users/update_location/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        latitude: loc.lat,
                        longitude: loc.lng,
                        location_name: loc.name
                    })
                });
                
                dispatch(updateProfile({ 
                    current_location: loc.name, 
                    latitude: loc.lat, 
                    longitude: loc.lng,
                    location_synced: true 
                }));
            } catch (err) {
                console.error("Backend Location Sync Failed:", err);
            }
        }
        
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Select Area</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                        <X size={24} className="group-active:scale-90 transition-transform" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Search Mockup */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search area (e.g. Bagbazaar)"
                            className="w-full bg-gray-50 border border-black/5 rounded-[16px] pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#e62020]">
                            <Navigation size={14} className="fill-[#e62020]" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Available Hubs</span>
                        </div>

                        <div className="grid gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {NEPAL_LOCATIONS.map((loc, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleLocationSelect(loc)}
                                    className="flex items-center gap-4 p-4 rounded-[18px] hover:bg-red-50 group transition-all text-left border border-transparent hover:border-red-500/20 active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-[12px] bg-gray-100 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-red-600">
                                        {loc.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-gray-50 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Precision Logistics by QuickCarto 🇳🇵
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
