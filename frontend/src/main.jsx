import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import { StoreProvider } from "./PrivateRouter/StoreContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { AdminProvider } from "./PrivateRouter/AdminContext.jsx";
import { Toaster } from "react-hot-toast";
import Loader from "./Components/CommenComponents/Loader.jsx";

// Lazy Load Main Components
const Home = React.lazy(() => import("./Components/Home/Home.jsx"));
const About = React.lazy(() => import("./Components/Home/About.jsx"));
const Shop = React.lazy(() => import("./Components/Home/Shop.jsx"));
const ContactUs = React.lazy(() => import("./Components/Home/ContactUs.jsx"));
const ProductDetails = React.lazy(() => import("./Components/Products/ProductDetails.jsx"));
const Cart = React.lazy(() => import("./Components/Pages/Cart.jsx"));
const FoodCart = React.lazy(() => import("./Components/Pages/FoodCart.jsx"));
const Wishlist = React.lazy(() => import("./Components/Pages/Wishlist.jsx"));
const AllProductsPage = React.lazy(() => import("./Components/Pages/AllProducts.jsx"));
const Checkout = React.lazy(() => import("./Components/Pages/Checkout.jsx"));
const FoodCheckout = React.lazy(() => import("./Components/Pages/FoodCheckout.jsx"));
const CategoryPage = React.lazy(() => import("./Components/Pages/CategoryPage.jsx"));
const Account = React.lazy(() => import("./Components/Pages/Account/Account.jsx"));
const TermsAndConditions = React.lazy(() => import("./Components/CommenComponents/TermsAndCondition.jsx"));
const OrdersMain = React.lazy(() => import("./Components/Home/OrdersMain.jsx"));
const Login = React.lazy(() => import("./Components/Auth/Login.jsx"));
const Register = React.lazy(() => import("./Components/Auth/Register.jsx"));

// Lazy Load Admin Components
const AdminPanel = React.lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = React.lazy(() => import("./Admin/Dashboard.jsx"));
const AllProducts = React.lazy(() => import("./Admin/Pages/AllProducts.jsx"));
const Category = React.lazy(() => import("./Admin/Pages/Category.jsx"));
const StockDetails = React.lazy(() => import("./Admin/Pages/StockDetails.jsx"));
const AddStock = React.lazy(() => import("./Admin/Pages/AddStock.jsx"));
const Orders = React.lazy(() => import("./Admin/Pages/Orders.jsx"));
const Users = React.lazy(() => import("./Admin/Pages/Users.jsx"));
const Billing = React.lazy(() => import("./Admin/Pages/Billing.jsx"));
const Dealers = React.lazy(() => import("./Admin/Pages/Dealers.jsx"));
const Reviews = React.lazy(() => import("./Admin/Pages/Reviews.jsx"));
const Reports = React.lazy(() => import("./Admin/Pages/Reports.jsx"));
const Settings = React.lazy(() => import("./Admin/Pages/Settings.jsx"));
const Profile = React.lazy(() => import("./Admin/Pages/Profile.jsx"));
const OrderDetail = React.lazy(() => import("./Admin/Pages/OrderDetail.jsx"));
const ProductDetail = React.lazy(() => import("./Admin/Pages/ProductDetail.jsx"));
const AddProducts = React.lazy(() => import("./Admin/Pages/AddProducts.jsx"));
const AddDealer = React.lazy(() => import("./Admin/Pages/AddDealer.jsx"));
const AddInvoice = React.lazy(() => import("./Admin/Pages/AddInvoice.jsx"));
const CreateOrder = React.lazy(() => import("./Admin/Pages/CreateOrder.jsx"));
const VideoManagement = React.lazy(() => import("./Admin/Pages/VideoManagement.jsx"));
const BannerManagement = React.lazy(() => import("./Admin/Pages/BannerManagement.jsx"));
const ErrorPage = React.lazy(() => import("./Admin/Pages/ErrorPage.jsx"));

