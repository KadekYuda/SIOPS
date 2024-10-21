import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import UserList from "../components/Page/CrudUser/UserList";
import AddUser from "../components/Page/CrudUser/AddUser";
import EditUser from "../components/Page/CrudUser/EditUser";
import Login from "../components/Page/Home/Login";
import Home from '../components/Page/Home/Home';
import Headers from "../components/Page/Sidebar/Headers";
import SidebarAdmin from "../components/Page/Sidebar/admin/SidebarAdmin"; // Import SidebarAdmin
import Sidebars from "../components/Page/Sidebar/staff/Sidebars"; // Import SidebarStaff
import OrderStock from "../components/Page/Order/OrderStock";
import Staff from "../components/Page/Sidebar/staff/Staff";
import DashboardAdmin from "../components/Page/Sidebar/admin/DashboardAdmin";
import DashboardStaff from "../components/Page/Sidebar/staff/DashboardStaff";

function AppRoutes() {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarComponent, setSidebarComponent] = useState(null);
  const location = useLocation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Daftar path yang tidak memiliki sidebar
  const noSidebarRoutes = ["/", "/login", "/forgetpass"];

  // Periksa apakah halaman saat ini harus menampilkan sidebar
  const showSidebar = !noSidebarRoutes.includes(location.pathname.toLowerCase());

  useEffect(() => {
   
    const role = localStorage.getItem('role');
    if (role === 'admin') {
      setSidebarComponent(<SidebarAdmin isSidebarOpen={isSidebarOpen} />);
    } else if (role === 'staff') {
      setSidebarComponent(<Sidebars isSidebarOpen={isSidebarOpen} />);
    }
  }, [isSidebarOpen]);

  return (
    <div className={`${darkMode && "dark"}`}>
      <Headers toggleDarkMode={toggleDarkMode} darkMode={darkMode} toggleSidebar={toggleSidebar} />

      {showSidebar && sidebarComponent}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="dashboardAdmin" element={<DashboardAdmin/>}/>
        <Route path="dashboard" element={<DashboardStaff/>}/>
        <Route path="/users" element={<UserList />} />
        <Route path="/add" element={<AddUser />} />
        <Route path="/edit/:id" element={<EditUser />} />
        <Route path="/order" element={<OrderStock />} />
        <Route path="/staff" element={<Staff />} />
      </Routes>
    </div>
  );
}

export default AppRoutes;
