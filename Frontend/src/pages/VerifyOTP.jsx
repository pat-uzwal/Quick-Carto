import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyOtp, clearError, requestOtp } from '../features/auth/authSlice';
import { ShieldCheck, Mail, ChevronRight, RotateCw, Fingerprint } from 'lucide-react';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, user } = useSelector((state) => state.auth);
    const email = location.state?.email || '';

    useEffect(() => {
        dispatch(clearError());
        if (!email && !user) {
            navigate('/register');
        }
    }, [dispatch, email, navigate, user]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(timer - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'warehouse') navigate('/warehouse');
            else if (user.role === 'delivery') navigate('/delivery');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(verifyOtp({ email, otp })).unwrap();
        } catch (err) {
            // Error managed by redux
        }
    };

    const handleResend = () => {
        if (timer === 0) {
            dispatch(requestOtp(email));
            setTimer(60);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="bg-surface shadow-2xl shadow-primary/5 rounded-3xl p-8 border border-border/50">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary relative">
                            <Fingerprint size={40} className="animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full border-4 border-surface flex items-center justify-center shadow-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-text-primary tracking-tight">Security Check</h2>
                        <p className="text-text-secondary mt-3 font-medium px-4">
                            We've sent a 6-digit authentication code to <span className="text-primary font-bold break-all">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-error/10 text-error p-4 rounded-2xl mb-8 text-sm flex items-center gap-3 border border-error/20">
                            <div className="w-2 h-2 rounded-full bg-error shrink-0"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="flex justify-center gap-2">
                            <div className="relative w-full max-w-[280px]">
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength="6"
                                    className="w-full px-6 py-5 bg-bg/50 border-2 border-border/50 rounded-3xl focus:outline-none focus:border-primary transition-all text-center tracking-[0.8em] text-3xl font-black text-text-primary placeholder:text-border/40 placeholder:tracking-normal placeholder:font-bold"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex justify-center items-center gap-2 group active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Confirm Identity</span>
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="text-center group">
                                <button
                                    type="button"
                                    disabled={timer > 0}
                                    onClick={handleResend}
                                    className={`text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors ${
                                        timer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-primary hover:text-primary-hover'
                                    }`}
                                >
                                    <RotateCw size={14} className={timer === 0 ? 'group-hover:rotate-180 transition-transform duration-500' : ''} />
                                    {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-12 text-center pt-8 border-t border-border/30">
                        <div className="flex items-center justify-center gap-2 text-text-secondary text-xs font-semibold">
                            <ShieldCheck size={14} className="text-success" />
                            <span>Encrypted SSL Verification</span>
                        </div>
                        <Link to="/register" className="mt-4 inline-block text-[11px] font-black text-text-muted hover:text-primary uppercase tracking-widest transition-colors">
                            Change Email Address
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
