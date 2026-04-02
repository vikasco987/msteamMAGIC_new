






// import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
// import ClientLayout from "./ClientLayout";
// import { ReactNode } from "react";
// import { Toaster } from "react-hot-toast";
// import * as Tooltip from '@radix-ui/react-tooltip';

// export const metadata = {
//   title: "MagicScale",
//   description: "Manage your team and tasks with Clerk + Next.js",
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <ClerkProvider>
//           <Tooltip.Provider delayDuration={200}>
//             <ClientLayout>
//               {children}
//               <Toaster position="top-right" /> {/* ✅ Toast visible globally */}
//             </ClientLayout>
//           </Tooltip.Provider>
//         </ClerkProvider>
//       </body>
//     </html>
//   );
// }







// import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
// import ClientLayout from "./ClientLayout";
// import { ReactNode } from "react";
// import { Toaster } from "react-hot-toast";
// import * as Tooltip from '@radix-ui/react-tooltip';

// export const metadata = {
//   title: "MagicScale",
//   description: "Manage your team and tasks with Clerk + Next.js",
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en" className="h-full">
//       <body className="flex h-screen overflow-hidden">
//         <ClerkProvider>
//           <Tooltip.Provider delayDuration={200}>
//             <ClientLayout>
//               {children}
//               <Toaster position="top-right" /> {/* ✅ Toast visible globally */}
//             </ClientLayout>
//           </Tooltip.Provider>
//         </ClerkProvider>
//       </body>
//     </html>
//   );
// }





// // src/app/layout.tsx
// import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
// import ClientLayout from "./ClientLayout"; // Assuming ClientLayout.tsx has "use client"
// import { ReactNode } from "react";
// import { Toaster } from "react-hot-toast";
// import * as Tooltip from '@radix-ui/react-tooltip';

// export const metadata = {
//   // ✅ Updated title to use a default and template for better SEO and clarity on sub-pages
//   title: {
//     default: "MagicScale", // Default title if a page doesn't specify its own
//     template: "%s | MagicScale", // Adds "| MagicScale" after page-specific titles (e.g., "Dashboard | MagicScale")
//   },
//   description: "Manage your team and tasks with Clerk + Next.js",
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en" className="h-full">
//       {/* The `body` tag structure with `h-screen overflow-hidden` is good for full-height layouts.
//         Ensure your ClientLayout (or components within it) handle scrolling if content exceeds screen height.
//       */}
//       <body className="flex h-screen overflow-hidden">
//         <ClerkProvider>
//           <Tooltip.Provider delayDuration={200}> {/* Tooltip provider for consistent tooltip behavior */}
//             <ClientLayout> {/* ClientLayout is likely where your nav/sidebar lives, which needs client-side features */}
//               {children} {/* This is where your page content will be rendered */}
//               <Toaster position="top-right" /> {/* Global toast notifications */}
//             </ClientLayout>
//           </Tooltip.Provider>
//         </ClerkProvider>
//       </body>
//     </html>
//   );
// }








// // src/app/layout.tsx
// import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
// import ClientLayout from "./ClientLayout";
// import { ReactNode } from "react";
// import { Toaster } from "react-hot-toast";
// import * as Tooltip from "@radix-ui/react-tooltip";

// export const metadata = {
//   title: {
//     default: "MagicScale",
//     template: "%s | MagicScale",
//   },
//   description: "Manage your team and tasks with Clerk + Next.js",
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en" className="h-full">
//       <body className="flex h-screen overflow-hidden">
//         <ClerkProvider>
//           <Tooltip.Provider delayDuration={200}>
//             {/* ✅ ClientLayout expects only serializable children */}
//             <ClientLayout>
//               {children}
//               <Toaster position="top-right" />
//             </ClientLayout>
//           </Tooltip.Provider>
//         </ClerkProvider>
//       </body>
//     </html>
//   );
// }





