








// "use client";

// import React, { useState } from "react";

// import { Task } from "../../types/task";

// import { FaCalendarAlt, FaFire, FaUser, FaEnvelope,  FaSave } from "react-icons/fa";

// type Task = {
//   id: string;
//   title: string;
//   description?: string;
//   dueDate?: string;
//   priority?: string;
//   tags?: string[];
//   subtasks?: { title: string }[];
//   assigner?: { name?: string; email?: string };
//   assignee?: { name?: string; email?: string };
//   customFields?: Record<string, any>;
// };

// interface Props {
//   task: Task;
//   onUpdate: (updatedTask: Task) => Promise<void>; // ✅ accepts async now
// }

// export default function TaskEditableCard({ task, onUpdate }: Props) {
//   const [formData, setFormData] = useState<Task>({ ...task });

//   const handleChange = (key: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleCustomChange = (key: string, value: any) => {
//     setFormData((prev) => ({
//       ...prev,
//       customFields: { ...prev.customFields, [key]: value },
//     }));
//   };

//   const handleSave = async () => {
//     await onUpdate(formData);
//   };

//   return (
//     <div className="space-y-3 text-sm text-gray-800 p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-sm border border-purple-200">
//       <div>
//         <label className="block font-medium text-purple-700 mb-1">📝 Title</label>
//         <input
//           value={formData.title}
//           onChange={(e) => handleChange("title", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md bg-white"
//           placeholder="Task title"
//         />
//       </div>

//       <div>
//         <label className="block font-medium text-purple-700 mb-1">🧾 Description</label>
//         <textarea
//           value={formData.description || ""}
//           onChange={(e) => handleChange("description", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md bg-white"
//           placeholder="Description"
//         />
//       </div>

//       <div>
//         <label className="block font-medium text-purple-700 mb-1 flex items-center gap-2">
//           <FaCalendarAlt /> Due Date
//         </label>
//         <input
//           type="date"
//           value={formData.dueDate || ""}
//           onChange={(e) => handleChange("dueDate", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md bg-white"
//         />
//       </div>

//       <div>
//         <label className="block font-medium text-purple-700 mb-1 flex items-center gap-2">
//           <FaFire /> Priority
//         </label>
//         <select
//           value={formData.priority || ""}
//           onChange={(e) => handleChange("priority", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md bg-white"
//         >
//           <option value="">Select Priority</option>
//           <option value="high">🔥 High</option>
//           <option value="medium">⚖️ Medium</option>
//           <option value="low">🧊 Low</option>
//         </select>
//       </div>

//       <div>
//         <label className="block font-medium text-purple-700 mb-1 flex items-center gap-2">
//           <FaUser /> Assignee Name
//         </label>
//         <input
//           type="text"
//           value={formData.assignee?.name || ""}
//           onChange={(e) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               name: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md bg-white"
//           placeholder="Assignee Name"
//         />
//       </div>

//       <div>
//         <label className="block font-medium text-purple-700 mb-1 flex items-center gap-2">
//           <FaEnvelope /> Assignee Email
//         </label>
//         <input
//           type="email"
//           value={formData.assignee?.email || ""}
//           onChange={(e) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               email: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md bg-white"
//           placeholder="Assignee Email"
//         />
//       </div>

//       {formData.customFields &&
//         Object.entries(formData.customFields).map(([key, value]) => (
//           <div key={key}>
//             <label className="block font-medium text-purple-700 mb-1 capitalize">
//               {key.replace(/([A-Z])/g, " $1")}
//             </label>
//             <input
//               value={value}
//               onChange={(e) => handleCustomChange(key, e.target.value)}
//               className="w-full px-3 py-2 border rounded-md bg-white"
//               placeholder={key}
//             />
//           </div>
//         ))}

//       <div className="pt-2">
//         <button
//           onClick={handleSave}
//           className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
//         >
//           <FaSave className="inline-block mr-2" />
//           Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }






// "use client";

// import React, { useState, ChangeEvent } from "react";
// import { FaCalendarAlt, FaFire, FaUser, FaEnvelope, FaSave } from "react-icons/fa";

