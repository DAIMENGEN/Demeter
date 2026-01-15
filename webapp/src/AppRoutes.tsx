import {Route, Routes} from "react-router-dom";
import {LoginPage} from "@Webapp/pages/login-page/login-page.tsx";
import {RegisterPage} from "@Webapp/pages/register-page/register-page.tsx";
import {HomePage} from "@Webapp/pages/home-page/home-page.tsx";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content/home-content.tsx";
import {Calendar, ProjectManagement, ProjectDetail, AuthSessionGuard} from "@Webapp/components";

export const AppRoutes = () => {
    return (
        <AuthSessionGuard>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/home" element={<HomePage/>}>
                    <Route index element={<HomeContent/>}/>
                    <Route path="project-management" element={<ProjectManagement/>}/>
                    <Route path="project/:id" element={<ProjectDetail/>}/>
                    <Route path="calendar" element={<Calendar/>}/>
                </Route>
            </Routes>
        </AuthSessionGuard>
    )
}
