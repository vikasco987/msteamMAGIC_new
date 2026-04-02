// 'use client';

// import { ReactNode } from 'react';
// import ClientLayout from '../app/ClientLayout';

// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// // You can create one client instance per app session
// const queryClient = new QueryClient();

// export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <ClientLayout>
//         {children}
//       </ClientLayout>
//     </QueryClientProvider>
//   );
// }




// 'use client';

// import { ReactNode } from 'react';
// import ClientLayout from '../app/ClientLayout'; // ✅ correct path
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { TooltipProvider } from '@radix-ui/react-tooltip'; // ✅ import TooltipProvider

// const queryClient = new QueryClient();

// export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider> {/* ✅ wrap this around your layout */}
//         <ClientLayout>{children}</ClientLayout>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }















'use client';

import { ReactNode } from 'react';
import ClientLayout from '../app/ClientLayout'; // ✅ CORRECT PATH
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';

const queryClient = new QueryClient();

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClientLayout>{children}</ClientLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

