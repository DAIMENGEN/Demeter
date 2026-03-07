import {Navigate, Route, Routes} from "react-router-dom";
import {AdminGuard, AuthGuard, ErrorBoundary} from "@Webapp/components";
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
        <ErrorBoundary>
            <Routes>
                {/* 公开路由 */}
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>

                {/* 受保护路由：需要登录 */}
                <Route path="/home" element={
                    <AuthGuard><HomePage/></AuthGuard>
                }>
                    <Route index element={<HomeContent/>}/>
                    <Route path="holiday" element={<HolidayCalendar/>}/>
                    <Route path="project/:projectId" element={<ProjectDetail/>}/>
                    <Route path="project-management" element={<ProjectManagement/>}/>

                    {/* 管理后台路由：需要 admin/super_admin 角色 */}
                    <Route path="organization-management" element={
                        <AdminGuard><OrganizationManagement/></AdminGuard>
                    }>
                        <Route index element={<Navigate to="users" replace/>}/>
                        <Route path="users" element={<UserManagement/>}/>
                        <Route path="departments" element={<DepartmentManagement/>}/>
                        <Route path="teams" element={<TeamManagement/>}/>
                    </Route>
                </Route>
            </Routes>
        </ErrorBoundary>
    )
}
