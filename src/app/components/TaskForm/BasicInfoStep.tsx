// import React from "react";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   teamMembers: TeamMember[];
//   activeTab: "license" | "swiggy" | "zomato";
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: "license" | "swiggy" | "zomato") => void;
// }

// export default function BasicInfoStep({
//   title,
//   assigneeId,
//   teamMembers,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   return (
//     <div className="space-y-4">
//       {/* Task Title */}
//       <input
//         type="text"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="📝 Task Title"
//         className="w-full border border-purple-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       />

//       {/* Assign To */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>

//       {/* Tabs for onboarding types */}
//       <div className="flex gap-2 justify-center mt-4">
//         {["license", "swiggy", "zomato"].map((tab) => (
//           <button
//             type="button"
//             key={tab}
//             onClick={() => setActiveTab(tab as "license" | "swiggy" | "zomato")}
//             className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 ${
//               activeTab === tab
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//             }`}
//           >
//             {tab === "license"
//               ? "🧾 License"
//               : tab === "swiggy"
//               ? "🍔 Swiggy"
//               : "🍽️ Zomato"}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }









// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: "license" | "swiggy" | "zomato";
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: "license" | "swiggy" | "zomato") => void;
// }

// export default function BasicInfoStep({
//   title,
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   return (
//     <div className="space-y-4">
//       {/* Task Title */}
//       <input
//         type="text"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="📝 Task Title"
//         className="w-full border border-purple-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       />

//       {/* Assign To */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>

//       {/* Tabs for onboarding types */}
//       <div className="flex gap-2 justify-center mt-4">
//         {["license", "swiggy", "zomato"].map((tab) => (
//           <button
//             type="button"
//             key={tab}
//             onClick={() => setActiveTab(tab as "license" | "swiggy" | "zomato")}
//             className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 ${
//               activeTab === tab
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//             }`}
//           >
//             {tab === "license"
//               ? "🧾 License"
//               : tab === "swiggy"
//               ? "🍔 Swiggy"
//               : "🍽️ Zomato"}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }











// "use client";

// import React from "react";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: "license" | "swiggy" | "zomato";
//   teamMembers: TeamMember[]; // ✅ Now coming from parent
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: "license" | "swiggy" | "zomato") => void;
// }

// export default function BasicInfoStep({
//   title,
//   assigneeId,
//   activeTab,
//   teamMembers,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   return (
//     <div className="space-y-4">
//       {/* 📝 Task Title */}
//       <input
//         type="text"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="📝 Task Title"
//         className="w-full border border-purple-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       />

//       {/* 👤 Assign To */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>

//       {/* 🔄 Tabs for Onboarding Type */}
//       <div className="flex gap-2 justify-center mt-4">
//         {["license", "swiggy", "zomato"].map((tab) => (
//           <button
//             key={tab}
//             type="button"
//             onClick={() => setActiveTab(tab as "license" | "swiggy" | "zomato")}
//             className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 ${
//               activeTab === tab
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//             }`}
//           >
//             {tab === "license"
//               ? "🧾 License"
//               : tab === "swiggy"
//               ? "🍔 Swiggy"
//               : "🍽️ Zomato"}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }





// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: "license" | "swiggy" | "zomato";
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: "license" | "swiggy" | "zomato") => void;
// }

// export default function BasicInfoStep({
//   title,
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   return (
//     <div className="space-y-4">
//       {/* Task Title */}
//       <input
//         type="text"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="📝 Task Title"
//         className="w-full border border-purple-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       />

//       {/* Assign To */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>

//       {/* Tabs for onboarding types */}
//       <div className="flex gap-2 justify-center mt-4">
//         {["license", "swiggy", "zomato"].map((tab) => (
//           <button
//             type="button"
//             key={tab}
//             onClick={() => setActiveTab(tab as "license" | "swiggy" | "zomato")}
//             className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors duration-200 ${
//               activeTab === tab
//                 ? "bg-purple-600 text-white shadow-sm"
//                 : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//             }`}
//           >
//             {tab === "license"
//               ? "🧾 License"
//               : tab === "swiggy"
//               ? "🍔 Swiggy"
//               : "🍽️ Zomato"}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }











// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// // const TASK_CATEGORIES = [
// //   { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
// //   { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
// //   { label: "🧾 Food License", value: "Food License" },
// //   { label: "📸 Photo Upload", value: "Photo Upload" },
// //   { label: "📂 Account Handling", value: "Account Handling" },
// // ];

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "Zomato Onboarding" },
//   { label: "🍔 Swiggy Onboarding", value: "Swiggy Onboarding" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "Zomato + Swiggy Combo" },
//   { label: "🧾 Food License", value: "Food License" },
//   { label: "📸 Photo Upload", value: "Photo Upload" },
//   { label: "📂 Account Handling", value: "Account Handling" },
//    // ✅ Combo option
// ];


