import {Route, Routes} from "react-router-dom";
import {LoginPage} from "@Webapp/pages/login-page/login-page.tsx";
import {RegisterPage} from "@Webapp/pages/register-page/register-page.tsx";
import {HomePage} from "@Webapp/pages/home-page/home-page.tsx";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content/home-content.tsx";
import {Calendar} from "@Webapp/components/calendar";
import {ProjectManagement} from "@Webapp/components/project-management";
import {ProtectedRoute} from "@Webapp/components/protected-route";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/home" element={<HomePage/>}>
                <Route index element={<HomeContent/>}/>
                <Route path="project-management" element={<ProtectedRoute><ProjectManagement/></ProtectedRoute>}/>
                <Route path="calendar" element={<ProtectedRoute><Calendar/></ProtectedRoute>}/>
            </Route>
        </Routes>
    )
}

