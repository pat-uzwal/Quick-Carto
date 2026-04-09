import { createSlice } from '@reduxjs/toolkit';

const loadCart = () => {
    try {
        const serializedState = localStorage.getItem('cart');
        if (serializedState === null) {
            return { items: [], totalAmount: 0, totalItems: 0 };
        }
        const state = JSON.parse(serializedState);
        // Fix stale image paths that contain spaces (pre-encoding fix)
        if (state.items) {
            state.items = state.items.map(item => ({
                ...item,
                // Re-encode path segments to fix spaces (safe to call on already-encoded URLs)
                image: item.image
                    ? item.image.startsWith('http') || item.image.startsWith('data:')
                        ? item.image
                        : item.image.split('/').map(s => s.includes('%') ? s : encodeURIComponent(s)).join('/')
                    : null
            }));
        }
        return state;
    } catch (err) {
        return { items: [], totalAmount: 0, totalItems: 0 };
    }
};

const initialState = loadCart();

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart(state, action) {
            const existingItem = state.items.find(item => item.id === action.payload.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ ...action.payload, quantity: 1 });
            }
            cartSlice.caseReducers.calculateTotals(state);
        },
        removeFromCart(state, action) {
            state.items = state.items.filter(item => item.id !== action.payload.id);
            cartSlice.caseReducers.calculateTotals(state);
        },
        updateQuantity(state, action) {
            const { id, quantity } = action.payload;
            const item = state.items.find(item => item.id === id);
            if (item) {
                if (quantity > 0) {
                    item.quantity = quantity;
                } else {
                    state.items = state.items.filter(item => item.id !== id);
                }
            }
            cartSlice.caseReducers.calculateTotals(state);
        },
        clearCart(state) {
            state.items = [];
            state.totalAmount = 0;
            state.totalItems = 0;
            localStorage.setItem('cart', JSON.stringify(state));
        },
        calculateTotals(state) {
            let amount = 0;
            let total = 0;
            state.items.forEach(item => {
                amount += item.quantity;
                total += item.quantity * item.price;
            });
            state.totalItems = amount;
            state.totalAmount = total;
            localStorage.setItem('cart', JSON.stringify(state));
        }
    }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