// export default function BasicInfoStep({
//   title,
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   return (
//     <div className="space-y-4">
//       {/* 🔽 Task Category Dropdown (instead of title input) */}
//       <select
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* 👤 Assign To Dropdown */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>

   
//     </div>
//   );
// }







// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
// ];

// export default function BasicInfoStep({
//   // title,
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   return (
//     <div className="space-y-4">
//       {/* Task Category Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const titleOption = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(titleOption?.label || "");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Assign To Dropdown */}
//       <select
//         value={assigneeId}
//         onChange={(e) => setAssigneeId(e.target.value)}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">👤 Assign to...</option>
//         {teamMembers.map((member) => (
//           <option key={member.id} value={member.id}>
//             {member.name || member.email} ({member.email})
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }







// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//    assigneeId: string;
//   // assigneeIds: string[];
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   // setAssigneeIds: (val: string[]) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   return (
//     <div className="space-y-4">
//       {/* Service Type Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const titleOption = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(titleOption?.label || "");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Searchable Assignee Dropdown */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />
//     </div>
//   );
// }













// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   return (
//     <div className="space-y-4">
//       {/* Service Type Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const titleOption = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(titleOption?.label || selected);
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Searchable Assignee Dropdown */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />
//     </div>
//   );
// }



















// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// // Dummy License Form – replace with real one
// function LicenseForm() {
//   return (
//     <div className="p-4 mt-4 border border-blue-300 bg-blue-50 rounded-lg">
//       <h3 className="font-bold text-blue-800 mb-2">🧾 License Form</h3>
//       <p className="text-sm text-gray-700">Fill in license-specific information here.</p>
//     </div>
//   );
// }

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [customService, setCustomService] = useState(""); // User-typed custom title

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };
//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   const isCustomOther = activeTab === "other";
//   const showLicenseForm =
//     (isCustomOther && customService.toLowerCase().includes("license")) ||
//     activeTab === "license";

//   return (
//     <div className="space-y-4">
//       {/* Service Type Selection */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const matched = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(matched?.label || "");
//           if (selected !== "other") setCustomService("");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Custom Title Input – only for 'Other' */}
//       {isCustomOther && (
//         <input
//           value={customService}
//           onChange={(e) => {
//             const title = e.target.value;
//             setCustomService(title);
//             setTitle(title);
//           }}
//           placeholder="✍️ Type your own task title..."
//           className="w-full border border-purple-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         />
//       )}

//       {/* Assignee Selector */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />

//       {/* License Form (conditionally shown) */}
//       {showLicenseForm && <LicenseForm />}
//     </div>
//   );
// }







// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// // Dummy License Form – replace with your actual component
// function LicenseForm() {
//   return (
//     <div className="p-4 mt-4 border border-blue-300 bg-blue-50 rounded-lg">
//       <h3 className="font-bold text-blue-800 mb-2">🧾 License Form</h3>
//       <p className="text-sm text-gray-700">Fill in license-specific information here.</p>
//     </div>
//   );
// }

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [customService, setCustomService] = useState("");

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   const isCustom = activeTab === "other";
//   const showLicenseForm = activeTab === "license" || isCustom;

