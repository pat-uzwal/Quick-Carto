/* eslint-disable react/prop-types */
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart, updateQuantity, removeFromCart } from '../features/cart/cartSlice';
import { Package, Zap } from 'lucide-react';

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart?.items || []);

    const productId = product.id || product._id;
    const cartItem = cartItems.find((item) => item.id === productId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        dispatch(addToCart({ 
            id: productId, 
            name: product.name, 
            price: product.price, 
            image: product.image_url || product.image || product.icon 
        }));
    };

    const handleIncrement = (e) => {
        e.preventDefault();
        dispatch(updateQuantity({ id: productId, quantity: quantity + 1 }));
    };

    const handleDecrement = (e) => {
        e.preventDefault();
        if (quantity === 1) {
            dispatch(removeFromCart({ id: productId }));
        } else {
            dispatch(updateQuantity({ id: productId, quantity: quantity - 1 }));
        }
    };

    return (
        <Link
            to={`/product/${productId}`}
            className="w-full bg-white border border-gray-100 shadow-sm rounded-[24px] p-4 flex flex-col hover:shadow-2xl hover:-translate-y-2 hover:border-[#e62020]/20 transition-all duration-300 group relative overflow-hidden h-full"
        >
            {/* Out of Stock Overlay */}
            {product.total_stock === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-[24px]">
                    <div className="bg-red-50 text-red-600 font-black text-[11px] px-3 py-1.5 rounded-lg border border-red-200 uppercase tracking-widest shadow-sm">
                        Out of Stock
                    </div>
                </div>
            )}
            {/* Discount Badge */}
            {product.discount > 0 && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-[#ff4500] to-[#ff7300] text-white text-[10px] font-black px-2.5 py-1 rounded-br-xl shadow-md z-10 flex items-center leading-none tracking-wide">
                    {product.discount}% OFF
                </div>
            )}

            {/* Image Box */}
            <div className="relative w-full h-[160px] bg-gradient-to-b from-gray-50 to-transparent rounded-[16px] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 will-change-transform overflow-hidden relative">
                {(product.image_url || product.image) ? (
                    <>
                        <img 
                            src={product.image_url || product.image}
                            alt={product.name} 
                            className="w-full h-full object-contain p-4 drop-shadow-md mix-blend-multiply"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.classList.remove('hidden');
                            }} 
                        />
                        <span className="text-gray-300 mx-auto justify-center w-full flex items-center hidden h-full"><Package size={80} /></span>
                    </>
                ) : (
                    <span className="drop-shadow-md text-gray-300">{product.icon || <Package size={80} />}</span>
                )}
            </div>

            {/* Timer Badge */}
            <div className="bg-red-50/80 border border-red-100 text-[#e62020] text-[9px] font-bold px-2 py-0.5 rounded-md flex w-max items-center gap-1 mb-2 shadow-[0_2px_8px_-2px_rgba(230,32,32,0.15)]">
                <span className="text-[11px]"><Zap size={12} className="text-yellow-500" /></span> 10 MINS
            </div>

            {/* Info */}
            <p className="text-[14px] font-bold text-gray-800 leading-[1.3] line-clamp-2 min-h-[38px] tracking-tight group-hover:text-[#e62020] transition-colors">{product.name}</p>
            <span className="text-[12px] text-gray-500 font-medium mt-1 mb-3 block">{product.weight}</span>

            {/* Price + Button */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col justify-center">
                    {product.originalPrice > product.price && (
                        <span className="text-[11px] text-gray-400 line-through leading-none mb-1">रू{product.originalPrice}</span>
                    )}
                    <span className="text-[16px] font-black text-gray-900 leading-none tracking-tight">रू{product.price}</span>
                </div>
                <div onClick={(e) => e.preventDefault()} className="z-10">
                    {quantity === 0 ? (
                        <button
                            onClick={handleAddToCart}
                            disabled={product.total_stock === 0}
                            className={`text-[13px] font-black px-6 py-2 rounded-xl uppercase tracking-widest transition-all duration-300 border-none ${
                                product.total_stock === 0 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-[#e62020] text-white hover:bg-[#cc1b1b] shadow-md hover:shadow-[0_6px_16px_rgba(230,32,32,0.3)] active:scale-95'
                            }`}
                        >
                            ADD
                        </button>
                    ) : (
                        <div className="flex items-center bg-[#e62020] shadow-[0_4px_12px_rgba(230,32,32,0.25)] text-white rounded-[10px] h-[36px] text-sm font-bold overflow-hidden w-[76px] justify-between px-1">
                            <button onClick={handleDecrement} className="w-6 h-full flex items-center justify-center hover:bg-black/10 active:bg-black/20 transition-colors">−</button>
                            <span className="text-[13px] flex-1 text-center font-black">{quantity}</span>
                            <button onClick={handleIncrement} disabled={quantity >= product.total_stock} className={`w-6 h-full flex items-center justify-center transition-colors ${quantity >= product.total_stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10 active:bg-black/20'}`}>+</button>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
