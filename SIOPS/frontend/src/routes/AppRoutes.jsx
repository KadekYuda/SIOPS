import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

import Login from "../components/Page/Login/Login";
import DashboardAdmin from "../components/Page/Sidebar/admin/DashboardAdmin";
import DashboardStaff from "../components/Page/Sidebar/staff/DashboardStaff";
import DashboardLayout from "../components/Page/Login/DashboardLayout";
import UserProfile from "../components/Page/Profile/UserProfile";
import Product from "../components/Page/Product/Product";
import BatchStok from "../components/Page/Product/BatchStok";
import Sales from "../components/Page/Sales/Sales";
import SalesDetail from "../components/Page/Sales/SalesDetail";

import Order from "../components/Page/Order/Staff/Order";
import OrderAdmin from "../components/Page/Order/Admin/OrderAdmin";
import api from "../service/api";

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Function to fetch user data using HTTP-only cookie
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/users/verify-token");
      console.log("Fetched user:", response.data.user); // Tambahkan ini
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      if (!(error.response?.status === 401 && location.pathname === "/login")) {
        console.error("Error fetching user:", error);
      }
      setUser(null);
      setLoading(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/login") {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser, location.pathname]);

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Function to get user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(getUserRole())) {
      return (
        <Navigate
          to={getUserRole() === "admin" ? "/dashboardAdmin" : "/dashboard"}
          replace
        />
      );
    }

    return children;
  };

  // Public Route component (accessible only when not authenticated)
  const PublicRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (isAuthenticated()) {
      const redirectPath =
        getUserRole() === "admin" ? "/dashboardAdmin" : "/dashboard";

      return <Navigate to={redirectPath} replace />;
    }

    return children;
  };

  // Helper function for default path
  const getDefaultPath = () => {
    if (!isAuthenticated()) return "/login";
    return getUserRole() === "admin" ? "/dashboardAdmin" : "/dashboard";
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login onLoginSuccess={fetchUser} />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Routes */}
        <Route
          path="/dashboardAdmin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <DashboardStaff />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <Product />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userprofile"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/batchstock"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <BatchStok />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <Order />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orderAdmin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <OrderAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <Sales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salesdetail/:id"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <SalesDetail />
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect based on role */}
        <Route
          index
          element={
            <Navigate
              to={getUserRole() === "admin" ? "/dashboardAdmin" : "/dashboard"}
              replace
            />
          }
        />

        {/* Catch-all route - redirect to appropriate dashboard */}
        <Route
          path="*"
          element={
            <Navigate
              to={getUserRole() === "admin" ? "/dashboardAdmin" : "/dashboard"}
              replace
            />
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to={getDefaultPath()} replace />} />
    </Routes>
  );
}

export default AppRoutes;
