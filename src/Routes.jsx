import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";

const Routes = () => {
    const router = createBrowserRouter(createRoutesFromElements(
        <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/edit-profile" element={<EditProfile />} />
        </Route>
    ));

    return (
        <RouterProvider router={router} />
    );
}

export default Routes;