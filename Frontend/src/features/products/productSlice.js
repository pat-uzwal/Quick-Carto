import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProducts = createAsyncThunk(
    'products/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('products/', { params });
            const results = response.data.results || response.data;
            return results.map(p => ({
                _id: p.id?.toString(),
                name: p.name,
                description: p.description,
                category: p.category_name || p.category,
                category_id: p.category, // Raw ID from backend
                category_slug: p.category_slug,
                price: p.final_price || p.price,
                originalPrice: p.original_price,
                discount: p.discount_percentage,
                weight: p.weight_volume,
                image: p.image_url,
                is_active: p.is_active,
                total_stock: p.total_stock
            }));
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const fetchProductById = createAsyncThunk(
    'products/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`products/${id}/`);
            const p = response.data;
            return {
                _id: p.id?.toString(),
                name: p.name,
                description: p.description,
                category: p.category_name || p.category,
                price: p.final_price || p.price,
                originalPrice: p.original_price,
                discount: p.discount_percentage,
                weight: p.weight_volume,
                image: p.image_url,
                is_active: p.is_active,
                total_stock: p.total_stock
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
        }
    }
);

const initialState = {
    items: [],
    categories: [],
    selectedProduct: null,
    loading: false,
    error: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setCategories(state, action) {
            state.categories = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchProductById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProduct = action.payload;
                state.error = null;
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setCategories } = productSlice.actions;
export default productSlice.reducer;