//   return (
//     <div className="space-y-4">
//       {/* Service Type Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const matched = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(matched?.label || selected);
//           if (selected !== "other") setCustomService("");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Custom Input Only for 'Other' */}
//       {isCustom && (
//         <input
//           value={customService}
//           onChange={(e) => {
//             const title = e.target.value;
//             setCustomService(title);
//             setTitle(title);
//           }}
//           placeholder="✍️ Enter your custom task title..."
//           className="w-full border border-purple-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         />
//       )}

//       {/* Searchable Assignee Dropdown */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />

//       {/* License Form: only for 'license' and 'other' */}
//       {showLicenseForm && <LicenseForm />}
//     </div>
//   );
// }















// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// // Dummy License Form – replace with your actual component
// function LicenseForm() {
//   return (
//     <div className="p-4 mt-4 border border-blue-300 bg-blue-50 rounded-lg">
//       <h3 className="font-bold text-blue-800 mb-2">🧾 License Form</h3>
//       <p className="text-sm text-gray-700">Fill in license-specific information here.</p>
//     </div>
//   );
// }

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: string;
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: string) => void;
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [customService, setCustomService] = useState("");

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   const isCustom = activeTab === "other";
//   const showLicenseForm = activeTab === "license" || isCustom;

//   return (
//     <div className="space-y-4">
//       {/* Service Type Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value;
//           setActiveTab(selected);
//           const matched = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(matched?.label || selected);
//           if (selected !== "other") setCustomService("");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Custom Input Only for 'Other' */}
//       {isCustom && (
//         <input
//           value={customService}
//           onChange={(e) => {
//             const title = e.target.value;
//             setCustomService(title);
//             setTitle(title);
//           }}
//           placeholder="✍️ Enter your custom task title..."
//           className="w-full border border-purple-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         />
//       )}

//       {/* Searchable Assignee Dropdown */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />

//       {/* License Form: only for 'license' and 'other' */}
//       {showLicenseForm && <LicenseForm />}
//     </div>
//   );
// }













// // src/app/components/TaskForm/BasicInfoStep.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuth } from "@clerk/nextjs";
// import dynamic from "next/dynamic";

// // Define TabType locally or import it if it's defined in a shared types file
// // For this example, we'll define it here, assuming it's not globally available.
// type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other"; // Ensure all possible values are included

// const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// // Dummy License Form – replace with your actual component
// function LicenseForm() {
//   return (
//     <div className="p-4 mt-4 border border-blue-300 bg-blue-50 rounded-lg">
//       <h3 className="font-bold text-blue-800 mb-2">🧾 License Form</h3>
//       <p className="text-sm text-gray-700">Fill in license-specific information here.</p>
//     </div>
//   );
// }

// type TeamMember = {
//   id: string;
//   email: string;
//   name?: string;
// };

// interface Props {
//   title: string;
//   assigneeId: string;
//   activeTab: TabType; // ✅ Corrected: activeTab itself should be TabType
//   setTitle: (val: string) => void;
//   setAssigneeId: (val: string) => void;
//   setActiveTab: (val: TabType) => void; // ✅ Corrected: setActiveTab should accept TabType
// }

// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// export default function BasicInfoStep({
//   assigneeId,
//   activeTab,
//   setTitle,
//   setAssigneeId,
//   setActiveTab,
// }: Props) {
//   const { getToken } = useAuth();
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [customService, setCustomService] = useState("");

//   useEffect(() => {
//     const fetchTeamMembers = async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch("/api/team-members", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to fetch team members");

//         const data = await res.json();
//         setTeamMembers(data);
//       } catch (err) {
//         console.error("Failed to load team members", err);
//       }
//     };

//     fetchTeamMembers();
//   }, [getToken]);

//   const memberOptions = teamMembers.map((member) => ({
//     value: member.id,
//     label: `${member.name || member.email} (${member.email})`,
//   }));

//   const isCustom = activeTab === "other";
//   const showLicenseForm = activeTab === "license" || isCustom; // This logic might need refinement if 'other' has different forms

