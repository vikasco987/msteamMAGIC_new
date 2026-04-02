


// // src/app/components/TaskForm/TaskForm.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import BasicInfoStep from "./BasicInfoStep";
// import UploadsStep from "./UploadsStep";
// import CustomFieldsStep from "./CustomFieldsStep"; // Assuming this component exists and is used
// import { uploadToCloudinary } from "./utils"; // Assuming this utility function exists

// // Define TabType more broadly to include all categories
// type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other";

// type CustomField = {
//   label: string;
//   value: string;
//   files: File[];
// };

// const LOCAL_STORAGE_KEY = "onboarding-task-form";

// // Define TASK_CATEGORIES here as it's used for setting the title
// const TASK_CATEGORIES = [
//   { label: "🍽️ Zomato Onboarding", value: "zomato" },
//   { label: "🍔 Swiggy Onboarding", value: "swiggy" },
//   { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
//   { label: "🧾 Food License", value: "license" },
//   { label: "📸 Photo Upload", value: "photo" },
//   { label: "📂 Account Handling", value: "account" },
//   { label: "🛠️ Other", value: "other" },
// ];

// // Define the initial state for your form
// const initialFormState = {
//   // ✅ Changed default activeTab to empty string or 'account' based on common use case
//   // Setting it to 'account' might be more user-friendly if that's the primary use.
//   // If you want the dropdown to literally say "Select Service Type..." then use ""
//   activeTab: "" as TabType | "", // Or "account" as TabType;
//   title: "", // ✅ Initialize as empty, will be set by dropdown or custom input
//   assigneeId: "",
//   customFields: [] as CustomField[],
//   // Basic Info fields
//   phone: "",
//   email: "",
//   shopName: "",
//   location: "",
//   accountNumber: "",
//   ifscCode: "",
//   // Account Handling/Photo/Restaurant ID fields
//   customerName: "",
//   startDate: "",
//   packageAmount: "",
//   timeline: "",
//   restId: "",
//   endDate: "",
//   // File states (reset to empty arrays)
//   aadhaarFile: [] as File[],
//   panFile: [] as File[],
//   selfieFile: [] as File[],
//   chequeFile: [] as File[],
//   menuCardFiles: [] as File[],
// };

// export default function TaskForm() {
//   // Use a single state object for better management and easier reset
//   const [formData, setFormData] = useState(initialFormState);
//   const [step, setStep] = useState(0); // 0, 1, 2 for 3 steps

//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState("");

//   // Helper to update individual formData fields
//   const updateFormData = (field: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   // ✅ Function to reset the entire form to its initial state
//   const resetForm = () => {
//     setFormData(initialFormState);
//     setStep(0); // Reset to the first step
//   };

//   // Load state from localStorage on component mount
//   useEffect(() => {
//     const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       // ✅ Be careful with files in localStorage, they won't persist directly
//       // Only load primitive states and set files to empty array or re-fetch if possible
//       setFormData({
//         ...initialFormState, // Start with initial state to clear files
//         activeTab: parsed.activeTab || initialFormState.activeTab, // Use initial default if not saved
//         title: parsed.title || initialFormState.title,
//         assigneeId: parsed.assigneeId || initialFormState.assigneeId,
//         customFields: parsed.customFields || initialFormState.customFields,
//         phone: parsed.phone || initialFormState.phone,
//         email: parsed.email || initialFormState.email,
//         shopName: parsed.shopName || initialFormState.shopName,
//         location: parsed.location || initialFormState.location,
//         accountNumber: parsed.accountNumber || initialFormState.accountNumber,
//         ifscCode: parsed.ifscCode || initialFormState.ifscCode,
//         customerName: parsed.customerName || initialFormState.customerName,
//         startDate: parsed.startDate || initialFormState.startDate,
//         packageAmount: parsed.packageAmount || initialFormState.packageAmount,
//         timeline: parsed.timeline || initialFormState.timeline,
//         restId: parsed.restId || initialFormState.restId,
//         endDate: parsed.endDate || initialFormState.endDate,
//         // Files are NOT loaded from localStorage as File objects cannot be stringified
//         // They will default to empty arrays as per initialFormState
//       });
//       setStep(parsed.step || 0); // Always set step from localStorage
//     }
//   }, []);

