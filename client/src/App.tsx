import RegisterPage from "./route/register/page";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
	return (
		<>
			<div>
				<Toaster />
			</div>
			<div className="flex h-screen w-full items-center justify-center">
				<RegisterPage />
			</div>
		</>
	);
}

export default App;
