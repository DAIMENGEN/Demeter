import {Route, Routes} from "react-router-dom";
import {AuthGuard} from "@Webapp/components";
import {LoginPage} from "@Webapp/pages/login-page";
import {RegisterPage} from "@Webapp/pages/register-page";
import {HomePage} from "@Webapp/pages/home-page";
import {HolidayCalendar} from "@Webapp/pages/home-page/components/holiday-calendar";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content";
import {ProjectManagement} from "@Webapp/pages/home-page/components/project-management";
import {ProjectDetail} from "@Webapp/pages/home-page/components/project-management";

export const AppRoutes = () => {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/home" element={<HomePage/>}>
                    <Route index element={<HomeContent/>}/>
                    <Route path="holiday" element={<HolidayCalendar/>}/>
                    <Route path="project/:projectId" element={<ProjectDetail/>}/>
                    <Route path="project-management" element={<ProjectManagement/>}/>
                </Route>
            </Routes>
        </AuthGuard>
    )
}
