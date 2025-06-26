// Edit itinerary will be a copy of add itinerary page with pre-filled data
import React, { useState } from "react";
import Header from "@/components/header";
import { Calendar, Clock, MapPin, Plus, X } from "lucide-react";

export default function AddItineraryPage() {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		date: "",
		startTime: "",
		endTime: "",
		location: "",
		category: "attraction",
		notes: "",
	});

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Handle form submission
		console.log("Itinerary data:", formData);
	};

	return (
		<>
            <Header />
			<div className="min-h-screen bg-white py-8 mt-10">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
						<div className="px-6 py-4 bg-black">
							<h1 className="text-2xl font-bold text-white">
								Add New Itinerary
							</h1>
							<p className="text-gray-300 mt-1">
								Plan your next adventure activity
							</p>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-6">
							{/* Title */}
							<div>
								<label
									htmlFor="title"
									className="block text-sm font-medium text-black mb-2"
								>
									Activity Title *
								</label>
								<input
									type="text"
									id="title"
									name="title"
									value={formData.title}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									placeholder="Enter activity title"
									required
								/>
							</div>

							{/* Description */}
							<div>
								<label
									htmlFor="description"
									className="block text-sm font-medium text-black mb-2"
								>
									Description
								</label>
								<textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									placeholder="Describe your activity"
								/>
							</div>

							{/* Date and Time */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label
										htmlFor="date"
										className="block text-sm font-medium text-black mb-2"
									>
										Date *
									</label>
									<input
										type="date"
										id="date"
										name="date"
										value={formData.date}
										onChange={handleInputChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
										required
									/>
								</div>
								<div>
									<label
										htmlFor="startTime"
										className="block text-sm font-medium text-black mb-2"
									>
										Start Time
									</label>
									<input
										type="time"
										id="startTime"
										name="startTime"
										value={formData.startTime}
										onChange={handleInputChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									/>
								</div>
								<div>
									<label
										htmlFor="endTime"
										className="block text-sm font-medium text-black mb-2"
									>
										End Time
									</label>
									<input
										type="time"
										id="endTime"
										name="endTime"
										value={formData.endTime}
										onChange={handleInputChange}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									/>
								</div>
							</div>

							{/* Location */}
							<div>
								<label
									htmlFor="location"
									className="block text-sm font-medium text-black mb-2"
								>
									Location *
								</label>
								<input
									type="text"
									id="location"
									name="location"
									value={formData.location}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									placeholder="Enter location or address"
									required
								/>
							</div>

							{/* Category */}
							<div>
								<label
									htmlFor="category"
									className="block text-sm font-medium text-black mb-2"
								>
									Category
								</label>
								<select
									id="category"
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
								>
									<option value="attraction">
										Attraction
									</option>
									<option value="restaurant">
										Restaurant
									</option>
									<option value="accommodation">
										Accommodation
									</option>
									<option value="transportation">
										Transportation
									</option>
									<option value="activity">Activity</option>
									<option value="shopping">Shopping</option>
									<option value="other">Other</option>
								</select>
							</div>

							{/* Notes */}
							<div>
								<label
									htmlFor="notes"
									className="block text-sm font-medium text-black mb-2"
								>
									Additional Notes
								</label>
								<textarea
									id="notes"
									name="notes"
									value={formData.notes}
									onChange={handleInputChange}
									rows={2}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
									placeholder="Any additional information or special instructions"
								/>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<button
									type="submit"
									className="cursor-pointer flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition duration-200 flex items-center justify-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add to Itinerary
								</button>
								<button
									type="button"
									className="cursor-pointer flex-1 bg-white text-black py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition duration-200 flex items-center justify-center gap-2"
								>
									<X className="w-4 h-4" />
									Cancel
								</button>
							</div>
						</form>
					</div>

					{/* Preview Card */}
					{formData.title && (
						<div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
							<div className="px-6 py-4 bg-gray-50 border-b">
								<h2 className="text-lg font-semibold text-black">
									Preview
								</h2>
							</div>
							<div className="p-6">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="text-lg font-medium text-black">
											{formData.title}
										</h3>
										{formData.description && (
											<p className="text-gray-600 mt-1">
												{formData.description}
											</p>
										)}
										<div className="mt-2 space-y-1 text-sm text-gray-600">
											{formData.date && (
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													<span>
														{new Date(
															formData.date
														).toLocaleDateString()}
													</span>
												</div>
											)}
											{(formData.startTime ||
												formData.endTime) && (
												<div className="flex items-center gap-2">
													<Clock className="w-4 h-4" />
													<span>
														{formData.startTime} -{" "}
														{formData.endTime}
													</span>
												</div>
											)}
											{formData.location && (
												<div className="flex items-center gap-2">
													<MapPin className="w-4 h-4" />
													<span>
														{formData.location}
													</span>
												</div>
											)}
										</div>
									</div>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black capitalize border">
										{formData.category}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
