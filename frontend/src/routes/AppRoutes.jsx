  import { Routes, Route} from "react-router-dom";
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

    return (
     

        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<DashboardLayout />}>
          <Route path="dashboardAdmin" element={<DashboardAdmin/>}/>
          <Route path="dashboard" element={<DashboardStaff/>}/>
          <Route path="/users" element={<UserList />} />
          <Route path="/add" element={<AddUser />} />
          <Route path="/edit/:id" element={<EditUser />} />
          <Route path="/order" element={<OrderStock />} />
          <Route path="/staff" element={<Staff />} />
         /</Route>
        </Routes>
    
    );
  }

  export default AppRoutes;
