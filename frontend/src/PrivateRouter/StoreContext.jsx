import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { toast } from "react-hot-toast";
import api from "../api";
import { AuthContext } from "./AuthContext";

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loadingCart, setLoadingCart] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    const [productsCache, setProductsCache] = useState([]);
    const [videosCache, setVideosCache] = useState([]);
    const [bannersCache, setBannersCache] = useState({});
    const [categoriesCache, setCategoriesCache] = useState([]);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    // ─── Fetch cart from backend ─────────────────────────────────
    const fetchCart = useCallback(async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            setLoadingCart(true);
            const res = await api.get(`/cart/${user.user_id}`);
            setCart(res.data);
        } catch (err) {
            console.error("Fetch cart error:", err);
        } finally {
            setLoadingCart(false);
        }
    }, [user?.user_id]);

    // ─── Fetch wishlist from backend ─────────────────────────────
    const fetchWishlist = useCallback(async () => {
        if (!user?.user_id) { setWishlist([]); return; }
        try {
            setLoadingWishlist(true);
            const res = await api.get(`/wishlist/${user.user_id}`);
            setWishlist(res.data);
        } catch (err) {
            console.error("Fetch wishlist error:", err);
        } finally {
            setLoadingWishlist(false);
        }
    }, [user?.user_id]);

    // Load cart + wishlist when user logs in
    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, [fetchCart, fetchWishlist]);

    // ─── CART ACTIONS ────────────────────────────────────────────

    const addToCart = async (product, variant = null, size = null, qty = 1) => {
        if (!user?.user_id) {
            toast.error("Please login to add items to cart");
            return;
        }

        const selectedVariant = variant || product.variants?.[0] || null;
        const selectedSize = size || selectedVariant?.selectedSizes?.[0] || "Free Size";
        const variantColor = selectedVariant?.colorName || selectedVariant?.color || "Default";
        
        // Correctly parse images if they are stored as JSON strings
        const productImages = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
        const variantImage = selectedVariant?.images?.[0] || productImages[0] || null;
        
        const price = parseFloat(product.offer_price || product.price || 0);

        try {
            await api.post("/cart", {
                user_id: user.user_id,
                product_id: product.id || product.product_id,
                variant_color: variantColor,
                variant_size: selectedSize,
                image: variantImage,
                email: user.email || "",
                price: price,
                total_price: price * qty, 
                quantity: qty,
            });
            toast.success("Added to cart!");
            await fetchCart(); // Refresh from backend to get image + full details
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error("Failed to add to cart");
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            await api.delete(`/cart/${cartItemId}`);
            toast.error("Removed from cart");
            await fetchCart();
        } catch (err) {
            console.error("Remove cart error:", err);
            toast.error("Failed to remove item");
        }
    };

    const updateCartQuantity = async (cartItemId, qty) => {
        if (qty < 1) return;
        const targetItem = cart.find(i => i.id === cartItemId);
        if (!targetItem) return;

        try {
            await api.put(`/cart/${cartItemId}`, {
                quantity: qty,
                price: targetItem.price
            });
            setCart(prev => prev.map(item =>
                item.id === cartItemId ? {
                    ...item,
                    quantity: qty,
                    total_price: item.price * qty
                } : item
            ));
        } catch (err) {
            console.error("Update qty error:", err);
            toast.error("Failed to update quantity");
        }
    };

    const clearCart = async () => {
        if (!user?.user_id) { setCart([]); return; }
        try {
            await api.delete(`/cart/clear/${user.user_id}`);
            setCart([]);
        } catch (err) {
            console.error("Clear cart error:", err);
        }
    };

    // ─── WISHLIST ACTIONS ────────────────────────────────────────

    const toggleWishlist = async (product, variant = null, size = null) => {
        if (!user?.user_id) {
            toast.error("Please login to manage wishlist");
            return;
        }

        const productId = product.id || product.product_id;
        const isAlready = wishlist.some(w => w.product_id === productId || w.id === productId);

        try {
            if (isAlready) {
                await api.delete(`/wishlist/${user.user_id}/${productId}`);
                toast.error("Removed from favorites");
            } else {
                const selectedVariant = variant || product.variants?.[0] || null;
                const selectedSize = size || selectedVariant?.selectedSizes?.[0] || "";
                const variantColor = selectedVariant?.colorName || selectedVariant?.color || "";
                
                // Correctly parse images if they are stored as JSON strings
                const productImages = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
                const variantImage = selectedVariant?.images?.[0] || productImages[0] || null;
                
                const price = parseFloat(product.offer_price || product.price || 0);

                await api.post("/wishlist", {
                    user_id: user.user_id,
                    product_id: productId,
                    variant_color: variantColor,
                    variant_size: selectedSize,
                    image: variantImage,
                    email: user.email || "",
                    price: price,
                    total_price: price,
                });
                toast.success("Added to favorites!");
            }
            await fetchWishlist();
        } catch (err) {
            console.error("Toggle wishlist error:", err);
            toast.error("Failed to update wishlist");
        }
    };

    return (
        <StoreContext.Provider value={{
            cart, wishlist,
            addToCart, removeFromCart, updateCartQuantity, clearCart,
            toggleWishlist,
            loadingCart, loadingWishlist,
            fetchCart, fetchWishlist,
            productsCache, setProductsCache,
            videosCache, setVideosCache,
            bannersCache, setBannersCache,
            categoriesCache, setCategoriesCache,
            lastFetchTime, setLastFetchTime
        }}>
            {children}
        </StoreContext.Provider>
    );
};