//   // Save state to localStorage on state change
//   useEffect(() => {
//     const stateToSave = {
//       ...formData,
//       // Do NOT save File objects to localStorage
//       aadhaarFile: [],
//       panFile: [],
//       selfieFile: [],
//       chequeFile: [],
//       menuCardFiles: [],
//       // Also, clear files from customFields if they are File objects
//       customFields: formData.customFields.map(field => ({
//         ...field,
//         files: [] // Clear files for saving, only retain label and value
//       }))
//     };
//     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
//   }, [formData, step]); // Save whenever formData or step changes

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // ✅ Fix: Only advance step if not on the last step (step 2 is the last)
//     if (step < 2) {
//       setStep(step + 1);
//       return; // Stop submission
//     }

//     // --- Actual submission logic for the final step ---
//     setLoading(true);
//     setUploading(true);
//     setUploadStatus("");

//     try {
//       const uploadedFileMap = new Map<string, string>(); // file.name -> url

//       const uploadUniqueFile = async (file: File): Promise<string> => {
//         if (uploadedFileMap.has(file.name)) {
//           return uploadedFileMap.get(file.name)!;
//         }
//         // Clone the file to ensure the stream is readable multiple times if needed
//         const newFile = new File([file], file.name);
//         const url = await uploadToCloudinary(newFile, setUploadStatus);
//         uploadedFileMap.set(file.name, url);
//         return url;
//       };

//       const staticFiles = [
//         ...formData.aadhaarFile,
//         ...formData.panFile,
//         ...formData.selfieFile,
//         ...formData.chequeFile,
//         ...formData.menuCardFiles,
//       ].filter(Boolean); // Filter out any null/undefined

//       const attachments = await Promise.all(
//         staticFiles.map((file) =>
//           uploadUniqueFile(file).catch((err) => {
//             console.error("❌ Failed upload:", file.name, err);
//             throw new Error(`Failed to upload ${file.name}`);
//           })
//         )
//       );

//       const uploadedCustomFields = await Promise.all(
//         formData.customFields.map(async (field) => {
//           const urls: string[] = [];
//           for (const file of field.files) {
//             const url = await uploadUniqueFile(file);
//             urls.push(url);
//           }
//           return {
//             label: field.label,
//             value: field.value,
//             files: urls, // Store URLs here, not File objects
//           };
//         })
//       );

//       const payload = {
//         title: formData.title,
//         assigneeId: formData.assigneeId,
//         assigneeEmail: formData.email.trim(), // Use email from formData
//         activeTab: formData.activeTab,
//         attachments,
//         tags: [], // Assuming tags are not part of this form flow
//         customFields: {
//           phone: formData.phone.trim(),
//           email: formData.email.trim(),
//           shopName: formData.shopName.trim(),
//           location: formData.location.trim(),
//           accountNumber: formData.accountNumber.trim(),
//           ifscCode: formData.ifscCode.trim(),
//           customerName: formData.customerName.trim(),
//           restId: formData.restId.trim(),
//           startDate: formData.startDate, // Dates usually don't need trimming
//           endDate: formData.endDate,
//           packageAmount: formData.packageAmount.trim(),
//           timeline: formData.timeline.trim(),
//           fields: uploadedCustomFields, // Use the uploaded URLs here
//         },
//       };

//       const res = await fetch("/api/tasks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload), // Use the correctly formatted payload
//       });

//       const json = await res.json();

//       if (!res.ok) {
//         console.error("❌ Failed to create task:", json);
//         alert("❌ Failed to create task");
//         return;
//       }

//       console.log("✅ Task created:", json.task);
//       alert("✅ Task created successfully");

//       // ✅ Reset form after successful submission
//       resetForm();
//       // Clear localStorage explicitly after successful submission
//       localStorage.removeItem(LOCAL_STORAGE_KEY);
//     } catch (err) {
//       console.error("❌ Error in task submission", err);
//       alert("❌ Error while submitting");
//     } finally {
//       setLoading(false);
//       setUploading(false);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
//     >
//       <div className="flex justify-center gap-4 mb-6">
//         {["Step 1 (Basic Info)", "Step 2 (Uploads)", "Step 3 (Custom Fields)"].map((label, idx) => (
//           <button
//             key={idx}
//             type="button" // ✅ Always type="button" for step navigation
//             onClick={() => setStep(idx)}
//             className={`px-4 py-2 rounded ${
//               step === idx ? "bg-purple-600 text-white" : "bg-gray-300"
//             }`}
//           >
//             {label}
//           </button>
//         ))}
//       </div>

