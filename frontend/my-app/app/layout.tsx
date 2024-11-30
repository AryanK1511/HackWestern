import React from 'react';
import Sidebar from '../components/Sidebar';
import { ThemeProvider } from '@/components/tempolabs/theme-provider';
import './globals.css';
import './layout.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="app-container">
                        <Sidebar />
                        <div className="main-content">
                            {children}
                        </div>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
