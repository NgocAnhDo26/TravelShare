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
import { useSocket } from '@/context/SocketProvider';
import { Badge } from '../ui/badge';

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
  const { unreadCount } = useSocket();
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='bg-white'>
        <Link to='/' className='block'>
          {/* Full title logo for expanded state */}
          <img
            src='/logo_title.png'
            alt='TravelShare'
            className='h-14 w-auto my-2 ml-3 mb-2 object-contain group-data-[collapsible=icon]:hidden'
          />
          {/* Square mark for collapsed (icon) state */}
          <img
            src='/logo.png'
            alt='TravelShare'
            className='hidden group-data-[collapsible=icon]:block h-10 w-10 my-2 mx-auto object-contain'
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu
          className='
            flex-1 p-4 bg-white
            group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4
            group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col
            group-data-[collapsible=icon]:items-center
          '
        >
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className='cursor-pointer'>
              <NavLink to={item.url}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    className={`w-full h-12 flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 
                      group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:gap-0 
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/25'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <div className='flex items-center justify-start w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:mx-auto'>
                      <item.icon className='w-5 h-5' />
                      <span
                        className={`text-md group-data-[collapsible=icon]:hidden ${isActive ? 'font-bold' : 'font-medium text-gray-500'}`}
                      >
                        {item.title}
                      </span>
                      {item.title === 'Notifications' && unreadCount > 0 && (
                        <Badge
                          variant='destructive'
                          className='ml-auto inline-flex items-center justify-center rounded-full text-xs shadow-sm border-none group-data-[collapsible=icon]:hidden'
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
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
