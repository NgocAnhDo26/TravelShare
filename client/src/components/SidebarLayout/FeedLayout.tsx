import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export default function FeedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