// // src/app/layout.tsx
// import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
// import { ReactNode } from "react";
// import * as Tooltip from "@radix-ui/react-tooltip";
// import dynamic from "next/dynamic";
// import { Toaster } from "react-hot-toast";

// // 🧠 Dynamically import ClientLayout (client-side only)
// const ClientLayout = dynamic(() => import("./ClientLayout"), { ssr: false });

// export const metadata = {
//   title: {
//     default: "MagicScale",
//     template: "%s | MagicScale",
//   },
//   description: "Manage your team and tasks with Clerk + Next.js",
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en" className="h-full">
//       <body className="flex h-screen overflow-hidden">
//         <ClerkProvider>
//           <Tooltip.Provider delayDuration={200}>
//             {/* ✅ Wrap client-only layout dynamically */}
//             <ClientLayout>
//               {children}
//               <Toaster position="top-right" />
//             </ClientLayout>
//           </Tooltip.Provider>
//         </ClerkProvider>
//       </body>
//     </html>
//   );
// }












// // ❌ DO NOT USE dynamic() here, it's not allowed with ssr: false in app/layout.tsx

// import './globals.css';
// import { ReactNode } from 'react';
// import ClientLayoutWrapper from '../components/ClientLayoutWrapper'; // adjust path

// export const metadata = {
//   title: {
//     default: 'MagicScale',
//     template: '%s | MagicScale',
//   },
//   description: 'Manage your team and tasks with Clerk + Next.js',
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en" className="h-full">
//       <body className="flex h-screen overflow-hidden">
//         <ClientLayoutWrapper>
//           {children}
//         </ClientLayoutWrapper>
//       </body>
//     </html>
//   );
// }











// // app/layout.tsx

// import './globals.css';
// import { ReactNode } from 'react';
// import { ClerkProvider } from '@clerk/nextjs';
// import ClientLayoutWrapper from '../components/ClientLayoutWrapper';

// export const metadata = {
//   title: {
//     default: 'MagicScale',
//     template: '%s | MagicScale',
//   },
//   description: 'Manage your team and tasks with Clerk + Next.js',
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <ClerkProvider>
//       <html lang="en" className="h-full">
//         <body className="flex h-screen overflow-hidden">
//           <ClientLayoutWrapper>
//             {children}
//           </ClientLayoutWrapper>

//           {/* ✅ Floating Portal Root for ReactDOM.createPortal */}
//           <div id="portal-root" />
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }














// // app/layout.tsx
// import './globals.css';
// import { ReactNode } from 'react';
// import { ClerkProvider } from '@clerk/nextjs';
// import ClientLayoutWrapper from '../components/ClientLayoutWrapper';
// import { clearOldClerkEnvironment } from '@/app/components/clearOldClerkEnv';


// // ✅ Clear outdated Clerk environment BEFORE ClerkProvider loads
// if (typeof window !== 'undefined') {
//   clearOldClerkEnvironment();
// }

// export const metadata = {
//   title: {
//     default: 'MagicScale',
//     template: '%s | MagicScale',
//   },
//   description: 'Manage your team and tasks with Clerk + Next.js',
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
//       <html lang="en" className="h-full">
//         <body className="flex h-screen overflow-hidden">
//           <ClientLayoutWrapper>
//             {children}
//           </ClientLayoutWrapper>

//           {/* ✅ Floating Portal Root for ReactDOM.createPortal */}
//           <div id="portal-root" />
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }

















// src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import ClientLayoutWrapper from '../components/ClientLayoutWrapper';
import { clearOldClerkEnvironment } from '@/app/components/clearOldClerkEnv';

if (typeof window !== 'undefined') {
  clearOldClerkEnvironment(); // ✅ Run before ClerkProvider
}

export const metadata = {
  title: {
    default: 'MagicScale',
    template: '%s | MagicScale',
  },
  description: 'Manage your team and tasks with Clerk + Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className="h-full">
        <body className="flex h-screen overflow-hidden">
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <div id="portal-root" />
        </body>
      </html>
    </ClerkProvider>
  );
}
