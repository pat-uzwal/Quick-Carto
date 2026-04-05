import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWarehouses = createAsyncThunk(
    'warehouse/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('warehouses/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouses');
        }
    }
);

// This action is to find the nearest warehouse based on user location
export const setNearestWarehouse = createAsyncThunk(
    'warehouse/findNearest',
    async (locationParams, { rejectWithValue }) => {
        try {
            // Assuming backend has an endpoint for this
            const response = await api.post('warehouses/nearest/', locationParams);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to find nearest warehouse');
        }
    }
);

const initialState = {
    warehouses: [],
    nearestWarehouse: null,
    loading: false,
    error: null,
};

const warehouseSlice = createSlice({
    name: 'warehouse',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWarehouses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouses = action.payload;
                state.error = null;
            })
            .addCase(fetchWarehouses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(setNearestWarehouse.pending, (state) => {
                state.loading = true;
            })
            .addCase(setNearestWarehouse.fulfilled, (state, action) => {
                state.loading = false;
                state.nearestWarehouse = action.payload;
                state.error = null;
            })
            .addCase(setNearestWarehouse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default warehouseSlice.reducer;
