import { FloatingInput, FloatingLabel } from "@/components/floating-input";
import DateRangePicker from "@/components/date-picker/date-range-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";

function TripPlanningContent() {
	return (
		<div className="flex h-full w-full items-center justify-start flex-col">
			<h1 className="text-2xl font-bold">Plan a trip</h1>
			<div className="flex flex-col items-center justify-center mt-4">
				<div className="relative w-96 mb-4">
					<FloatingInput
						id="Destination"
						type="text"
						autoComplete="off"
						required
						className="w-96 h-12"
					/>
					<FloatingLabel htmlFor="Destination">
						Where to?
					</FloatingLabel>
				</div>
				<div className="relative mb-4">
					<Label htmlFor="dateRange" className="block mb-2">
            Select Date Range
          </Label>
					<DateRangePicker
						id="dateRange"
						className="w-full"
					></DateRangePicker>
				</div>
				<Button className="w-96 h-12 rounded-3xl cursor-pointer">
					Plan Trip
				</Button>
			</div>
		</div>
	);
}

export default function TripPlanningPage() {
	return (
		<div className="flex flex-col h-screen">
			<Header />
			<div className="flex-1 overflow-y-auto mt-20">
				<TripPlanningContent />
			</div>
		</div>
	);
}
