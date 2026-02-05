import {Route, Routes} from "react-router-dom";
import {AuthGuard} from "@Webapp/components";
import {LoginPage} from "@Webapp/pages/login-page";
import {RegisterPage} from "@Webapp/pages/register-page";

export const AppRoutes = () => {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
            </Routes>
        </AuthGuard>
    )
}
