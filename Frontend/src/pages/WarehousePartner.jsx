import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WarehousePartner = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        city: '',
        state: '',
        password: ''
    });
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/api/users/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.fullName,
                    email: formData.email,
                    phone_number: formData.phoneNumber,
                    password: formData.password,
                    role: 'warehouse'
                })
            });
            if (res.ok) {
                setStatus('Registration successful! Redirecting to OTP verification...');
                setTimeout(() => navigate('/verify-otp', { state: { email: formData.email } }), 2000);
            } else {
                setStatus('Registration failed. Please check your provided details.');
            }
        } catch (err) {
            console.error(err);
            setStatus('An error occurred.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e62020] via-[#c61010] to-[#7a0606] flex flex-col pt-24 pb-12">
            <div className="max-w-[1200px] mx-auto w-full px-6 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row items-center justify-between mt-10 flex-1">
                    
                    {/* Left Side Graphics & Text */}
                    <div className="text-white max-w-lg mb-10 md:mb-0">
                        {/* Placeholder graphic, you can replace this with an actual image if desired */}
                        <div className="mb-12 h-[300px] w-full flex items-end relative opacity-90">
                             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center mix-blend-overlay rounded-3xl" />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">Warehouse partner</h1>
                        <p className="text-lg opacity-90 tracking-wide">Pick, pack and sort orders placed by our customers</p>
                    </div>

                    {/* Right Side Form Card */}
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Come bring orders to life</h2>
                        <p className="text-gray-500 mb-8 font-medium">Earn more with a job in our warehouse</p>

                        {status && (
                            <div className="mb-6 p-3 rounded-lg text-sm font-bold bg-gray-100 text-gray-800">
                                {status}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input 
                                        type="text" 
                                        name="fullName" 
                                        value={formData.fullName} 
                                        onChange={handleChange} 
                                        placeholder="your full name*" 
                                        required 
                                        className="w-full bg-gray-100/80 border border-transparent focus:border-gray-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400" 
                                    />
                                </div>
                                <div>
                                    <input 
                                        type="tel" 
                                        name="phoneNumber" 
                                        value={formData.phoneNumber} 
                                        onChange={handleChange} 
                                        placeholder="phone number*" 
                                        required 
                                        className="w-full bg-gray-100/80 border border-transparent focus:border-gray-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400" 
                                    />
                                </div>
                            </div>
                            <div>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="email address*" 
                                    required 
                                    className="w-full bg-gray-100/80 border border-transparent focus:border-red-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400" 
                                />
                            </div>

                            <div>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="set password*" 
                                    required 
                                    className="w-full bg-gray-100/80 border border-transparent focus:border-red-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <select 
                                        name="city" 
                                        value={formData.city} 
                                        onChange={handleChange} 
                                        required 
                                        className="w-full bg-gray-100/80 border border-transparent focus:border-gray-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all appearance-none text-gray-500 cursor-pointer"
                                    >
                                        <option value="" disabled>city*</option>
                                        <option value="Kathmandu">Kathmandu</option>
                                        <option value="Lalitpur">Lalitpur</option>
                                        <option value="Bhaktapur">Bhaktapur</option>
                                        <option value="Pokhara">Pokhara</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={formData.state} 
                                        onChange={handleChange} 
                                        placeholder="state*" 
                                        required 
                                        className="w-full bg-gray-100/80 border border-transparent focus:border-gray-300 focus:bg-white rounded-md px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400" 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-[#1c1c1c] hover:bg-black text-white font-bold py-3.5 rounded-md transition-all mt-4"
                            >
                                register
                            </button>
                        </form>
                    </div>

                </div>

                <div className="mt-20 bg-white rounded-xl p-10 max-w-4xl opacity-95">
                    <h2 className="text-2xl font-medium text-gray-900 mb-4">Join Nepal's most loved grocery shopping platform</h2>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        Become a warehouse manager and get best-in-class pay, plus benefits like nutritious meals, transportation facility, provident fund - in addition to salary and medical insurance coverage.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WarehousePartner;
