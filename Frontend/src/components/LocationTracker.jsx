import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, setDetectedLocation } from '../features/auth/authSlice';

const LocationTracker = () => {
    const dispatch = useDispatch();
    const { user, accessToken, detectedLocation } = useSelector((state) => state.auth);

    useEffect(() => {
        // Skip if already tracked accurately in this session (unless user changed)
        if (user?.current_location && user?.location_synced) return;
        if (!user && detectedLocation) return;

        const updateLocation = async (lat, lng) => {
            try {
                // Reverse geocoding using Nominatim (OpenStreetMap)
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const geoData = await geoRes.json();
                
                // Detailed check for Kathmandu neighborhoods
                const locationName = geoData.address.suburb || 
                                   geoData.address.neighbourhood || 
                                   geoData.address.village || 
                                   geoData.address.city_district ||
                                   geoData.address.city || 
                                   "Bagbazaar";

                // 1. ALWAYS update the global detectedLocation for immediate UI flip
                dispatch(setDetectedLocation(locationName));

                // 2. If logged in, sync with backend
                if (user && accessToken) {
                    await fetch('http://localhost:8000/api/users/update_location/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            latitude: lat,
                            longitude: lng,
                            location_name: locationName
                        })
                    });
                    
                    dispatch(updateProfile({ 
                        current_location: locationName, 
                        latitude: lat, 
                        longitude: lng,
                        location_synced: true 
                    }));
                }
                
                console.log(`📍 HUB STATUS: User area verified as ${locationName}`);
            } catch (err) {
                console.error("Location Node Error:", err);
                // Fallback to Bagbazaar on error
                dispatch(setDetectedLocation("Bagbazaar"));
            }
        };

        const detect = () => {
             if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        updateLocation(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.warn("GPS Access Denied. Simulating Bagbazaar Protocol.");
                        updateLocation(27.7052, 85.3193); 
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } else {
                 console.warn("Terminal lacks GPS hardware. Simulating Bagbazaar Protocol.");
                 updateLocation(27.7052, 85.3193);
            }
        };

        detect();

    }, [user, accessToken, dispatch, detectedLocation]);

    return null;
};

export default LocationTracker;
