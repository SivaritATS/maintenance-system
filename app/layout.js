import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MaintenanceProvider } from './context/MaintenanceContext';
import RoleSwitcher from './components/RoleSwitcher_login';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UniFix - University Maintenance",
  description: "University Maintenance System for Users, Admins, and Technicians",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="corporate">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MaintenanceProvider>
          {children}
          {/* Debug Role Switcher - Always visible for now as requested */}
          {/* <RoleSwitcher /> */}
        </MaintenanceProvider>
      </body>
    </html>
  );
}
