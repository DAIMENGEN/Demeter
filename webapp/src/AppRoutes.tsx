import {Route, Routes} from "react-router-dom";
import {AuthGuard} from "@Webapp/components";
import {LoginPage} from "@Webapp/pages/login-page";
import {RegisterPage} from "@Webapp/pages/register-page";
import {HomePage} from "@Webapp/pages/home-page";
import {HolidayCalendar} from "@Webapp/pages/home-page/components/holiday-calendar";
import {HomeContent} from "@Webapp/pages/home-page/components/home-content";

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
                </Route>
            </Routes>
        </AuthGuard>
    )
}