// Lazy Load SuperAdmin Components
const SuperAdminPanel = React.lazy(() => import("./SuperAdmin/SuperAdminPanel.jsx"));
const SuperDashboard = React.lazy(() => import("./SuperAdmin/SuperDashboard.jsx"));
const RestaurantManagement = React.lazy(() => import("./SuperAdmin/Pages/RestaurantManagement.jsx"));
const AdminRestaurantManagement = React.lazy(() => import("./Admin/Pages/RestaurantManagement.jsx"));
const HomeChefManagement = React.lazy(() => import("./Admin/Pages/HomeChefManagement.jsx"));
const HomeChefDetail = React.lazy(() => import("./Admin/Pages/HomeChefDetail.jsx"));
const DeliveryPartnerManagement = React.lazy(() => import("./Admin/Pages/DeliveryPartnerManagement.jsx"));
const UserManagement = React.lazy(() => import("./Admin/Pages/UserManagement.jsx"));
const HomeChefPanel = React.lazy(() => import("./HomeChef/ChefPanel.jsx"));
const HomeChefDashboard = React.lazy(() => import("./HomeChef/Pages/AnalyticsDashboard.jsx"));
const HomeChefPageManagement = React.lazy(() => import("./HomeChef/Pages/HomeChefManagement.jsx"));
const ChefAddProducts = React.lazy(() => import("./HomeChef/Pages/AddProducts.jsx"));
const ChefFoodAdd = React.lazy(() => import("./HomeChef/Pages/ChefFoodAdd.jsx"));
const ChefFoodAll = React.lazy(() => import("./HomeChef/Pages/ChefFoodAll.jsx"));
const ChefProfile = React.lazy(() => import("./HomeChef/Pages/Profile.jsx"));
const ChefProducts = React.lazy(() => import("./HomeChef/Pages/MyProducts.jsx"));
const RecipeDetails = React.lazy(() => import("./HomeChef/Pages/RecipeDetails.jsx"));
const UploadFoodVideos = React.lazy(() => import("./HomeChef/Pages/UploadFoodVideos.jsx"));
const InstagramYouTubeIntegration = React.lazy(() => import("./HomeChef/Pages/InstagramYouTubeIntegration.jsx"));
const DailyMenuManagement = React.lazy(() => import("./HomeChef/Pages/DailyMenuManagement.jsx"));
const MealSlotManagement = React.lazy(() => import("./HomeChef/Pages/MealSlotManagement.jsx"));
const PreorderFoodSystem = React.lazy(() => import("./HomeChef/Pages/PreorderFoodSystem.jsx"));
const DeliveryLimitSettings = React.lazy(() => import("./HomeChef/Pages/DeliveryLimitSettings.jsx"));
const AnalyticsDashboard = React.lazy(() => import("./HomeChef/Pages/AnalyticsDashboard.jsx"));
const WalletAndEarnings = React.lazy(() => import("./HomeChef/Pages/WalletAndEarnings.jsx"));
const ChefCategories = React.lazy(() => import("./HomeChef/Pages/ChefCategory.jsx"));
const ChefFoodCategories = React.lazy(() => import("./HomeChef/Pages/ChefFoodCategories.jsx"));
const ChefFoodCategoryAdd = React.lazy(() => import("./HomeChef/Pages/ChefFoodCategoryAdd.jsx"));
const OrderManagement = React.lazy(() => import("./Admin/Pages/OrderManagement.jsx"));
const PayoutManagement = React.lazy(() => import("./Admin/Pages/PayoutManagement.jsx"));
const FranchiseOwnerManagement = React.lazy(() => import("./SuperAdmin/Pages/FranchiseOwnerManagement.jsx"));
const FranchiseDetails = React.lazy(() => import("./SuperAdmin/Pages/FranchiseDetails.jsx"));
const CommissionManagement = React.lazy(() => import("./SuperAdmin/Pages/CommissionManagement.jsx"));
const SuperBannerManagement = React.lazy(() => import("./SuperAdmin/Pages/BannerManagement.jsx"));
const NotificationManagement = React.lazy(() => import("./SuperAdmin/Pages/NotificationManagement.jsx"));
const ReportsAnalytics = React.lazy(() => import("./SuperAdmin/Pages/ReportsAnalytics.jsx"));
const SubscriptionPlansManagement = React.lazy(() => import("./SuperAdmin/Pages/SubscriptionPlansManagement.jsx"));
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/shop", element: <Shop /> },
      { path: "/contactus", element: <ContactUs /> },
      { path: "/products/:id", element: <ProductDetails /> },
      { path: "/category/:categoryName", element: <CategoryPage /> },
      { path: "/cart", element: <Cart /> },
      { path: "/food-cart", element: <FoodCart /> },
      { path: "/food-checkout", element: <FoodCheckout /> },
      { path: "/wishlist", element: <Wishlist /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/account", element: <Account /> },
      { path: "/ordersmain", element: <OrdersMain /> },
      { path: "/termsandconditions", element: <TermsAndConditions /> },

    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  
  {
    path: "/superadmin",
    element: (
      <PrivateRoute allowedRoles={["superadmin"]}>
        <AdminProvider>
          <SuperAdminPanel />
        </AdminProvider>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <SuperDashboard /> },
      { path: "restaurants", element: <RestaurantManagement /> },
      { path: "homechefs", element: <HomeChefManagement /> },
      { path: "delivery-partners", element: <DeliveryPartnerManagement /> },
      { path: "users", element: <UserManagement /> },
      { path: "orders", element: <OrderManagement /> },
      { path: "payouts", element: <PayoutManagement /> },
      { path: "franchises", element: <FranchiseOwnerManagement /> },
      { path: "franchises/:id", element: <FranchiseDetails /> },
      { path: "plans", element: <SubscriptionPlansManagement /> },
      { path: "commissions", element: <CommissionManagement /> },
      { path: "banners", element: <SuperBannerManagement /> },
      { path: "notifications", element: <NotificationManagement /> },
      { path: "reports", element: <ReportsAnalytics /> },
    ],
  },

  {
    path: "/chef",
    element: (
      <PrivateRoute allowedRoles={["chef"]}>
        <AdminProvider>
          <HomeChefPanel />
        </AdminProvider>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomeChefDashboard /> },
      { path: "profile", element: <ChefProfile /> },
      { path: "add-products", element: <ChefAddProducts /> },
      { path: "add-products/:id", element: <ChefAddProducts /> },
      { path: "products", element: <ChefProducts /> },
      { path: "food/add", element: <ChefFoodAdd /> },
      { path: "food/edit/:id", element: <ChefFoodAdd /> },
      { path: "food/all", element: <ChefFoodAll /> },
      { path: "recipes", element: <RecipeDetails /> },
      { path: "upload-videos", element: <UploadFoodVideos /> },
      { path: "social-media", element: <InstagramYouTubeIntegration /> },
      { path: "daily-menu", element: <DailyMenuManagement /> },
      { path: "meal-slots", element: <MealSlotManagement /> },
      { path: "preorders", element: <PreorderFoodSystem /> },
      { path: "delivery-settings", element: <DeliveryLimitSettings /> },
      { path: "categories", element: <ChefCategories /> },
      { path: "food/categories", element: <ChefFoodCategories /> },
      { path: "food/categories/add", element: <ChefFoodCategoryAdd /> },
      { path: "analytics", element: <AnalyticsDashboard /> },
      { path: "earnings", element: <WalletAndEarnings /> },
      { path: "orders", element: <OrderManagement /> },
    ],
  },

  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminProvider>
          <AdminPanel />
        </AdminProvider>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "restaurants", element: <AdminRestaurantManagement /> },
      { path: "homechefs", element: <HomeChefManagement /> },
      { path: "homechefs/:id", element: <HomeChefDetail /> },
      { path: "delivery-partners", element: <DeliveryPartnerManagement /> },
      { path: "users", element: <UserManagement /> },
      { path: "orders", element: <OrderManagement /> },
      { path: "payouts", element: <PayoutManagement /> },
      // Products
      { path: "products/all", element: <AllProducts /> },
      { path: "products/add", element: <AddProducts /> },
      { path: "products/edit/:id", element: <AddProducts /> },
      { path: "products/category", element: <Category /> },
      { path: "products/stock", element: <StockDetails /> },
      { path: "products/stock/add", element: <AddStock /> },
      { path: "products/:id", element: <ProductDetail /> },
      // Orders
      { path: "orders/create", element: <CreateOrder /> },
      { path: "orders/new", element: <Orders statusFilter="Order Placed" /> },
      { path: "orders/all", element: <Orders statusFilter="All" /> },
      { path: "orders/delivery", element: <Orders statusFilter="Delivered" /> },
      { path: "orders/cancelled", element: <Orders statusFilter="Cancelled" /> },
      { path: "orders/:id", element: <OrderDetail /> },
      // Others
      { path: "users/all", element: <Users initialTab="All" /> },
      { path: "users/new", element: <Users initialTab="New" /> },
      // Marketing & Support

      // Finance
      { path: "billing", element: <Billing /> },
      { path: "dealers", element: <Dealers /> },
      { path: "dealers/add", element: <AddDealer /> },
      { path: "invoices/add", element: <AddInvoice /> },
      { path: "reviews", element: <Reviews /> },
      { path: "reports", element: <Reports /> },
      { path: "videos", element: <VideoManagement /> },
      { path: "banners", element: <BannerManagement /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="92181265196-n9a9p26qe601hg7lar8acq6s4f1cknq7.apps.googleusercontent.com">
    <AuthProvider>
      <StoreProvider>
        <Toaster position="top-left" reverseOrder={false} />
        <React.Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </React.Suspense>
      </StoreProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
