import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productReducer from '../features/products/productSlice';
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/orders/orderSlice';
import offersReducer from '../features/offers/offersSlice';
import warehouseReducer from '../features/warehouse/warehouseSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        cart: cartReducer,
        orders: orderReducer,
        offers: offersReducer,
        warehouse: warehouseReducer,
    },
});

export default store;