//       {step === 0 && (
//         <BasicInfoStep
//           title={formData.title}
//           assigneeId={formData.assigneeId}
//           activeTab={formData.activeTab}
//           setTitle={(val) => updateFormData("title", val)}
//           setAssigneeId={(val) => updateFormData("assigneeId", val)}
//           setActiveTab={(val) => {
//             // ✅ Centralized logic for setting title based on activeTab change
//             const matchedCategory = TASK_CATEGORIES.find((cat) => cat.value === val);
//             setFormData((prev) => ({
//               ...prev,
//               activeTab: val,
//               title: val === "other" ? "" : (matchedCategory?.label || ""), // Clear title if 'other', use label otherwise
//             }));
//           }}
//         />
//       )}

//       {step === 1 && (
//         <UploadsStep
//           activeTab={formData.activeTab}
//           aadhaarFile={formData.aadhaarFile}
//           panFile={formData.panFile}
//           selfieFile={formData.selfieFile}
//           chequeFile={formData.chequeFile}
//           menuCardFiles={formData.menuCardFiles}
//           phone={formData.phone}
//           email={formData.email}
//           shopName={formData.shopName}
//           location={formData.location}
//           accountNumber={formData.accountNumber}
//           ifscCode={formData.ifscCode}
//           restId={formData.restId}
//           customerName={formData.customerName}
//           packageAmount={formData.packageAmount}
//           startDate={formData.startDate}
//           endDate={formData.endDate}
//           timeline={formData.timeline}
//           setAadhaarFile={(files) => updateFormData("aadhaarFile", files)}
//           setPanFile={(files) => updateFormData("panFile", files)}
//           setSelfieFile={(files) => updateFormData("selfieFile", files)}
//           setChequeFile={(files) => updateFormData("chequeFile", files)}
//           setMenuCardFiles={(files) => updateFormData("menuCardFiles", files)}
//           setPhone={(val) => updateFormData("phone", val)}
//           setEmail={(val) => updateFormData("email", val)}
//           setShopName={(val) => updateFormData("shopName", val)}
//           setLocation={(val) => updateFormData("location", val)}
//           setAccountNumber={(val) => updateFormData("accountNumber", val)}
//           setIfscCode={(val) => updateFormData("ifscCode", val)}
//           setRestId={(val) => updateFormData("restId", val)}
//           setCustomerName={(val) => updateFormData("customerName", val)}
//           setPackageAmount={(val) => updateFormData("packageAmount", val)}
//           setStartDate={(val) => updateFormData("startDate", val)}
//           setEndDate={(val) => updateFormData("endDate", val)}
//           setTimeline={(val) => updateFormData("timeline", val)}
//         />
//       )}

//       {step === 2 && (
//         <CustomFieldsStep
//           customFields={formData.customFields}
//           setCustomFields={(fields) => updateFormData("customFields", fields)}
//         />
//       )}

//       {uploading && uploadStatus && (
//         <p className="text-sm text-blue-600 mt-4 animate-pulse">{uploadStatus}</p>
//       )}

//       <div className="mt-6">
//         {step < 2 ? ( // If not on the last step (step 2)
//           <button
//             type="submit" // ✅ This will trigger handleSubmit and then advance step
//             className="bg-purple-600 text-white px-6 py-2 rounded"
//           >
//             ➡️ Next
//           </button>
//         ) : (
//           <button
//             type="submit" // ✅ This will trigger handleSubmit for final submission
//             className="bg-purple-600 text-white px-6 py-2 rounded w-full"
//             disabled={loading}
//           >
//             {loading ? "Creating..." : "✅ Create Task"}
//           </button>
//         )}
//       </div>
//     </form>
//   );
// }











// src/app/components/TaskForm/TaskForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import BasicInfoStep from "./BasicInfoStep";
import UploadsStep from "./UploadsStep";
import CustomFieldsStep from "./CustomFieldsStep"; // Assuming this component exists and is used
import { uploadToCloudinary } from "./utils"; // Assuming this utility function exists

