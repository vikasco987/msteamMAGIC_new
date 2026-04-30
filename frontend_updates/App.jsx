import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Home from "./Pages/Home";
import ReturnPolicy from "./components/ReturnPolicy";
import "./App.css";
import ShippingPolicy from "./components/ShippingPolicy";
import PrivacyPolicies from "./components/PrivacyPolicies";
import HomeWork from "./components/HomeWork";
import Work from "./components/Work";
import Terms from "./components/Terms";
import Checkout from "./Pages/Checkout";
import CheckoutLink from "./Pages/CheckoutLink";
import PaymentSuccess from "./Pages/PaymentSuccess/PaymentSuccess";
import ServicesPage from "./Pages/ServicesPage";
import ZomatoDetails from "./Pages/depthcard/ZomatoDetails";
import SwiggyDetails from "./Pages/depthcard/SwiggyDetails";
import FssaiDetails from "./Pages/depthcard/FssaiDetails";
import Login from './components/Login/Login';
import ForgotPassword from './components/Login/ForgotPassword/ForgotPassword';
import ResetPassword from './components/Login/ResetPassword/ResetPassword';
import Signup from './components/Signup/Signup';
import VerifyOtp from "./components/Signup/VerifyOTP";
import ProtectedRoute from './components/ProtectedRoute'; 
import PhoneOTPLogin from './components/PhoneOTPLogin';
import ZomatoCoursePage from    './Pages/depthcard/CoursePage/ZomatoCoursePage'; 
import UserDashboard from './Pages/UserDashboard/UserDashboard';
import SellerDashboard from './Pages/SellerDashboard/SellerDashboard';
import Profile from './Pages/UserDashboard/Profile'; 
import Orders from './Pages/UserDashboard/Orders';
import SwiggyOnboardingCourse from "./Pages/depthcard/SwiggyCoursePage/SwiggyCoursePage";
import FssaiLicenseCourse from "./Pages/depthcard/FssaiCoursePage/FssaiCoursePage";
import GrowthCoursePage from "./Pages/depthcard/GrowthCoursePage/GrowthCoursePage";
import ToingitDetails from "./Pages/depthcard/ToingitDetails/ToingitDetails";
import UnsubscribePage from "./Pages/UnsubscribePage";
import GstCoursePage from "./Pages/depthcard/GstCoursePage/GstCoursePage";
import AboutUsPage from "./Pages/AboutUsPage";
import BlogsPage from "./Pages/BlogsPage";
import BlogDetailsPage from "./Pages/BlogDetailsPage";
import PricingPage from "./Pages/PricingPage";
import Logout from "./Pages/Logout";
import CareersPage from "./Pages/CareersPage";
import JobDetailsPage from "./Pages/JobDetailsPage";
import KravyCoursePage from "./Pages/depthcard/KravyCoursePage/KravyCoursePage";
import ComboCoursePage from "./Pages/depthcard/ComboCoursePage/ComboCoursePage";
import PaymentRedirect from "./Pages/PaymentRedirect";

import Subscriptions from './Pages/UserDashboard/Subscriptions'; 




// import Services from "./components/work";

import { ThemeProvider } from "./components/context/ThemeContext";
import EnquiryModal from "./components/EnquiryModal";

function App() {
  const [count, setCount] = useState(0);

  const location = useLocation();

  const isRedirectPage = location.pathname.startsWith("/p/");

  return (
    <ThemeProvider>
      {!isRedirectPage && <Header />}
      {!isRedirectPage && <EnquiryModal />}
      <div>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/course/zomato-onboarding" element={<ZomatoCoursePage />} />
        <Route path="/course/swiggy-onboarding" element={<SwiggyOnboardingCourse />} />
        <Route path="/course/fssai-onboarding" element={<FssaiLicenseCourse />} />
        <Route path="/course/growth" element={<GrowthCoursePage />} />
        <Route path="/course/toingit" element={<ToingitDetails />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/course/gst" element={<GstCoursePage />} />
        <Route path="/course/combo-onboarding" element={<ComboCoursePage />} />
        <Route path="/product/kravy" element={<KravyCoursePage />} />
        <Route path="/services/zomato" element={<ZomatoDetails />} />
        <Route path="/services/swiggy" element={<SwiggyDetails />} />
        <Route path="/services/fssai" element={<FssaiDetails />} />
        <Route path="/services/fssai-registration" element={<FssaiDetails />} />

        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blogs/:id" element={<BlogDetailsPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<JobDetailsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'seller']}>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'seller']}>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicies />} />
        <Route path="/terms-and-condition" element={<Terms />} />
        <Route path="/login-phone" element={<PhoneOTPLogin />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/checkout-link" element={<CheckoutLink />} />


        <Route
          path="/SellerDashboard"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/dashboard" element={<UserDashboard />} /> */}
      {/* <Route
  path="/checkout/:id"
  element={
    window.location.pathname === '/checkout/fssai' ? (
      <Checkout />
    ) : (
      <ProtectedRoute allowedRoles={['user']}>
        <Checkout />
      </ProtectedRoute>
    )
  }
/>  */}
  {/* <Route path="/checkout/:id" element={<Checkout />} />  */}
      
          <Route
          path="/Subscriptions"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'seller']}>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'seller']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/p/:shortId" element={<PaymentRedirect />} />
      </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
