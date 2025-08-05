import { Bell, Bookmark, Search, Home, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, NavLink } from 'react-router-dom';
import { NavUser } from './NavUser';

// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Explore',
    url: '/explore',
    icon: Search,
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
  },
  {
    title: 'Bookmarks',
    url: '/bookmarks',
    icon: Bookmark,
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className='bg-white'>
        <Link to='/'>
          <img
            src='/logo_title.png'
            alt='Logo'
            className='h-14 my-2 ml-3 mb-2'
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className='flex-1 p-4 bg-white'>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className='cursor-pointer'>
              <NavLink to={item.url}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    className={`w-full h-12 flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/25'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className='flex items-center w-full'>
                      <item.icon className='w-5 h-5' />
                      <span
                        className={`text-md ${isActive ? 'font-bold' : 'font-medium text-gray-500'}`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className='bg-white'>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
