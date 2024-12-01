'use client';

import * as React from 'react';
import { SquareTerminal, BarChart } from 'lucide-react';

import { NavMain } from '@/components/Sidebar/navMain';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { TeamLogo } from './teamLogo';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: SquareTerminal,
    },
    {
      title: 'Metrics',
      url: '/metrics',
      icon: BarChart,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
