import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import api from "../api";
import { StoreContext } from "../PrivateRouter/StoreContext";
import PageContainer from "../components/CommenComponents/PageContainer";
import PageHeader from "../components/CommenComponents/PageHeader";

const FoodDetails = () => {

    const { id } = useParams();

    const { addToFoodCart, toggleWishlist, wishlist } =
        useContext(StoreContext);

    const [food, setFood] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedImage, setSelectedImage] = useState("");
    const [quantity, setQuantity] = useState(1);

    const [zoomed, setZoomed] = useState(false);
    const [backgroundPosition, setBackgroundPosition] = useState("50% 50%");
    const zoomLevel = 2.5;

    const handleMouseMove = (e) => {
        const { left, top, width, height } =
            e.currentTarget.getBoundingClientRect();

        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        setBackgroundPosition(`${x}% ${y}%`);
    };

    const parseJsonField = (value) => {
        if (!value) return [];

        if (Array.isArray(value)) return value;

        try {
            return JSON.parse(value);
        } catch {
            return [value];
        }
    };

    useEffect(() => {
        const fetchFood = async () => {
            try {
                const res = await api.get(`/chef-foods/${id}`);

                const foodData = {
                    ...res.data,
                    images: parseJsonField(res.data.images),
                };

                setFood(foodData);

                if (foodData.images.length > 0) {
                    setSelectedImage(foodData.images[0]);
                }
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchFood();
    }, [id]);

    useEffect(() => {
        console.log("Selected Image:", selectedImage);
    }, [selectedImage]);

    if (loading) return <p>Loading...</p>;

    if (!food) return <p>Food not found</p>;

    const unitPrice =
        food.final_price ||
        food.offer_price ||
        food.mrp ||
        0;

    const isInWishlist = wishlist.some(
        (item) =>
            item.product_id === food.id ||
            item.id === food.id
    );

    return (
        <>
            <PageHeader title={food?.name || "Food Details"} />

            <section className="bg-slate-50 py-12">
                <PageContainer>

                    <div className="grid lg:grid-cols-2 gap-12">

                        {/* LEFT */}
                        <div className="lg:sticky lg:top-24 h-fit">
                            <div
                                className="relative rounded-3xl border border-slate-200 bg-white shadow-sm h-[550px]"
                                onMouseEnter={() => setZoomed(true)}
                                onMouseLeave={() => setZoomed(false)}
                                onMouseMove={handleMouseMove}
                            >
                                <img
                                    src={selectedImage}
                                    alt={food.name}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />

                                {zoomed && (

                                    <div
                                        className="absolute top-0 left-full ml-4 w-[520px] h-[480px] border rounded-2xl overflow-hidden z-[9999] hidden lg:block bg-white shadow-lg"
                                        style={{
                                            backgroundImage: `url(${selectedImage})`,
                                            backgroundRepeat: "no-repeat",
                                            backgroundSize: `${zoomLevel * 100}%`,
                                            backgroundPosition,
                                        }}

                                    />
                                )}
                            </div>

                            {food.images?.length > 1 && (
                                <div className="flex gap-3 mt-4 overflow-x-auto">
                                    {food.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt=""
                                            onClick={() => setSelectedImage(img)}
                                            className={`w-24 h-24 rounded-xl object-cover cursor-pointer border-2 transition ${selectedImage === img
                                                ? "border-primary"
                                                : "border-slate-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-5">

                            {/* Chef */}
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-green-50 border-1  text-green-700 text-xs font-bold">
                                    👨‍🍳 {food.chef_name}
                                </span>
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-2xl lg:text-5xl font-semibold text-slate-900 leading-tight">
                                    {food.name}
                                </h1>

                                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                                    <span>⭐ {food.rating || "4.8"}</span>

                                    {food.category && (
                                        <>
                                            <span>•</span>
                                            <span>{food.category}</span>
                                        </>
                                    )}

                                    {food.subcategory && (
                                        <>
                                            <span>•</span>
                                            <span>{food.subcategory}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-semibold text-primary">
                                    ₹{unitPrice}
                                </span>

                                {food.mrp && (
                                    <span className="text-base text-slate-400 line-through">
                                        ₹{food.mrp}
                                    </span>
                                )}

                                {food.offer && (
                                    <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-medium">
                                        {food.offer}% OFF
                                    </span>
                                )}
                            </div>

                            {/* Description Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <p className="text-sm leading-7 text-slate-600">
                                    {food.description || "No description available"}
                                </p>
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center justify-between border border-slate-200 rounded-2xl p-4">
                                <span className="text-sm font-medium text-slate-700">
                                    Quantity
                                </span>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            quantity > 1 &&
                                            setQuantity(quantity - 1)
                                        }
                                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200"
                                    >
                                        -
                                    </button>

                                    <span className="w-8 text-center font-medium">
                                        {quantity}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() =>
                                        addToFoodCart(
                                            food,
                                            null,
                                            null,
                                            quantity
                                        )
                                    }
                                    className="flex-1 h-12 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <FiShoppingCart />
                                    Add to Cart
                                </button>

                                <button
                                    onClick={() => toggleWishlist(food)}
                                    className={`h-12 w-12 rounded-xl border flex items-center justify-center ${isInWishlist
                                            ? "border-red-500 text-red-500"
                                            : "border-slate-300"
                                        }`}
                                >
                                    <FiHeart
                                        className={isInWishlist ? "fill-current" : ""}
                                    />
                                </button>
                            </div>

                        </div>
                    </div>

                </PageContainer>
            </section>
        </>
    );
};

export default FoodDetails;