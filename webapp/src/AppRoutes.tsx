import {Route, Routes} from "react-router-dom";
import {LoginPage} from "@Webapp/pages/login-page/login-page.tsx";
import {RegisterPage} from "@Webapp/pages/register-page/register-page.tsx";
import {HomePage} from "@Webapp/pages/home-page/home-page.tsx";
import {HomeContent} from "@Webapp/pages/home-page/content/home-content.tsx";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/home" element={<HomePage/>}>
                <Route index element={<HomeContent/>}/>
            </Route>
        </Routes>
    )
}