// Define TabType more broadly to include all categories
type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other";

type CustomField = {
  label: string;
  value: string;
  files: File[];
};

const LOCAL_STORAGE_KEY = "onboarding-task-form";

// Define TASK_CATEGORIES here as it's used for setting the title
const TASK_CATEGORIES = [
  { label: "🍽️ Zomato Onboarding", value: "zomato" },
  { label: "🍔 Swiggy Onboarding", value: "swiggy" },
  { label: "🍽️🍔 Zomato + Swiggy Combo", value: "combo" },
  { label: "🧾 Food License", value: "license" },
  { label: "📸 Photo Upload", value: "photo" },
  { label: "📂 Account Handling", value: "account" },
  { label: "🛠️ Other", value: "other" },
];

// Define the initial state for your form
const initialFormState = {
  activeTab: "" as TabType | "",
  title: "",
  assigneeId: "",
  customFields: [] as CustomField[],
  phone: "",
  email: "",
  shopName: "",
  location: "",
  accountNumber: "",
  ifscCode: "",
  customerName: "",
  startDate: "",
  packageAmount: "",
  timeline: "",
  restId: "",
  endDate: "",
  aadhaarFile: [] as File[],
  panFile: [] as File[],
  selfieFile: [] as File[],
  chequeFile: [] as File[],
  menuCardFiles: [] as File[],
};

