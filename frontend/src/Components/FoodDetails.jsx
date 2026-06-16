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
                        <div>

                            <span className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                                👨‍🍳 {food.chef_name}
                            </span>

                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mt-5">
                                {food.name}
                            </h1>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {food.category && (
                                    <span className="bg-slate-100 px-4 py-2 rounded-full text-sm">
                                        {food.category}
                                    </span>
                                )}

                                {food.subcategory && (
                                    <span className="bg-slate-100 px-4 py-2 rounded-full text-sm">
                                        {food.subcategory}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 flex items-center gap-2">
                                <span className="text-yellow-500 text-lg">
                                    ⭐
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {food.rating || "4.8"}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-8">
                                <span className="text-5xl font-black text-primary">
                                    ₹{unitPrice}
                                </span>

                                {food.mrp && (
                                    <span className="text-2xl text-slate-400 line-through">
                                        ₹{food.mrp}
                                    </span>
                                )}
                            </div>

                            <div className="mt-6">
                                <h3 className="font-bold text-lg mb-2">
                                    Description
                                </h3>

                                <p className="text-slate-600 leading-7">
                                    {food.description || "No description available"}
                                </p>
                            </div>

                            {food.offer && (
                                <div className="mt-4">
                                    <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold">
                                        {food.offer}% OFF
                                    </span>
                                </div>
                            )}

                            {/* Quantity */}

                            <div className="mt-10">
                                <h3 className="font-bold text-lg mb-4">
                                    Quantity
                                </h3>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() =>
                                            quantity > 1 &&
                                            setQuantity(quantity - 1)
                                        }
                                        className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200"
                                    >
                                        -
                                    </button>

                                    <span className="text-xl font-bold">
                                        {quantity}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Buttons */}

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() =>
                                        addToFoodCart(
                                            food,
                                            null,
                                            null,
                                            quantity
                                        )
                                    }
                                    className="flex-1 bg-primary text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold"
                                >
                                    <FiShoppingCart />
                                    Add To Cart
                                </button>

                                <button
                                    onClick={() => toggleWishlist(food)}
                                    className={`w-14 rounded-2xl border flex items-center justify-center ${isInWishlist
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