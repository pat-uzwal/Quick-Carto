import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import { AdminDashboard } from './pages/AdminDashboard'
import { WarehouseDashboard } from './pages/WarehouseDashboard'
import { DeliveryDashboard } from './pages/DeliveryDashboard'
import UserLayout from './layouts/UserLayout'
import Home from './pages/Home'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CategoryProducts from './pages/CategoryProducts'
import MyOrders from './pages/MyOrders'
import ProductsList from './pages/ProductsList'
import Profile from './pages/Profile'
import LocationTracker from './components/LocationTracker'
import WarehousePartner from './pages/WarehousePartner'
import './App.css'

function App() {
  return (
    <>
      <LocationTracker />
      <Routes>
      {/* Public/User Routes wrapped in Navbar Layout */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/category/:categoryId" element={<CategoryProducts />} />
        <Route path="/search" element={<ProductsList />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['user', 'admin', 'warehouse', 'delivery']}>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['user', 'admin', 'warehouse', 'delivery']}>
            <MyOrders />
          </ProtectedRoute>
        } />
        <Route path="/warehouse-partner" element={<WarehousePartner />} />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['user', 'admin', 'warehouse', 'delivery']}>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Dashboards */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/*"
        element={
          <ProtectedRoute allowedRoles={['warehouse']}>
            <WarehouseDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery/*"
        element={
          <ProtectedRoute allowedRoles={['delivery']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  )
}

export default App
