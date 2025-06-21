import RegisterPage from "./route/register/page";
import LoginPage from "./route/login/page";
import ForgotPasswordPage from "./route/forgot-password/page";
import ResetPasswordPage from "./route/reset-password/page";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
    return (
        <>
            <div>
                <Toaster />
            </div>
            <BrowserRouter>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path="/reset-password"
                        element={<ResetPasswordPage />}
                    ></Route>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
