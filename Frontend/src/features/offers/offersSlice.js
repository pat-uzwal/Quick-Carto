import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchOffers = createAsyncThunk(
    'offers/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('offers/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch offers');
        }
    }
);

const initialState = {
    offers: [],
    loading: false,
    error: null,
};

const offersSlice = createSlice({
    name: 'offers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchOffers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOffers.fulfilled, (state, action) => {
                state.loading = false;
                state.offers = action.payload;
                state.error = null;
            })
            .addCase(fetchOffers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default offersSlice.reducer;