// type CustomFields = Record<string, string>;

// type Task = {
//   id: string;
//   title: string;
//   description?: string;
//   dueDate?: string;
//   priority?: string;
//   tags?: string[];
//   subtasks?: { title: string }[];
//   assigner?: { name?: string; email?: string };
//   assignee?: { name?: string; email?: string };
//   customFields?: CustomFields;
// };

// interface Props {
//   task: Task;
//   onUpdate: (updatedTask: Task) => Promise<void>;
// }

// export default function TaskEditableCard({ task, onUpdate }: Props) {
//   const [formData, setFormData] = useState<Task>({ ...task });

//   const handleChange = (key: keyof Task, value: string | object) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleCustomChange = (key: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       customFields: { ...prev.customFields, [key]: value },
//     }));
//   };

//   const handleSave = async () => {
//     await onUpdate(formData);
//   };

//   return (
//     <div className="space-y-4 text-sm text-gray-800 p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow border border-purple-200">
//       {/* Title */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📝 Title</label>
//         <input
//           value={formData.title}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("title", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Task title"
//         />
//       </div>

//       {/* Description */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📄 Description</label>
//         <textarea
//           value={formData.description || ""}
//           onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
//             handleChange("description", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Description"
//         />
//       </div>

//       {/* Due Date */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaCalendarAlt /> Due Date
//         </label>
//         <input
//           type="date"
//           value={formData.dueDate || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("dueDate", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         />
//       </div>

//       {/* Priority */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaFire /> Priority
//         </label>
//         <select
//           value={formData.priority || ""}
//           onChange={(e: ChangeEvent<HTMLSelectElement>) =>
//             handleChange("priority", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         >
//           <option value="">Select Priority</option>
//           <option value="high">🔥 High</option>
//           <option value="medium">⚖️ Medium</option>
//           <option value="low">🧊 Low</option>
//         </select>
//       </div>

//       {/* Assignee Name */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaUser /> Assignee Name
//         </label>
//         <input
//           type="text"
//           value={formData.assignee?.name || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               name: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Name"
//         />
//       </div>

//       {/* Assignee Email */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaEnvelope /> Assignee Email
//         </label>
//         <input
//           type="email"
//           value={formData.assignee?.email || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               email: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Email"
//         />
//       </div>

//       {/* Custom Fields */}
//       {formData.customFields &&
//         Object.entries(formData.customFields).map(([key, value]) => (
//           <div key={key}>
//             <label className="block text-purple-800 font-semibold mb-1 capitalize">
//               {key.replace(/([A-Z])/g, " $1")}
//             </label>
//             <input
//               value={value}
//               onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                 handleCustomChange(key, e.target.value)
//               }
//               className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//               placeholder={key}
//             />
//           </div>
//         ))}

//       {/* Save Button */}
//       <div className="pt-3 text-right">
//         <button
//           onClick={handleSave}
//           className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
//         >
//           <FaSave /> Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }




















// "use client";

// import React, { useState, ChangeEvent } from "react";
// import { FaCalendarAlt, FaFire, FaUser, FaEnvelope, FaSave } from "react-icons/fa";
// import { Task } from "../../../types/task"; // ✅ Shared Task type

// interface Props {
//   task: Task;
//   onUpdate: (updatedTask: Task) => Promise<void>;
// }

// export default function TaskEditableCard({ task, onUpdate }: Props) {
//   const [formData, setFormData] = useState<Task>({ ...task });

//   const handleChange = (key: keyof Task, value: string | object) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleCustomChange = (key: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       customFields: {
//         ...prev.customFields,
//         [key]: value,
//       },
//     }));
//   };

//   const handleSave = async () => {
//     await onUpdate(formData);
//   };

//   return (
//     <div className="space-y-4 text-sm text-gray-800 p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow border border-purple-200">
//       {/* Title */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📝 Title</label>
//         <input
//           value={formData.title}
//           onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Task title"
//         />
//       </div>

