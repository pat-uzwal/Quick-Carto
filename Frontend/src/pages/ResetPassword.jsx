import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword, clearError } from '../features/auth/authSlice';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        otp: '',
        new_password: '',
        confirm_password: ''
    });
    const [isReset, setIsReset] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error } = useSelector((state) => state.auth);
    const email = location.state?.email || '';

    useEffect(() => {
        dispatch(clearError());
        if (!email) {
            navigate('/forgot-password');
        }
    }, [dispatch, email, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'confirm_password' || e.target.name === 'new_password') {
            setPwdError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            setPwdError("Passwords do not match");
            return;
        }

        try {
            await dispatch(resetPassword({
                email,
                otp: formData.otp,
                new_password: formData.new_password
            })).unwrap();
            setIsReset(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            // Error handled by redux
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
            <div className="max-w-md w-full bg-surface shadow rounded-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-text-main">Reset Password</h2>
                    <p className="text-text-muted mt-2">Enter the OTP sent to <b>{email}</b> and set a new password</p>
                </div>

                {(error || pwdError) && (
                    <div className="bg-error/10 text-error p-3 rounded-md mb-4 text-sm text-center">
                        {pwdError || error}
                    </div>
                )}

                {isReset ? (
                    <div className="bg-success/10 text-success p-4 rounded-md text-center">
                        <p className="font-medium">Password Reset Successfully!</p>
                        <p className="text-sm mt-1">Redirecting you to login page...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1" htmlFor="otp">
                                6-Digit OTP
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                maxLength="6"
                                className="w-full px-4 py-2 border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center tracking-widest text-lg font-bold"
                                placeholder="123456"
                                value={formData.otp}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1" htmlFor="new_password">
                                New Password
                            </label>
                            <input
                                id="new_password"
                                name="new_password"
                                type="password"
                                required
                                minLength="8"
                                className="w-full px-4 py-2 border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="••••••••"
                                value={formData.new_password}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1" htmlFor="confirm_password">
                                Confirm Password
                            </label>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                className="w-full px-4 py-2 border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="••••••••"
                                value={formData.confirm_password}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.otp.length !== 6}
                            className="w-full bg-primary hover:bg-primary-hover text-text-main font-semibold py-2 px-4 rounded-md transition duration-200 mt-4 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-text-main" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Reset Password"}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-text-muted">
                    Back to{' '}
                    <Link to="/login" className="text-secondary hover:text-secondary-hover font-medium">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
