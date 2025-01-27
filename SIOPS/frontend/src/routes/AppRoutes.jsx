    import { Routes, Route, Navigate } from "react-router-dom";
  import UserList from "../components/Page/CrudUser/UserList";
  import AddUser from "../components/Page/CrudUser/AddUser";
  import EditUser from "../components/Page/CrudUser/EditUser";
  import Login from "../components/Page/Home/Login";
  import OrderStock from "../components/Page/Order/OrderStock";
  import Staff from "../components/Page/Sidebar/staff/Staff";
  import DashboardAdmin from "../components/Page/Sidebar/admin/DashboardAdmin";
  import DashboardStaff from "../components/Page/Sidebar/staff/DashboardStaff";
  import DashboardLayout from "../components/Page/Home/DashboardLayout";


  function AppRoutes() {
    // Function to check if user is authenticated
    const isAuthenticated = () => {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return userData.exp > currentTime;
      } catch {
        return false;
      }
    };

    // Function to get user role
    const getUserRole = () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        return userData.role;
      } catch {
        return null;
      }
    };

    // Protected Route component
    const ProtectedRoute = ({ children, allowedRoles = [] }) => {
      const auth = isAuthenticated();
      const role = getUserRole();

      if (!auth) {
        return <Navigate to="/login" replace />;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to={role === 'admin' ? '/dashboardAdmin' : '/dashboard'} replace />;
      }

      return children;
    };

    // Public Route component (accessible only when not authenticated)
    const PublicRoute = ({ children }) => {
      const auth = isAuthenticated();
      const role = getUserRole();

      if (auth) {
        return <Navigate to={role === 'admin' ? '/dashboardAdmin' : '/dashboard'} replace />;
      }

      return children;
    };

    return (
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root to appropriate dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {getUserRole() === 'admin' ? (
                  <Navigate to="/dashboardAdmin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="dashboardAdmin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="add"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AddUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EditUser />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <DashboardStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path="order"
            element={
              <ProtectedRoute>
                <OrderStock />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to appropriate dashboard */}
          <Route
            path="*"
            element={
              <Navigate to={getUserRole() === 'admin' ? '/dashboardAdmin' : '/dashboard'} replace />
            }
          />
        </Route>
      </Routes>
    );
  }

  export default AppRoutes;