//       {/* Description */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📄 Description</label>
//         <textarea
//           value={formData.description || ""}
//           onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Description"
//         />
//       </div>

//       {/* Due Date */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaCalendarAlt /> Due Date
//         </label>
//         <input
//           type="date"
//           value={formData.dueDate || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("dueDate", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         />
//       </div>

//       {/* Priority */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaFire /> Priority
//         </label>
//         <select
//           value={formData.priority || ""}
//           onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange("priority", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         >
//           <option value="">Select Priority</option>
//           <option value="high">🔥 High</option>
//           <option value="medium">⚖️ Medium</option>
//           <option value="low">🧊 Low</option>
//         </select>
//       </div>

//       {/* Assignee Name */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaUser /> Assignee Name
//         </label>
//         <input
//           type="text"
//           value={formData.assignee?.name || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               name: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Name"
//         />
//       </div>

//       {/* Assignee Email */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaEnvelope /> Assignee Email
//         </label>
//         <input
//           type="email"
//           value={formData.assignee?.email || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               email: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Email"
//         />
//       </div>

//       {/* Custom Fields */}
//       {formData.customFields &&
//         Object.entries(formData.customFields).map(([key, value]) => (
//           <div key={key}>
//             <label className="block text-purple-800 font-semibold mb-1 capitalize">
//               {key.replace(/([A-Z])/g, " $1")}
//             </label>
//             <input
//               value={value}
//               onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                 handleCustomChange(key, e.target.value)
//               }
//               className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//               placeholder={key}
//             />
//           </div>
//         ))}

//       {/* Save Button */}
//       <div className="pt-3 text-right">
//         <button
//           onClick={handleSave}
//           className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
//         >
//           <FaSave /> Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }











// "use client";

// import React, { useState, ChangeEvent } from "react";
// import { FaCalendarAlt, FaFire, FaUser, FaEnvelope, FaSave } from "react-icons/fa";
// import { Task } from "../../../types/task"; // ✅ Shared Task type

// interface Props {
//   task: Task;
//   onUpdate: (updatedTask: Task) => Promise<void>;
// }

// export default function TaskEditableCard({ task, onUpdate }: Props) {
//   const [formData, setFormData] = useState<Task>({ ...task });

//   const handleChange = (key: keyof Task, value: string | object) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleCustomChange = (key: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       customFields: {
//         ...prev.customFields,
//         [key]: value,
//       },
//     }));
//   };

//   const handleSave = async () => {
//     await onUpdate(formData);
//   };

//   return (
//     <div className="space-y-4 text-sm text-gray-800 p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow border border-purple-200">
//       {/* Title */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📝 Title</label>
//         <input
//           value={formData.title}
//           onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Task title"
//         />
//       </div>

//       {/* Description */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1">📄 Description</label>
//         <textarea
//           value={formData.description || ""}
//           onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
//             handleChange("description", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Description"
//         />
//       </div>

//       {/* Due Date */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaCalendarAlt /> Due Date
//         </label>
//         <input
//           type="date"
//           value={formData.dueDate || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("dueDate", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         />
//       </div>

//       {/* Priority */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaFire /> Priority
//         </label>
//         <select
//           value={formData.priority || ""}
//           onChange={(e: ChangeEvent<HTMLSelectElement>) =>
//             handleChange("priority", e.target.value)
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//         >
//           <option value="">Select Priority</option>
//           <option value="high">🔥 High</option>
//           <option value="medium">⚖️ Medium</option>
//           <option value="low">🧊 Low</option>
//         </select>
//       </div>

//       {/* Assignee Name */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaUser /> Assignee Name
//         </label>
//         <input
//           type="text"
//           value={formData.assignee?.name || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               name: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Name"
//         />
//       </div>

//       {/* Assignee Email */}
//       <div>
//         <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
//           <FaEnvelope /> Assignee Email
//         </label>
//         <input
//           type="email"
//           value={formData.assignee?.email || ""}
//           onChange={(e: ChangeEvent<HTMLInputElement>) =>
//             handleChange("assignee", {
//               ...formData.assignee,
//               email: e.target.value,
//             })
//           }
//           className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//           placeholder="Assignee Email"
//         />
//       </div>

