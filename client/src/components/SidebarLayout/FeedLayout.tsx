import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export default function FeedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 h-screen overflow-auto'>
        <SidebarTrigger className='fixed' />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
