import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk for login
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('auth/login/', credentials); // Trailing slash for Django
            const { access, refresh, user } = response.data; // DRF returns access and refresh

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);
            localStorage.setItem('user', JSON.stringify(user));

            return { user, accessToken: access };
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Login failed');
        }
    }
);

// Async thunk for register
export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('auth/register/', userData); // Trailing slash for Django
            // Backend currently only returns user details, no tokens during registration, since OTP is needed
            const { email } = response.data;
            return { email };
        } catch (error) {
            let errorMessage = 'Registration failed';
            if (error.response?.data) {
                if (error.response.data.detail) errorMessage = error.response.data.detail;
                else if (error.response.data.message) errorMessage = error.response.data.message;
                else {
                    const firstKey = Object.keys(error.response.data)[0];
                    if (firstKey && Array.isArray(error.response.data[firstKey])) {
                        errorMessage = `${firstKey}: ${error.response.data[firstKey][0]}`;
                    } else if (firstKey) {
                        errorMessage = error.response.data[firstKey];
                    }
                }
            }
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk for verifyOtp
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await api.post('auth/verify-otp/', { email, otp });
            const { access, refresh, user } = response.data;

            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);
            localStorage.setItem('user', JSON.stringify(user));

            return { user, accessToken: access };
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'OTP Verification failed');
        }
    }
);

// Async thunk for requestOtp (for login or forgot password)
export const requestOtp = createAsyncThunk(
    'auth/requestOtp',
    async (email, { rejectWithValue }) => {
        try {
            const response = await api.post('auth/request-otp/', { email });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to send OTP');
        }
    }
);

// Async thunk for resetPassword
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (resetData, { rejectWithValue }) => {
        try {
            const response = await api.post('auth/reset-password/', resetData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to reset password');
        }
    }
);

// Async thunk for logout
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Optionally call backend to invalidate token
    // await api.post('/auth/logout');
    return null;
});

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    detectedLocation: localStorage.getItem('detectedLocation') || null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        updateProfile: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
        setDetectedLocation: (state, action) => {
            state.detectedLocation = action.payload;
            localStorage.setItem('detectedLocation', action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
                // Registration successful, but not logged in yet. Need to verify OTP.
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Verify OTP
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Request OTP
            .addCase(requestOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(requestOtp.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(requestOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
            });
    },
});

export const { clearError, updateProfile, setDetectedLocation } = authSlice.actions;
export default authSlice.reducer;
