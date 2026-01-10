import {Route, Routes} from "react-router-dom";
import {LoginPage} from "@Webapp/pages/login-page/login-page.tsx";
import {RegisterPage} from "@Webapp/pages/register-page/register-page.tsx";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
        </Routes>
    )
}