export default function TaskForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [step, setStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Helper to update individual formData fields
  // ✅ FIX: Changed 'value: any' to 'value: unknown'
  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setStep(0);
  };

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData({
          ...initialFormState,
          activeTab: parsed.activeTab || initialFormState.activeTab,
          title: parsed.title || initialFormState.title,
          assigneeId: parsed.assigneeId || initialFormState.assigneeId,
          customFields: parsed.customFields || initialFormState.customFields,
          phone: parsed.phone || initialFormState.phone,
          email: parsed.email || initialFormState.email,
          shopName: parsed.shopName || initialFormState.shopName,
          location: parsed.location || initialFormState.location,
          accountNumber: parsed.accountNumber || initialFormState.accountNumber,
          ifscCode: parsed.ifscCode || initialFormState.ifscCode,
          customerName: parsed.customerName || initialFormState.customerName,
          startDate: parsed.startDate || initialFormState.startDate,
          packageAmount: parsed.packageAmount || initialFormState.packageAmount,
          timeline: parsed.timeline || initialFormState.timeline,
          restId: parsed.restId || initialFormState.restId,
          endDate: parsed.endDate || initialFormState.endDate,
        });
        setStep(parsed.step || 0);
      } catch (e) {
        console.error("Failed to parse local storage data:", e);
        setFormData(initialFormState);
        setStep(0);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      ...formData,
      aadhaarFile: [],
      panFile: [],
      selfieFile: [],
      chequeFile: [],
      menuCardFiles: [],
      customFields: formData.customFields.map(field => ({
        ...field,
        files: []
      }))
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [formData, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 2) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setUploading(true);
    setUploadStatus("");

    try {
      const uploadedFileMap = new Map<string, string>();

      const uploadUniqueFile = async (file: File): Promise<string> => {
        if (uploadedFileMap.has(file.name)) {
          return uploadedFileMap.get(file.name)!;
        }
        const newFile = new File([file], file.name);
        const url = await uploadToCloudinary(newFile, setUploadStatus);
        uploadedFileMap.set(file.name, url);
        return url;
      };

      const staticFiles = [
        ...formData.aadhaarFile,
        ...formData.panFile,
        ...formData.selfieFile,
        ...formData.chequeFile,
        ...formData.menuCardFiles,
      ].filter(Boolean);

      const attachments = await Promise.all(
        staticFiles.map((file) =>
          uploadUniqueFile(file).catch((err) => {
            console.error("❌ Failed upload:", file.name, err);
            throw new Error(`Failed to upload ${file.name}`);
          })
        )
      );

      const uploadedCustomFields = await Promise.all(
        formData.customFields.map(async (field) => {
          const urls: string[] = [];
          for (const file of field.files) {
            const url = await uploadUniqueFile(file);
            urls.push(url);
          }
          return {
            label: field.label,
            value: field.value,
            files: urls,
          };
        })
      );

      const payload = {
        title: formData.title,
        assigneeId: formData.assigneeId,
        assigneeEmail: formData.email.trim(),
        activeTab: formData.activeTab,
        attachments,
        tags: [],
        customFields: {
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          shopName: formData.shopName.trim(),
          location: formData.location.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.trim(),
          customerName: formData.customerName.trim(),
          restId: formData.restId.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          packageAmount: formData.packageAmount.trim(),
          timeline: formData.timeline.trim(),
          fields: uploadedCustomFields,
        },
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("❌ Failed to create task:", json);
        alert("❌ Failed to create task");
        return;
      }

      console.log("✅ Task created:", json.task);
      alert("✅ Task created successfully");

      resetForm();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error("❌ Error in task submission", err);
      alert("❌ Error while submitting");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
    >
      <div className="flex justify-center gap-4 mb-6">
        {["Step 1 (Basic Info)", "Step 2 (Uploads)", "Step 3 (Custom Fields)"].map((label, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setStep(idx)}
            className={`px-4 py-2 rounded ${
              step === idx ? "bg-purple-600 text-white" : "bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <BasicInfoStep
          title={formData.title}
          assigneeId={formData.assigneeId}
          activeTab={formData.activeTab}
          setTitle={(val) => updateFormData("title", val)}
          setAssigneeId={(val) => updateFormData("assigneeId", val)}
          setActiveTab={(val) => {
            const matchedCategory = TASK_CATEGORIES.find((cat) => cat.value === val);
            setFormData((prev) => ({
              ...prev,
              activeTab: val,
              title: val === "other" ? "" : (matchedCategory?.label || ""),
            }));
          }}
        />
      )}

      {step === 1 && (
        <UploadsStep
          activeTab={formData.activeTab}
          aadhaarFile={formData.aadhaarFile}
          panFile={formData.panFile}
          selfieFile={formData.selfieFile}
          chequeFile={formData.chequeFile}
          menuCardFiles={formData.menuCardFiles}
          phone={formData.phone}
          email={formData.email}
          shopName={formData.shopName}
          location={formData.location}
          accountNumber={formData.accountNumber}
          ifscCode={formData.ifscCode}
          restId={formData.restId}
          customerName={formData.customerName}
          packageAmount={formData.packageAmount}
          startDate={formData.startDate}
          endDate={formData.endDate}
          timeline={formData.timeline}
          setAadhaarFile={(files) => updateFormData("aadhaarFile", files)}
          setPanFile={(files) => updateFormData("panFile", files)}
          setSelfieFile={(files) => updateFormData("selfieFile", files)}
          setChequeFile={(files) => updateFormData("chequeFile", files)}
          setMenuCardFiles={(files) => updateFormData("menuCardFiles", files)}
          setPhone={(val) => updateFormData("phone", val)}
          setEmail={(val) => updateFormData("email", val)}
          setShopName={(val) => updateFormData("shopName", val)}
          setLocation={(val) => updateFormData("location", val)}
          setAccountNumber={(val) => updateFormData("accountNumber", val)}
          setIfscCode={(val) => updateFormData("ifscCode", val)}
          setRestId={(val) => updateFormData("restId", val)}
          setCustomerName={(val) => updateFormData("customerName", val)}
          setPackageAmount={(val) => updateFormData("packageAmount", val)}
          setStartDate={(val) => updateFormData("startDate", val)}
          setEndDate={(val) => updateFormData("endDate", val)}
          setTimeline={(val) => updateFormData("timeline", val)}
        />
      )}

      {step === 2 && (
        <CustomFieldsStep
          customFields={formData.customFields}
          setCustomFields={(fields) => updateFormData("customFields", fields)}
        />
      )}

      {uploading && uploadStatus && (
        <p className="text-sm text-blue-600 mt-4 animate-pulse">{uploadStatus}</p>
      )}

      <div className="mt-6">
        {step < 2 ? (
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded"
          >
            ➡️ Next
          </button>
        ) : (
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "✅ Create Task"}
          </button>
        )}
      </div>
    </form>
  );
}