//   return (
//     <div className="space-y-4">
//       {/* Service Type Dropdown */}
//       <select
//         value={activeTab}
//         onChange={(e) => {
//           const selected = e.target.value as TabType; // ✅ Type assertion here for safety
//           setActiveTab(selected);
//           const matched = TASK_CATEGORIES.find((c) => c.value === selected);
//           setTitle(matched?.label || selected);
//           if (selected !== "other") setCustomService("");
//         }}
//         className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         required
//       >
//         <option value="">📂 Select Service Type...</option>
//         {TASK_CATEGORIES.map((cat) => (
//           <option key={cat.value} value={cat.value}>
//             {cat.label}
//           </option>
//         ))}
//       </select>

//       {/* Custom Input Only for 'Other' */}
//       {isCustom && (
//         <input
//           value={customService}
//           onChange={(e) => {
//             const title = e.target.value;
//             setCustomService(title);
//             setTitle(title);
//           }}
//           placeholder="✍️ Enter your custom task title..."
//           className="w-full border border-purple-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
//         />
//       )}

//       {/* Searchable Assignee Dropdown */}
//       <ClientSelect
//         value={assigneeId}
//         onChange={setAssigneeId}
//         options={memberOptions}
//       />

//       {/* License Form: only for 'license' and 'other' */}
//       {showLicenseForm && <LicenseForm />}
//     </div>
//   );
// }







// src/app/components/TaskForm/BasicInfoStep.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";

// Define TabType locally or import it if it's defined in a shared types file
type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other";

const ClientSelect = dynamic(() => import("./ClientSelect"), { ssr: false });

// Dummy License Form – replace with your actual component
function LicenseForm() {
  return (
    <div className="p-4 mt-4 border border-blue-300 bg-blue-50 rounded-lg">
      <h3 className="font-bold text-blue-800 mb-2">🧾 License Form</h3>
      <p className="text-sm text-gray-700">Fill in license-specific information here.</p>
    </div>
  );
}

type TeamMember = {
  id: string;
  email: string;
  name?: string;
};

const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "zomato" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
  { label: "🧾 Food License", value: "license" },
  { label: "📸 Photo Upload", value: "photo" },
  { label: "📂 Account Handling", value: "account" },
  { label: "🛠️ Other", value: "other" },
];

interface Props {
  title: string;
  assigneeId: string;
  activeTab: TabType | ""; // It can be an empty string initially
  setTitle: (val: string) => void;
  setAssigneeId: (val: string) => void;
  setActiveTab: (val: TabType | "") => void; // Can accept empty string
}

export default function BasicInfoStep({
  assigneeId,
  activeTab,
  title, // Use title from props
  setTitle,
  setAssigneeId,
  setActiveTab,
}: Props) {
  const { getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/team-members", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch team members");

        const data = await res.json();
        setTeamMembers(data);
      } catch (err) {
        console.error("Failed to load team members", err);
      }
    };

    fetchTeamMembers();
  }, [getToken]);

  const memberOptions = teamMembers.map((member) => ({
    value: member.id,
    label: `${member.name || member.email} (${member.email})`,
  }));

  const isCustom = activeTab === "other";
  const showLicenseForm = activeTab === "license";

  return (
    <div className="space-y-4">
      {/* Service Type Dropdown */}
      <select
        value={activeTab}
        onChange={(e) => {
          // The parent's setActiveTab logic will handle setting the title correctly
          setActiveTab(e.target.value as TabType | "");
        }}
        className="w-full border border-purple-300 rounded-lg p-3 bg-purple-100 text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
        required
      >
        <option value="">📂 Select Service Type...</option>
        {TASK_CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Custom Input Only for 'Other' */}
      {isCustom && (
        <input
          value={title} // Directly bound to the title prop
          onChange={(e) => {
            setTitle(e.target.value); // Update the parent's title state
          }}
          placeholder="✍️ Enter your custom task title..."
          className="w-full border border-purple-300 rounded-lg p-3 bg-white text-gray-800 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
          required
        />
      )}

      {/* Searchable Assignee Dropdown */}
      <ClientSelect
        value={assigneeId}
        onChange={setAssigneeId}
        options={memberOptions}
      />

      {/* License Form: only for 'license' */}
      {showLicenseForm && <LicenseForm />}
    </div>
  );
}