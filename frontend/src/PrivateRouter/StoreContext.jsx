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
    const [chefFoodsCache, setChefFoodsCache] = useState([]);
    const [userFoodCart, setUserFoodCart] = useState([]);
    const [videosCache, setVideosCache] = useState([]);
    const [bannersCache, setBannersCache] = useState({});
    const [categoriesCache, setCategoriesCache] = useState([]);
    const [lastFetchTime, setLastFetchTime] = useState(0);
    const [lastChefFoodsFetchTime, setLastChefFoodsFetchTime] = useState(0);

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
            console.log('Wishlist data received:', res.data);
            setWishlist(res.data);
        } catch (err) {
            console.error("Fetch wishlist error:", err);
        } finally {
            setLoadingWishlist(false);
        }
    }, [user?.user_id]);

    const fetchUserFoodCart = useCallback(async () => {
        if (!user?.user_id) { setUserFoodCart([]); return; }
        try {
            const res = await api.get(`/user-food/${user.user_id}`);
            setUserFoodCart(res.data);
        } catch (err) {
            console.error('Fetch user food cart error:', err);
        }
    }, [user?.user_id]);

    // Load cart + wishlist when user logs in
    useEffect(() => {
        fetchCart();
        fetchWishlist();
        fetchUserFoodCart();
    }, [fetchCart, fetchWishlist, fetchUserFoodCart]);

    // ─── CART ACTIONS ────────────────────────────────────────────

    const addToCart = async (product, variant = null, size = null, qty = 1) => {
        if (!user?.user_id) {
            toast.error("Please login to add items to cart");
            return;
        }

        const productId = product.product_id ?? product.productId ?? product.id ?? product._id ?? null;
        const selectedVariant = variant || product.variants?.[0] || null;
        const selectedSize = size ?? product.variant_size ?? product.variantSize ?? selectedVariant?.weight ?? selectedVariant?.selectedSizes?.[0] ?? "";
        const variantColor = selectedVariant?.colorName || selectedVariant?.color || product.variant_color || product.variantColor || "";

        // Correctly parse images if they are stored as JSON strings
        let productImages = [];
        if (typeof product.images === 'string') {
            try {
                const parsedImages = JSON.parse(product.images);
                productImages = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
            } catch (err) {
                productImages = [product.images];
            }
        } else if (Array.isArray(product.images)) {
            productImages = product.images;
        }

        const variantImage = selectedVariant?.images?.[0] || productImages[0] || product.image || product.wishlist_image || null;
        const price = parseFloat(selectedVariant?.offerPrice || selectedVariant?.salePrice || selectedVariant?.price || product.offer_price || product.price || 0);

        try {
            await api.post("/cart", {
                user_id: user.user_id,
                product_id: productId,
                name: product.name,
                variant_color: variantColor || "",
                variant_size: selectedSize || "",
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

    const addToFoodCart = async (product, variant = null, size = null, qty = 1) => {
        if (!user?.user_id) {
            toast.error('Please login to add items to cart');
            return;
        }

        // Prepare fields expected by user_food_cart
        const productImages = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
        const image = productImages[0] || product.image || '';
        const price = parseFloat(product.final_price ?? product.offer_price ?? product.mrp ?? product.price ?? 0);

        const payload = {
            user_id: user.user_id,
            product_id: product.product_id || product.id,
            name: product.name,
            image: image,
            price: price,
            total_price: price * qty,
            quantity: qty,

            // chef_user_id is the chef's user_id (user.user_id of the chef)
            // getFoodById now returns this correctly via the users JOIN
            chef_user_id: product.chef_user_id || product.created_by || product.created_by_user_id || '',
            chef_id: product.chef_id || product.id_in_home_chefs || '',
            chef_name: product.chef_name || product.created_by_name || '',
            chef_phone: product.chef_phone || product.created_by_phone || '',
            chef_email: product.chef_email || product.created_by_email || '',

            franchise_id: product.franchise_id || '',
            franchise_user_id: product.franchise_user_id || '',
            franchise_email: product.franchise_email || '',
            franchise_name: product.franchise_name || '',
            franchise_phone: product.franchise_phone || '',

            ordered_by_name: user.name || user.fullname || user.username || '',
            ordered_by_user_id: user.user_id,
            ordered_by_email: user.email || '',
            ordered_by_phone: user.phone || user.mobile || ''
        };

        try {
            await api.post('/user-food', payload);
            toast.success('Added to food cart');
            await fetchUserFoodCart();
        } catch (err) {
            console.error('Add to food cart error:', err);
            toast.error('Failed to add to food cart');
        }
    };

    const removeFromFoodCart = async (id) => {
        try {
            await api.delete(`/user-food/${id}`);
            toast.error('Removed from food cart');
            await fetchUserFoodCart();
        } catch (err) {
            console.error('Remove food cart error:', err);
            toast.error('Failed to remove item');
        }
    };

    const updateFoodCartQuantity = async (id, qty) => {
        if (qty < 1) return;
        const item = userFoodCart.find(i => i.id === id);
        if (!item) return;
        try {
            await api.put(`/user-food/${id}`, { quantity: qty, price: item.price });
            setUserFoodCart(prev => prev.map(it => it.id === id ? { ...it, quantity: qty, total_price: it.price * qty } : it));
        } catch (err) {
            console.error('Update food qty error:', err);
            toast.error('Failed to update quantity');
        }
    };

    const clearUserFoodCart = async () => {
        if (!user?.user_id) { setUserFoodCart([]); return; }
        try {
            await api.delete(`/user-food/clear/${user.user_id}`);
            setUserFoodCart([]);
        } catch (err) {
            console.error('Clear user food cart error:', err);
        }
    };

    const placeFoodOrder = async (checkoutData) => {
        if (!user?.user_id) {
            toast.error('Please login to place your order');
            return null;
        }

        if (!userFoodCart.length) {
            toast.error('Your food cart is empty');
            return null;
        }

        const totalAmount = userFoodCart.reduce(
            (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1),
            0
        );

        const orderPayload = {
            ...checkoutData,
            user_id: user.user_id,
            customer_name: user.name || user.username || user.fullname || '',
            customer_email: user.email || '',
            customer_phone: user.phone || user.mobile || '',
            ordered_by_name: user.name || user.username || user.fullname || '',
            ordered_by_email: user.email || '',
            ordered_by_phone: user.phone || user.mobile || '',
            total_amount: totalAmount,
            items: userFoodCart.map((item) => ({
                product_id: item.product_id,
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity,
                total_price: item.total_price,
                // Use correct chef_user_id with fallback chain
                chef_user_id: item.chef_user_id || item.created_by || item.created_by_user_id || '',
                chef_id: item.chef_id || '',
                chef_name: item.chef_name || item.created_by_name || '',
                chef_email: item.chef_email || item.created_by_email || '',
                chef_phone: item.chef_phone || item.created_by_phone || '',
                franchise_id: item.franchise_id || '',
                franchise_user_id: item.franchise_user_id || '',
                franchise_name: item.franchise_name || '',
                franchise_email: item.franchise_email || '',
                franchise_phone: item.franchise_phone || '',
                ordered_by_name: item.ordered_by_name || '',
                ordered_by_email: item.ordered_by_email || '',
                ordered_by_phone: item.ordered_by_phone || '',
            })),
            // Order-level chef info from first cart item
            chef_user_id: userFoodCart[0]?.chef_user_id || userFoodCart[0]?.created_by || userFoodCart[0]?.created_by_user_id || '',
            chef_id: userFoodCart[0]?.chef_id || '',
            chef_name: userFoodCart[0]?.chef_name || userFoodCart[0]?.created_by_name || '',
            chef_email: userFoodCart[0]?.chef_email || userFoodCart[0]?.created_by_email || '',
            chef_phone: userFoodCart[0]?.chef_phone || userFoodCart[0]?.created_by_phone || '',
            franchise_user_id: userFoodCart[0]?.franchise_user_id || '',
            franchise_id: userFoodCart[0]?.franchise_id || '',
            franchise_name: userFoodCart[0]?.franchise_name || '',
            franchise_email: userFoodCart[0]?.franchise_email || '',
            franchise_phone: userFoodCart[0]?.franchise_phone || '',
        };

        try {
            const res = await api.post('/user-food-orders', orderPayload);
            await clearUserFoodCart();
            return res.data;
        } catch (err) {
            console.error('Place food order error:', err);
            toast.error('Failed to place the food order');
            throw err;
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

        const productId = product.product_id ?? product.id ?? product._id ?? null;
        const isAlready = wishlist.some(w => Number(w.product_id) === Number(productId) || Number(w.id) === Number(productId));

        try {
            if (isAlready) {
                await api.delete(`/wishlist/${user.user_id}/${productId}`);
                toast.error("Removed from favorites");
            } else {
                const selectedVariant = variant || product.variants?.[0] || null;
                const selectedSize = size ?? product.variant_size ?? product.variantSize ?? selectedVariant?.weight ?? selectedVariant?.selectedSizes?.[0] ?? "";
                const variantColor = selectedVariant?.colorName || selectedVariant?.color || product.variant_color || product.variantColor || "";

                // Correctly parse images if they are stored as JSON strings
                let productImages = [];
                if (typeof product.images === 'string') {
                    try {
                        const parsed = JSON.parse(product.images);
                        productImages = Array.isArray(parsed) ? parsed : [product.images];
                    } catch (e) {
                        // If not valid JSON, treat as single image URL
                        productImages = [product.images];
                    }
                } else if (Array.isArray(product.images)) {
                    productImages = product.images;
                }
                
                let variantImage = selectedVariant?.images?.[0] || productImages[0] || product.image || product.wishlist_image || null;
                if (variantImage && typeof variantImage === 'string' && variantImage.trim() === '') {
                    variantImage = null;
                }

                const price = parseFloat(selectedVariant?.offerPrice || selectedVariant?.salePrice || selectedVariant?.price || product.offer_price || product.price || 0);

                await api.post("/wishlist", {
                    user_id: user.user_id,
                    product_id: productId,
                    variant_color: variantColor || "",
                    variant_size: selectedSize || "",
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
            cart, wishlist, userFoodCart,
            addToCart, removeFromCart, updateCartQuantity, clearCart,
            addToFoodCart, removeFromFoodCart, updateFoodCartQuantity, clearUserFoodCart, placeFoodOrder, fetchUserFoodCart,
            toggleWishlist,
            loadingCart, loadingWishlist,
            fetchCart, fetchWishlist,
            productsCache, setProductsCache,
            chefFoodsCache, setChefFoodsCache,
            videosCache, setVideosCache,
            bannersCache, setBannersCache,
            categoriesCache, setCategoriesCache,
            lastFetchTime, setLastFetchTime,
            lastChefFoodsFetchTime, setLastChefFoodsFetchTime,        }}>
            {children}
        </StoreContext.Provider>
    );
};
