import RegisterPage from "./route/register/page";
import LoginPage from "./route/login/page";
import ForgotPasswordPage from "./route/forgot-password/page";
import ResetPasswordPage from "./route/reset-password/page";
import UserProfilePage from "./route/UserProfilePage/page";
import OtherProfilePage from "./route/OtherProfilePage/page";
import TripPlanningPage from "./route/trip-planning/page";
import ItineraryPage from "./route/itinerary/page";
import AddItineraryPage from "./route/add-itinerary/page";
import EditItineraryPage from "./route/edit-itinerary/page";
import NotFound from "./utils/404";
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
					<Route
						path="/UserProfilePage"
						element={<UserProfilePage />}
					></Route>
					<Route
						path="/OtherProfilePage"
						element={<OtherProfilePage />}
					></Route>
					<Route path="/" element={<LoginPage />} />
					<Route path="/plan/create" element={<TripPlanningPage />} />
					<Route
						path="/itinerary/add"
						element={<AddItineraryPage></AddItineraryPage>}
					></Route>
					<Route
						path="/itinerary/edit"
						element={<EditItineraryPage></EditItineraryPage>}
					></Route>
					<Route
						path="/itinerary"
						element={<ItineraryPage></ItineraryPage>}
					></Route>
					{/* Test route for components */}
					<Route
						path="/test"
						element={<ItineraryPage></ItineraryPage>}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</>
	);
}

export default App;
