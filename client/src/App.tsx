import RegisterPage from "./route/register/page";
import LoginPage from "./route/login/page";
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
					<Route path="/" element={<LoginPage/>} />
					<Route path="*" element={<div>404 Not Found</div>} />
				</Routes>
			</BrowserRouter>
		</>
	);
}

export default App;
