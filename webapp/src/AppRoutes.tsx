import {Route, Routes} from "react-router-dom";
import {LoginPage} from "@Webapp/pages/login-page/login-page.tsx";
import {RegisterPage} from "@Webapp/pages/register-page/register-page.tsx";
import {HomePage} from "@Webapp/pages/home-page/home-page.tsx";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content/home-content.tsx";
import {AuthSessionGuard} from "@Webapp/components";
import {ProjectDetail, ProjectManagement} from "@Webapp/pages/home-page/components/project-management";
import {Calendar} from "@Webapp/pages/home-page/components/calendar";
import {HolidayPage} from "@Webapp/pages/holiday-page/holiday-page.tsx";
import {ResultPage} from "@Webapp/pages/result-page";
export const AppRoutes = () => {
    return (
        <AuthSessionGuard>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/result" element={<ResultPage/>}/>
                <Route path="/home" element={<HomePage/>}>
                    <Route index element={<HomeContent/>}/>
                    <Route path="project-management" element={<ProjectManagement/>}/>
                    <Route path="project/:projectId" element={<ProjectDetail/>}/>
                    <Route path="calendar" element={<Calendar/>}/>
                    <Route path="holiday" element={<HolidayPage/>}/>
                </Route>
            </Routes>
        </AuthSessionGuard>
    )
}
