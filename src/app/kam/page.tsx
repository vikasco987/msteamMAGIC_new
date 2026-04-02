// // src/app/kam/page.tsx
// "use client";

// import React from "react"; // Removed useEffect and useState
// import KamTableView from "../components/KamTable";
// import { useUser } from "@clerk/nextjs";

// export default function KamPage() {
//   const { user, isLoaded } = useUser();

//   if (!isLoaded) return <div className="p-6">Loading user...</div>;

//   const role = user?.publicMetadata?.role;

//   if (role !== "admin" && role !== "seller" && role !== "master") {
//     return (
//       <div className="p-6 text-red-500">
//         ⛔ Access Denied: You are not authorized to view this page.
//       </div>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gray-50 p-6">
//       <KamTableView />
//     </main>
//   );
// }0






















"use client";

import React from "react";
import KamTableView from "../components/KamTable";
import { useUser } from "@clerk/nextjs";

export default function KamPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div className="p-6">Loading user...</div>;

  const role = String(user?.publicMetadata?.role || "").toLowerCase();

   if (role !== "admin" && role !== "seller" && role !== "master" && role !== "tl") {
    return (
      <div className="p-6 text-red-500">
        ⛔ Access Denied: You are not authorized to view this page.
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <KamTableView />
    </main>
  );
}















// "use client";

// import React from "react";
// import { useUser } from "@clerk/nextjs";
// import KamTableView from "../components/KamTable";
// import SecondaryNavbar from "../components/SecondaryNavbar";

// export default function KamPage() {
//   const { user, isLoaded } = useUser();

//   if (!isLoaded) {
//     return <div className="p-6">Loading user...</div>;
//   }

//   const role = user?.publicMetadata?.role;

//   const isAuthorized = role === "admin" || role === "master";

//   return (
//     <main className="min-h-screen bg-gray-50">
//       <SecondaryNavbar />

//       {!isAuthorized ? (
//         <div className="p-6 text-red-500">
//           ⛔ Access Denied: You are not authorized to view this page.
//         </div>
//       ) : (
//         <div className="p-6">
//           <KamTableView />
//         </div>
//       )}
//     </main>
//   );
// }
