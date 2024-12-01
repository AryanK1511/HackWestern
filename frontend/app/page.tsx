'use client';

import { motion } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar/appSidebar';
import UploadForm from '@/components/UploadForm/UploadForm';

const Dashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className='p-4 pt-0 relative overflow-hidden'>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 25,
              duration: 0.8,
            }}
            className='text-left relative z-10 p-8'
          >
            <h1 className='text-6xl font-bold'>
              <span className='bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent'>
                Tin
              </span>{' '}
              Studio
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 25,
                delay: 0.5,
              }}
              className='mt-4 text-lg text-gray-700'
            >
              A powerful tool to test your code across multiple machines and
              gather comprehensive runtime statistics effortlessly ✨
            </motion.p>
          </motion.div>
          <UploadForm />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Dashboard;
