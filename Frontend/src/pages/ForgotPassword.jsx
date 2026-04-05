import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { requestOtp, clearError } from '../features/auth/authSlice';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(requestOtp(email)).unwrap();
            setIsSubmitted(true);
            // Optionally redirect after a few seconds or show a message
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);
        } catch (err) {
            // Error handled by redux
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
            <div className="max-w-md w-full bg-surface shadow rounded-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-text-main">Forgot Password</h2>
                    <p className="text-text-muted mt-2">Enter your email to receive a password reset OTP</p>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-3 rounded-md mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {isSubmitted ? (
                    <div className="bg-success/10 text-success p-4 rounded-md text-center">
                        <p className="font-medium">OTP Sent!</p>
                        <p className="text-sm mt-1">Check your email for the verification code. Redirecting to reset page...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-hover text-text-main font-semibold py-2 px-4 rounded-md transition duration-200 mt-4 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-text-main" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Send OTP"}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-text-muted">
                    Remember your password?{' '}
                    <Link to="/login" className="text-secondary hover:text-secondary-hover font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