//       {/* Custom Fields */}
//       {formData.customFields &&
//         Object.entries(formData.customFields).map(([key, value]) => (
//           <div key={key}>
//             <label className="block text-purple-800 font-semibold mb-1 capitalize">
//               {key.replace(/([A-Z])/g, " $1")}
//             </label>
//             <input
//               value={typeof value === "string" || typeof value === "number" ? value : ""}
//               onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                 handleCustomChange(key, e.target.value)
//               }
//               className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
//               placeholder={key}
//             />
//           </div>
//         ))}

//       {/* Save Button */}
//       <div className="pt-3 text-right">
//         <button
//           onClick={handleSave}
//           className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
//         >
//           <FaSave /> Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }

























// components/TaskEditableCard.tsx
"use client";

import React, { useState, ChangeEvent } from "react";
import { FaCalendarAlt, FaFire, FaUser, FaEnvelope, FaSave } from "react-icons/fa";
import { Task } from "../../types/task"; // ✅ Shared Task type

interface Props {
  task: Task;
  onUpdate: (updatedTask: Task) => Promise<void>;
}

export default function TaskEditableCard({ task, onUpdate }: Props) {
  // Initialize formData with a deep copy of the task to prevent direct mutation of props
  const [formData, setFormData] = useState<Task>(JSON.parse(JSON.stringify(task)));

  const handleChange = (key: keyof Task, value: string | object | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomChange = (key: string, value: string | number | boolean | null | undefined) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    // Before saving, ensure dueDate is in a consistent format if it was a Date object
    // Or just rely on the API to handle date formats.
    // For now, the input directly gives us a string, so no additional formatting needed here for saving
    await onUpdate(formData);
  };

  return (
    <div className="space-y-4 text-sm text-gray-800 p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow border border-purple-200">
      {/* Title */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1">📝 Title</label>
        <input
          value={formData.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
          placeholder="Task title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1">📄 Description</label>
        <textarea
          value={formData.description || ""}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            handleChange("description", e.target.value)
          }
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
          placeholder="Description"
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
          <FaCalendarAlt /> Due Date
        </label>
        <input
          type="date"
          // ✅ FIX: Ensure formData.dueDate is always a string in YYYY-MM-DD format
          value={
            formData.dueDate
              ? typeof formData.dueDate === "string"
                ? formData.dueDate
                : new Date(formData.dueDate).toISOString().split("T")[0]
              : ""
          }
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange("dueDate", e.target.value)
          }
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
          <FaFire /> Priority
        </label>
        <select
          value={formData.priority || ""}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleChange("priority", e.target.value)
          }
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
        >
          <option value="">Select Priority</option>
          <option value="high">🔥 High</option>
          <option value="medium">⚖️ Medium</option>
          <option value="low">🧊 Low</option>
        </select>
      </div>

      {/* Assignee Name */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
          <FaUser /> Assignee Name
        </label>
        <input
          type="text"
          value={formData.assignee?.name || ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange("assignee", {
              ...formData.assignee,
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
          placeholder="Assignee Name"
        />
      </div>

      {/* Assignee Email */}
      <div>
        <label className="block text-purple-800 font-semibold mb-1 flex items-center gap-2">
          <FaEnvelope /> Assignee Email
        </label>
        <input
          type="email"
          value={formData.assignee?.email || ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange("assignee", {
              ...formData.assignee,
              email: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
          placeholder="Assignee Email"
        />
      </div>

      {/* Custom Fields */}
      {formData.customFields &&
        Object.entries(formData.customFields).map(([key, value]) => (
          <div key={key}>
            <label className="block text-purple-800 font-semibold mb-1 capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </label>
            <input
              value={typeof value === "string" || typeof value === "number" ? value : ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleCustomChange(key, e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-400"
              placeholder={key}
            />
          </div>
        ))}

      {/* Save Button */}
      <div className="pt-3 text-right">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          <FaSave /> Save Changes
        </button>
      </div>
    </div>
  );
}