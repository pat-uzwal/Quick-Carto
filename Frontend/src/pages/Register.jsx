import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../features/auth/authSlice';
import { User as UserIcon, Mail, Lock, CheckCircle2, ChevronRight, Store, Truck, ShoppingCart, UserCheck, Phone } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        role: 'user' // Default role
    });
    const [passwordError, setPasswordError] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'warehouse') navigate('/warehouse');
            else if (user.role === 'delivery') navigate('/delivery');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
            setPasswordError('');
        }
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        const { confirmPassword, name, ...registerData } = formData;
        const finalData = {
            ...registerData,
            full_name: name
        };
        try {
            await dispatch(register(finalData)).unwrap();
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            // Error managed by redux
        }
    };

    const roles = [
        { id: 'user', name: 'Customer', icon: <ShoppingCart size={18} />, description: 'Order groceries' },
        { id: 'delivery', name: 'Rider', icon: <Truck size={18} />, description: 'Deliver orders' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-white shadow-xl shadow-gray-200/50 rounded-3xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#e62020]">
                            <UserCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join QuickCarto</h2>
                        <p className="text-gray-500 mt-2 font-medium">Create your professional account today</p>
                    </div>

                    {(error || passwordError) && (
                        <div className="bg-error/10 text-error p-4 rounded-2xl mb-6 text-sm flex items-center gap-3 border border-error/20">
                            <div className="w-2 h-2 rounded-full bg-error animate-pulse shrink-0"></div>
                            {passwordError || error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                                Choose Your Role
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => handleRoleSelect(r.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                                            formData.role === r.id
                                                ? 'bg-[#e62020] border-[#e62020] text-white shadow-lg shadow-[rgba(230,32,32,0.25)] scale-[1.02]'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#e62020]/50'
                                        }`}
                                    >
                                        <div className="mb-1.5">{r.icon}</div>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{r.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors italic" size={18} />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] hover:border-gray-300 transition-all font-medium text-gray-900"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={18} />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] hover:border-gray-300 transition-all font-medium text-gray-900"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={18} />
                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    type="tel"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] hover:border-gray-300 transition-all font-medium text-gray-900"
                                    placeholder="Phone Number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={18} />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] hover:border-gray-300 transition-all font-medium text-gray-900"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e62020] transition-colors" size={18} />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        minLength="6"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#e62020] hover:border-gray-300 transition-all font-medium text-gray-900"
                                        placeholder="Confirm"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 px-2">
                            <div className="mt-1 shrink-0">
                                <CheckCircle2 size={16} className="text-green-500" />
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                By creating an account, you agree to our <span className="text-[#e62020] font-bold cursor-pointer underline underline-offset-2 hover:text-[#cc1b1b]">Terms of Service</span> and <span className="text-[#e62020] font-bold cursor-pointer underline underline-offset-2 hover:text-[#cc1b1b]">Privacy Policy</span>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#e62020] hover:bg-[#cc1b1b] text-white font-black py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:shadow-[rgba(230,32,32,0.25)] flex justify-center items-center gap-2 group active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 font-medium">
                            Already part of the team?{' '}
                            <Link to="/login" className="text-[#e62020] hover:text-[#cc1b1b] font-black transition-colors underline underline-offset-4 decoration-[#e62020]/30 hover:decoration-[#e62020]">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
