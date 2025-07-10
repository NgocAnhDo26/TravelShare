import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

interface Itinerary {
	id: string;
	title: string;
	description: string;
	date: string;
	startTime: string;
	endTime: string;
	location: string;
	category:
		| "attraction"
		| "restaurant"
		| "accommodation"
		| "transportation"
		| "activity"
		| "shopping"
		| "other";
	notes?: string;
}

// Mock data - replace with actual data fetching
const mockItineraries: Itinerary[] = [
	{
		id: "1",
		title: "Visit Eiffel Tower",
		description: "Iconic landmark and symbol of Paris",
		date: "2025-07-15",
		startTime: "09:00",
		endTime: "11:00",
		location: "Champ de Mars, Paris",
		category: "attraction",
		notes: "Book tickets in advance",
	},
	{
		id: "2",
		title: "Lunch at Le Comptoir",
		description: "Traditional French cuisine",
		date: "2025-07-15",
		startTime: "12:30",
		endTime: "14:00",
		location: "9 Carrefour de l'Odéon, Paris",
		category: "restaurant",
	},
	{
		id: "3",
		title: "Louvre Museum",
		description: "World's largest art museum",
		date: "2025-07-15",
		startTime: "15:00",
		endTime: "18:00",
		location: "Rue de Rivoli, Paris",
		category: "attraction",
		notes: "Focus on Mona Lisa and Venus de Milo",
	},
	{
		id: "4",
		title: "Seine River Cruise",
		description: "Evening cruise along the Seine",
		date: "2025-07-16",
		startTime: "19:00",
		endTime: "21:00",
		location: "Port de la Bourdonnais, Paris",
		category: "activity",
	},
];

const getCategoryColor = (category: string) => {
	const colors = {
		attraction: "bg-gray-100 text-black border-gray-300",
		restaurant: "bg-gray-200 text-black border-gray-400",
		accommodation: "bg-gray-300 text-black border-gray-500",
		transportation: "bg-gray-100 text-black border-gray-300",
		activity: "bg-gray-200 text-black border-gray-400",
		shopping: "bg-gray-100 text-black border-gray-300",
		other: "bg-gray-200 text-black border-gray-400",
	};
	return colors[category as keyof typeof colors] || colors.other;
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const groupItinerariesByDate = (itineraries: Itinerary[]) => {
	const sorted = [...itineraries].sort((a, b) => {
		const dateCompare =
			new Date(a.date).getTime() - new Date(b.date).getTime();
		if (dateCompare !== 0) return dateCompare;
		return a.startTime.localeCompare(b.startTime);
	});

	const grouped: Record<string, Itinerary[]> = {};
	sorted.forEach((item) => {
		if (!grouped[item.date]) {
			grouped[item.date] = [];
		}
		grouped[item.date].push(item);
	});

	return grouped;
};

export default function ItineraryPage() {
	const groupedItineraries = groupItinerariesByDate(mockItineraries);
	const navigate = useNavigate();
	return (
		<>
			{/* <Header></Header> */}
			<div className="min-h-screen bg-white py-8 mt-2">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div>
							<h1 className="text-3xl font-bold text-black">
								Trip Itinerary
							</h1>
							<p className="text-gray-600 mt-1">
								Your planned activities and schedule
							</p>
						</div>
						<Button
							className="bg-black text-white hover:bg-gray-800 border-black cursor-pointer"
							onClick={() => {
								navigate("/itinerary/add", { replace: true });
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Activity
						</Button>
					</div>

					{/* Itinerary Cards */}
					<div className="space-y-8">
						{Object.entries(groupedItineraries).map(
							([date, itineraries]) => (
								<div key={date}>
									{/* Date Header */}
									<div className="flex items-center mb-4">
										<Calendar className="w-5 h-5 text-black mr-2" />
										<h2 className="text-xl font-semibold text-black">
											{formatDate(date)}
										</h2>
										<div className="flex-1 h-px bg-gray-300 ml-4"></div>
									</div>

									{/* Day's Activities */}
									<div className="space-y-4 ml-7">
										{itineraries.map((item) => (
											<Card
												key={item.id}
												className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<CardTitle className="text-lg font-medium text-black">
																	{item.title}
																</CardTitle>
																<Badge
																	className={getCategoryColor(
																		item.category
																	)}
																>
																	{
																		item.category
																	}
																</Badge>
															</div>
															{item.description && (
																<p className="text-gray-600 text-sm">
																	{
																		item.description
																	}
																</p>
															)}
														</div>
														<div className="flex gap-2 ml-4">
															<Button
																variant="outline"
																size="sm"
																className="border-gray-300 hover:bg-gray-50 cursor-pointer"
															>
																<Edit className="w-4 h-4" />
																{/* TODO: Add edit functionality */}
															</Button>
															<Button
																variant="outline"
																size="sm"
																className="border-gray-300 hover:bg-gray-50 text-red-600 hover:text-red-700 cursor-pointer"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													</div>
												</CardHeader>
												<CardContent className="pt-0">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
														<div className="flex items-center gap-2 text-gray-600">
															<Clock className="w-4 h-4" />
															<span>
																{item.startTime}{" "}
																- {item.endTime}
															</span>
														</div>
														<div className="flex items-center gap-2 text-gray-600">
															<MapPin className="w-4 h-4" />
															<span>
																{item.location}
															</span>
														</div>
													</div>
													{item.notes && (
														<div className="mt-3 p-3 bg-gray-50 rounded-md border">
															<p className="text-sm text-gray-700">
																<span className="font-medium">
																	Notes:
																</span>{" "}
																{item.notes}
															</p>
														</div>
													)}
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							)
						)}
					</div>

					{/* Empty State */}
					{Object.keys(groupedItineraries).length === 0 && (
						<div className="text-center py-12">
							<Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No itineraries yet
							</h3>
							<p className="text-gray-600 mb-4">
								Start planning your trip by adding your first
								activity.
							</p>
							<Button className="bg-black text-white hover:bg-gray-800">
								<Plus className="w-4 h-4 mr-2" />
								Add Your First Activity
							</Button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
