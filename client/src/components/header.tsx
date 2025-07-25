import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    User,
    Search,
    Settings,
    LogOut,
    Heart,
    Calendar,
    Menu, // Import Menu icon for hamburger
    // X, // Import X icon for closing sheet (optional, but good for accessibility)
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"; // Import Sheet components
import API from "../utils/axiosInstance";
import { toast } from "react-hot-toast";

const Header: React.FC = () => {
    const navigate = useNavigate();

    function handleLogout() {
        API.post("/auth/logout")
            .then(() => {
                toast.success("Logged out successfully!");
                navigate("/");
            })
            .catch((error) => {
                console.error("Logout failed:", error);
                toast.error("Failed to log out. Please try again.");
            });
    }

    // Mock user data - replace with actual user state/context
    const user = {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        avatar: "https://placehold.co/32x32/FF6347/FFFFFF?text=SJ", // Sử dụng placeholder image
        initials: "SJ",
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Điều chỉnh container để có padding phù hợp trên mobile và luôn hiển thị logo */}
            {/* Sử dụng px-4 trên mobile (mặc định) và sm:px-6 md:px-8 cho màn hình lớn hơn */}
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
                {/* Logo - Luôn hiển thị, không có lớp ẩn */}
                <div className="flex items-center space-x-2">
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">TravelShare</span>
                </div>

                {/* Desktop Navigation (hidden on mobile) */}
                <NavigationMenu className="hidden md:flex"> {/* Hide on screens smaller than 'md' */}
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/"
                                className={navigationMenuTriggerStyle()}
                            >
                                Home
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/destinations"
                                className={navigationMenuTriggerStyle()}
                            >
                                Travel Itinerary
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/experiences"
                                className={navigationMenuTriggerStyle()}
                            >
                                Hotels
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink
                                href="/trips"
                                className={navigationMenuTriggerStyle()}
                            >
                                Deals
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Search, Profile, and Mobile Navigation (Hamburger Menu) */}
                {/* Đảm bảo các phần tử này nằm trong một flex container để kiểm soát bố cục trên mobile */}
                <div className="flex items-center space-x-2 sm:space-x-4"> {/* Giảm space-x trên mobile */}
                    {/* Search Input (hidden on mobile, replaced by icon) */}
                    <div className="relative hidden md:block"> {/* Hide on screens smaller than 'md' */}
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search destinations..."
                            className="pl-8 w-64"
                        />
                    </div>

                    {/* Mobile Search Icon (shown on mobile) */}
                    {/* Chỉ hiển thị trên mobile, và nằm cạnh menu hamburger/avatar */}
                    <Button variant="ghost" size="icon" className="md:hidden"> {/* Show only on screens smaller than 'md' */}
                        <Search className="h-6 w-6" />
                        <span className="sr-only">Search</span>
                    </Button>

                    {/* User Profile - Always visible */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-8 w-8 rounded-full"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                        onError={(e) => {
                                            // Fallback to placeholder if image fails to load
                                            e.currentTarget.src = `https://placehold.co/32x32/FF6347/FFFFFF?text=${user.initials}`;
                                        }}
                                    />
                                    <AvatarFallback>
                                        {user.initials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user.name}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>My Bookings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/favorites')}>
                                <Heart className="mr-2 h-4 w-4" />
                                <span>Favorites</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Navigation (Hamburger Menu) - Đặt cuối cùng để nó nằm ở rìa phải trên mobile */}
                    <div className="md:hidden flex items-center"> {/* Show only on screens smaller than 'md' */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-2"> {/* Thêm ml-2 để có khoảng cách với avatar/search icon */}
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center space-x-2">
                                        <MapPin className="h-6 w-6 text-primary" />
                                        <span>TravelShare</span>
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">
                                        Main navigation menu for TravelShare
                                    </SheetDescription>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 mt-8">
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/')}>
                                        <MapPin className="mr-2 h-4 w-4" /> Home
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/destinations')}>
                                        <Calendar className="mr-2 h-4 w-4" /> Travel Itinerary
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/experiences')}>
                                        <Heart className="mr-2 h-4 w-4" /> Hotels
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/trips')}>
                                        <Search className="mr-2 h-4 w-4" /> Deals
                                    </Button>
                                    {/* Add more menu items if needed, e.g., Profile, Settings */}
                                    <DropdownMenuSeparator />
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/profile')}>
                                        <User className="mr-2 h-4 w-4" /> Profile
                                    </Button>
                                    <Button variant="ghost" className="justify-start" onClick={() => navigate('/settings')}>
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </Button>
                                    <Button variant="ghost" className="justify-start text-red-500 hover:text-red-600" onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" /> Log out
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
