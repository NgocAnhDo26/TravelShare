import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Heart, MessageCircle, Pencil, Repeat, UserPlusIcon } from 'lucide-react';
import type { Trip } from '@/types/trip';
/**
 * Renders the header section of the trip plan.
 */
const TripHeader: React.FC<{ trip: Trip, editMode?: boolean }> = ({ trip, editMode = false }) => (
    <>
        <div className="relative">
            <img
                src={trip.coverImage}
                alt="Trip cover image"
                className="w-full max-h-72 object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://placehold.co/1200x400/cccccc/ffffff?text=Image+Not+Found';
                }}
            />
        </div>
        <Card className="relative lg:mx-16 mx-10 bg-white px-6 pt-8 shadow-lg -mt-28 rounded-md">
            <div className="flex justify-between items-center">
                <h1 className="flex-1 text-4xl font-bold text-gray-800 text-left">{trip.title}</h1>
                {editMode && <Button variant="secondary" size="icon" className="size-8">
                    <Pencil />
                </Button>}
            </div>
            <p className="text-gray-600 text-left text-sm">{trip.description}</p>
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center text-gray-500">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{trip.startDate} - {trip.endDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {editMode ? (
                        <>
                            {trip.collaborators.map(user => (
                                user.avatarUrl ? (
                                    <img
                                        key={user.id}
                                        src={user.avatarUrl}
                                        alt={`${user.name}'s avatar`}
                                        className="w-9 h-9 rounded-full object-cover border-2 border-white"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=U';
                                        }}
                                    />
                                ) : (
                                    <div key={user.id} className="w-9 h-9 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm border-2 border-white">
                                        {user.initials}
                                    </div>
                                )
                            ))}
                            <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors border-2 border-white">
                                <UserPlusIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center">
                                <Button variant="ghost">
                                    <Heart />
                                    {trip.likes ?? 0}
                                </Button>
                                <Button variant="ghost">
                                    <MessageCircle />
                                    {trip.comments ?? 0}
                                </Button>
                                <Button className="ml-2">
                                    <Repeat />
                                    Remix
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    </>
);

export default TripHeader;