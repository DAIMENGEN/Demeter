import {Navigate, Route, Routes} from "react-router-dom";
import {AuthGuard} from "@Webapp/components";
import {LoginPage} from "@Webapp/pages/login-page";
import {RegisterPage} from "@Webapp/pages/register-page";
import {HomePage} from "@Webapp/pages/home-page";
import {HolidayCalendar} from "@Webapp/pages/home-page/components/holiday-calendar";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content";
import {ProjectDetail, ProjectManagement} from "@Webapp/pages/home-page/components/project-management";
import {OrganizationManagement} from "@Webapp/pages/home-page/components/organization-management";
import {UserManagement} from "@Webapp/pages/home-page/components/organization-management/components/user-management";
import {
    DepartmentManagement
} from "@Webapp/pages/home-page/components/organization-management/components/department-management";
import {TeamManagement} from "@Webapp/pages/home-page/components/organization-management/components/team-management";

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
                    <Route path="organization-management" element={<OrganizationManagement/>}>
                        <Route index element={<Navigate to="users" replace/>}/>
                        <Route path="users" element={<UserManagement/>}/>
                        <Route path="departments" element={<DepartmentManagement/>}/>
                        <Route path="teams" element={<TeamManagement/>}/>
                    </Route>
                </Route>
            </Routes>
        </AuthGuard>
    )
}
