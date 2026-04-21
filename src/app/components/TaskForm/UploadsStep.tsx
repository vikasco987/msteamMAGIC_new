// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: "license" | "swiggy" | "zomato";
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
// }

// export default function UploadsStep({
//   activeTab,
//   aadhaarFile,
//   panFile,
//   menuCardFiles,
//   selfieFile,
//   phone,
//   email,
//   shopName,
//   location,
//   accountNumber,
//   ifscCode,
//   setAadhaarFile,
//   setPanFile,
//   setMenuCardFiles,
//   setSelfieFile,
//   setPhone,
//   setEmail,
//   setShopName,
//   setLocation,
//   setAccountNumber,
//   setIfscCode,
// }: UploadsStepProps) {
//   const inputClass =
//     "input w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";

//   return (
//     <>
//       {/* ✅ Section 1: Fill Information */}
//       <div className="mb-6">
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📄 Fill Information</h3>

//         {activeTab === "license" ? (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={(e) => setShopName(e.target.value)}
//               placeholder="🏪 Shop Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="📍 Location"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//           </>
//         ) : (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={(e) => setShopName(e.target.value)}
//               placeholder="🏷️ Outlet Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="📍 Address"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={accountNumber}
//               onChange={(e) => setAccountNumber(e.target.value)}
//               placeholder="🏦 Bank Account Number"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={ifscCode}
//               onChange={(e) => setIfscCode(e.target.value)}
//               placeholder="🔢 IFSC Code"
//               className={inputClass}
//             />
//           </>
//         )}
//       </div>

//       {/* ✅ Section 2: Upload Documents */}
//       <div>
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📤 Upload Documents</h3>

//         {activeTab === "license" ? (
//           <>
//             <FileDropzone onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} label="🆔 Aadhaar Card" />
//             <FileDropzone onDrop={setPanFile} acceptedFiles={panFile} label="💳 PAN Card" />
//             <FileDropzone onDrop={setSelfieFile} acceptedFiles={selfieFile} label="🤳 Selfie" />
//           </>
//         ) : (
//           <>
//             <FileDropzone onDrop={setPanFile} acceptedFiles={panFile} label="💳 PAN Card" />
//             <FileDropzone onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} label="📄 Menu Card (PDF or Image)" />
//             <FileDropzone onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} label="🍔 Food License" />
//           </>
//         )}
//       </div>
//     </>
//   );
// }










// // src/app/components/TaskForm/UploadsStep.tsx
// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: "license" | "swiggy" | "zomato";
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
// }

// export default function UploadsStep({
//   activeTab,
//   aadhaarFile,
//   panFile,
//   menuCardFiles,
//   selfieFile,
//   chequeFile,
//   phone,
//   email,
//   shopName,
//   location,
//   accountNumber,
//   ifscCode,
//   setAadhaarFile,
//   setPanFile,
//   setMenuCardFiles,
//   setSelfieFile,
//   setChequeFile,
//   setPhone,
//   setEmail,
//   setShopName,
//   setLocation,
//   setAccountNumber,
//   setIfscCode,
// }: UploadsStepProps) {
//   const inputClass =
//     "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";

//   return (
//     <>
//       {/* Fill Information */}
//       <div className="mb-6">
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📄 Fill Information</h3>
//         {activeTab === "license" ? (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={e => setShopName(e.target.value)}
//               placeholder="🏪 Shop Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={e => setLocation(e.target.value)}
//               placeholder="📍 Location"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={phone}
//               onChange={e => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//           </>
//         ) : (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={e => setShopName(e.target.value)}
//               placeholder="🏷️ Outlet Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={phone}
//               onChange={e => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={e => setLocation(e.target.value)}
//               placeholder="📍 Address"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={accountNumber}
//               onChange={e => setAccountNumber(e.target.value)}
//               placeholder="🏦 Bank Account Number"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={ifscCode}
//               onChange={e => setIfscCode(e.target.value)}
//               placeholder="🔢 IFSC Code"
//               className={inputClass}
//             />
//           </>
//         )}
//       </div>

//       {/* Upload Documents */}
//       <div>
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📤 Upload Documents</h3>
//         {activeTab === "license" ? (
//           <>
//             <FileDropzone
//               onDrop={setAadhaarFile}
//               acceptedFiles={aadhaarFile}
//               label="🆔 Aadhaar Card"
//             />
//             <FileDropzone
//               onDrop={setPanFile}
//               acceptedFiles={panFile}
//               label="💳 PAN Card"
//             />
//             <FileDropzone
//               onDrop={setSelfieFile}
//               acceptedFiles={selfieFile}
//               label="🤳 Selfie Photo"
//             />
//             <FileDropzone
//               onDrop={setChequeFile}
//               acceptedFiles={chequeFile}
//               label="🏦 Cancelled Cheque"
//             />
//           </>
//         ) : (
//           <>
//             <FileDropzone
//               onDrop={setPanFile}
//               acceptedFiles={panFile}
//               label="💳 PAN Card"
//             />
//             <FileDropzone
//               onDrop={setMenuCardFiles}
//               acceptedFiles={menuCardFiles}
//               label="📄 Menu Card (PDF or Image)"
//             />
//             <FileDropzone
//               onDrop={setAadhaarFile}
//               acceptedFiles={aadhaarFile}
//               label="🍔 Food License"
//             />
//           </>
//         )}
//       </div>
//     </>
//   );
// }







// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: "license" | "swiggy" | "zomato";
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
// }

// export default function UploadsStep({
//   activeTab,
//   aadhaarFile,
//   panFile,
//   menuCardFiles,
//   selfieFile,
//   chequeFile,
//   phone,
//   email,
//   shopName,
//   location,
//   accountNumber,
//   ifscCode,
//   setAadhaarFile,
//   setPanFile,
//   setMenuCardFiles,
//   setSelfieFile,
//   setChequeFile,
//   setPhone,
//   setEmail,
//   setShopName,
//   setLocation,
//   setAccountNumber,
//   setIfscCode,
// }: UploadsStepProps) {
//   const inputClass =
//     "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";

//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <>
//       {/* Fill Information */}
//       <div className="mb-6">
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📄 Fill Information</h3>
//         {activeTab === "license" ? (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={e => setShopName(e.target.value)}
//               placeholder="🏪 Shop Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={e => setLocation(e.target.value)}
//               placeholder="📍 Location"
//               className={inputClass}
//             />
//             {isValidUrl(location) && (
//               <div className="border border-purple-300 bg-purple-50 p-4 rounded-lg shadow-sm mb-4">
//                 <p className="text-sm text-gray-600 mb-1">📍 Location Link:</p>
//                 <a
//                   href={location}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
//                 >
//                   🔗 View on Map
//                 </a>
//               </div>
//             )}
//             <input
//               type="text"
//               value={phone}
//               onChange={e => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//           </>
//         ) : (
//           <>
//             <input
//               type="text"
//               value={shopName}
//               onChange={e => setShopName(e.target.value)}
//               placeholder="🏷️ Outlet Name"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={phone}
//               onChange={e => setPhone(e.target.value)}
//               placeholder="📞 Phone"
//               className={inputClass}
//             />
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="📧 Email"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={location}
//               onChange={e => setLocation(e.target.value)}
//               placeholder="📍 Address (Google Maps link allowed)"
//               className={inputClass}
//             />
//             {isValidUrl(location) && (
//               <div className="border border-purple-300 bg-purple-50 p-4 rounded-lg shadow-sm mb-4">
//                 <p className="text-sm text-gray-600 mb-1">📍 Location Link:</p>
//                 <a
//                   href={location}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
//                 >
//                   🔗 View on Map
//                 </a>
//               </div>
//             )}
//             <input
//               type="text"
//               value={accountNumber}
//               onChange={e => setAccountNumber(e.target.value)}
//               placeholder="🏦 Bank Account Number"
//               className={inputClass}
//             />
//             <input
//               type="text"
//               value={ifscCode}
//               onChange={e => setIfscCode(e.target.value)}
//               placeholder="🔢 IFSC Code"
//               className={inputClass}
//             />
//           </>
//         )}
//       </div>

//       {/* Upload Documents */}
//       <div>
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📤 Upload Documents</h3>
//         {activeTab === "license" ? (
//           <>
//             <FileDropzone
//               onDrop={setAadhaarFile}
//               acceptedFiles={aadhaarFile}
//               label="🆔 Aadhaar Card"
//             />
//             <FileDropzone
//               onDrop={setPanFile}
//               acceptedFiles={panFile}
//               label="💳 PAN Card"
//             />
//             <FileDropzone
//               onDrop={setSelfieFile}
//               acceptedFiles={selfieFile}
//               label="🤳 Selfie Photo"
//             />
//             <FileDropzone
//               onDrop={setChequeFile}
//               acceptedFiles={chequeFile}
//               label="🏦 Cancelled Cheque"
//             />
//           </>
//         ) : (
//           <>
//             <FileDropzone
//               onDrop={setPanFile}
//               acceptedFiles={panFile}
//               label="💳 PAN Card"
//             />
//             <FileDropzone
//               onDrop={setMenuCardFiles}
//               acceptedFiles={menuCardFiles}
//               label="📄 Menu Card (PDF or Image)"
//             />
//             <FileDropzone
//               onDrop={setAadhaarFile}
//               acceptedFiles={aadhaarFile}
//               label="🍔 Food License"
//             />
//           </>
//         )}
//       </div>
//     </>
//   );
// }








// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, packageAmount, setPackageAmount,
//     startDate, setStartDate, endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <>
//       <div className="mb-6">
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
             
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div>
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}
//       </div>
//     </>
//   );
// }











// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <>
//       <div className="mb-6">
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div>
//         <h3 className="font-semibold text-lg text-purple-700 mb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}
//       </div>
//     </>
//   );
// }





// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}


//          {activeTab === "photo" && (
//         <>
//           {/* 📄 Fill Information */}
//           < className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
//             <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">
//               📄 Fill Information
//             </h3>

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🏷️ Outlet Name
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Outlet Name"
//               value={shopName}
//               onChange={(e) => setShopName(e.target.value)}
//             />

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🆔 Restaurant ID
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Restaurant ID"
//               value={restId}
//               onChange={(e) => setRestId(e.target.value)}
//             />
            

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} />
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

























// "use client";

// import React from "react";
// import FileDropzone from "./FileDropzone";


// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {/* Updated 'photo' section for Fill Information */}
//         {activeTab === "photo" && (
//           <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
//             <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">
//               📄 Fill Information
//             </h3>

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🏷️ Outlet Name
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Outlet Name"
//               value={shopName}
//               onChange={(e) => setShopName(e.target.value)}
//             />

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🆔 Restaurant ID
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Restaurant ID"
//               value={restId}
//               onChange={(e) => setRestId(e.target.value)}
//             />
//           </div>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             {/* <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} /> */}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             {/* <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} /> */}
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}

//         {/* Updated 'photo' section for Upload Documents */}
//         {/* {activeTab === "photo" && (
//           <>
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🌃 Restaurant Photo" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )} */}
//       </div>
//     </div>
//   );
// }





















// "use client";


// import FileDropzone from "./FileDropzone";


// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {/* Updated 'photo' section for Fill Information */}
//         {activeTab === "photo" && (
//           <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
//             <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">
//               📄 Fill Information
//             </h3>

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🏷️ Outlet Name
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Outlet Name"
//               value={shopName}
//               onChange={(e) => setShopName(e.target.value)}
//             />

//             <label className="block mb-2 text-sm font-medium text-purple-700">
//               🆔 Restaurant ID
//             </label>
//             <input
//               className={inputClass}
//               placeholder="Enter Restaurant ID"
//               value={restId}
//               onChange={(e) => setRestId(e.target.value)}
//             />
//           </div>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             {/* <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} /> */}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             {/* <input className={inputClass} placeholder="🆔 Restaurant ID" value={restId} onChange={e => setRestId(e.target.value)} /> */}
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}

//         {/* Updated 'photo' section for Upload Documents */}
//         {/* {activeTab === "photo" && (
//           <>
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🌃 Restaurant Photo" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )} */}
//       </div>
//     </div>
//   );
// }























// "use client";

// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {activeTab === "photo" && (
//           <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
//             <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">
//               📄 Fill Information
//             </h3>
//             <label className="block mb-2 text-sm font-medium text-purple-700">🏷️ Outlet Name</label>
//             <input className={inputClass} placeholder="Enter Outlet Name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
//             <label className="block mb-2 text-sm font-medium text-purple-700">🆔 Restaurant ID</label>
//             <input className={inputClass} placeholder="Enter Restaurant ID" value={restId} onChange={(e) => setRestId(e.target.value)} />
//             <label className="block mb-2 text-sm font-medium text-purple-700">📞 Phone Number</label>
//             <input className={inputClass} placeholder="Enter Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
//           </div>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}

//         {activeTab === "photo" && (
//           <>
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="📎 Attachments" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
















// "use client";

// import FileDropzone from "./FileDropzone";

// interface UploadsStepProps {
//   activeTab: string;
//   aadhaarFile: File[];
//   panFile: File[];
//   menuCardFiles: File[];
//   selfieFile: File[];
//   chequeFile: File[];
//   phone: string;
//   email: string;
//   shopName: string;
//   location: string;
//   accountNumber: string;
//   ifscCode: string;
//   restId: string;
//   customerName: string;
//   packageAmount: string;
//   startDate: string;
//   endDate: string;
//   timeline: string;
//   setAadhaarFile: (files: File[]) => void;
//   setPanFile: (files: File[]) => void;
//   setMenuCardFiles: (files: File[]) => void;
//   setSelfieFile: (files: File[]) => void;
//   setChequeFile: (files: File[]) => void;
//   setPhone: (value: string) => void;
//   setEmail: (value: string) => void;
//   setShopName: (value: string) => void;
//   setLocation: (value: string) => void;
//   setAccountNumber: (value: string) => void;
//   setIfscCode: (value: string) => void;
//   setRestId: (value: string) => void;
//   setCustomerName: (value: string) => void;
//   setPackageAmount: (value: string) => void;
//   setStartDate: (value: string) => void;
//   setEndDate: (value: string) => void;
//   setTimeline: (value: string) => void;
// }

// const timelineOptions = [
//   "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
//   "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
//   "11 Months", "12 Months"
// ];

// export default function UploadsStep(props: UploadsStepProps) {
//   const {
//     activeTab, shopName, phone, email, location, accountNumber,
//     ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
//     menuCardFiles, setShopName, setPhone, setEmail, setLocation,
//     setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
//     setSelfieFile, setChequeFile, setMenuCardFiles,
//     restId, setRestId, customerName, setCustomerName,
//     packageAmount, setPackageAmount, startDate, setStartDate,
//     endDate, setEndDate, timeline, setTimeline
//   } = props;

//   const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";
//   const isValidUrl = (str: string) => {
//     try {
//       new URL(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

//         {activeTab === "license" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//           </>
//         )}

//         {activeTab === "photo" && (
//           <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
//             <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">📄 Fill Information</h3>
//             <label className="block mb-2 text-sm font-medium text-purple-700">🏷️ Outlet Name</label>
//             <input className={inputClass} placeholder="Enter Outlet Name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
//             <label className="block mb-2 text-sm font-medium text-purple-700">🆔 Restaurant ID</label>
//             <input className={inputClass} placeholder="Enter Restaurant ID" value={restId} onChange={(e) => setRestId(e.target.value)} />
//             <label className="block mb-2 text-sm font-medium text-purple-700">📞 Phone Number</label>
//             <input className={inputClass} placeholder="Enter Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
//           </div>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//             <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
//             <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
//             {isValidUrl(location) && (
//               <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
//             )}
//             <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
//             <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
//             <input className={inputClass} placeholder="👤 Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
//             <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
//             <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
//             <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
//               <option value="">⏳ Select Timeline</option>
//               {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
//             </select>
//           </>
//         )}
//       </div>

//       <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
//         <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

//         {activeTab === "license" && (
//           <>
//             <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
//           </>
//         )}

//         {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
//           <>
//             <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
//             <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//             <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
//           </>
//         )}

//         {activeTab === "photo" && (
//           <>
//             <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
//             <FileDropzone label="📎 Attachments" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//           </>
//         )}

//         {activeTab === "account" && (
//           <>
//             <FileDropzone label="📎 Attachments" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }




// src/app/components/TaskForm/UploadsStep.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import FileDropzone from "./FileDropzone";
import { Search, Loader2, User, MapPin } from "lucide-react";

// Define TabType locally or import it if it's defined in a shared types file
type TabType = "license" | "swiggy" | "zomato" | "combo" | "photo" | "account" | "other";

interface UploadsStepProps {
  activeTab: TabType | ""; // Changed to allow empty string
  aadhaarFile: File[];
  panFile: File[];
  menuCardFiles: File[];
  selfieFile: File[];
  chequeFile: File[];
  phone: string;
  email: string;
  shopName: string;
  location: string;
  accountNumber: string;
  ifscCode: string;
  restId: string;
  customerName: string;
  packageAmount: string;
  startDate: string;
  endDate: string;
  timeline: string;
  setAadhaarFile: (files: File[]) => void;
  setPanFile: (files: File[]) => void;
  setMenuCardFiles: (files: File[]) => void;
  setSelfieFile: (files: File[]) => void;
  setChequeFile: (files: File[]) => void;
  setPhone: (value: string) => void;
  setEmail: (value: string) => void;
  setShopName: (value: string) => void;
  setLocation: (value: string) => void;
  setAccountNumber: (value: string) => void;
  setIfscCode: (value: string) => void;
  setRestId: (value: string) => void;
  setCustomerName: (value: string) => void;
  setPackageAmount: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setTimeline: (value: string) => void;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  setFullAddress: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setCountry: (value: string) => void;
  setPincode: (value: string) => void;
}

const timelineOptions = [
  "1 Month", "2 Months", "3 Months", "4 Months", "5 Months",
  "6 Months", "7 Months", "8 Months", "9 Months", "10 Months",
  "11 Months", "12 Months"
];

export default function UploadsStep(props: UploadsStepProps) {
  const {
    activeTab, shopName, phone, email, location, accountNumber,
    ifscCode, aadhaarFile, panFile, selfieFile, chequeFile,
    menuCardFiles, setShopName, setPhone, setEmail, setLocation,
    setAccountNumber, setIfscCode, setAadhaarFile, setPanFile,
    setSelfieFile, setChequeFile, setMenuCardFiles,
    restId, setRestId, customerName, setCustomerName,
    packageAmount, setPackageAmount, startDate, setStartDate,
    endDate, setEndDate, timeline, setTimeline,
    fullAddress, setFullAddress, city, setCity, state, setState,
    country, setCountry, pincode, setPincode
  } = props;

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400";

  // Search suggestions when name changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerName.length >= 2 && showSuggestions) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/customers/suggestions?q=${encodeURIComponent(customerName)}`);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error("Failed to fetch suggestions", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (cust: any) => {
    setCustomerName(cust.customerName);
    setShopName(cust.shopName);
    setPhone(cust.phone);
    setFullAddress(cust.fullAddress);
    setCity(cust.city);
    setState(cust.state);
    setPincode(cust.pincode);
    setCountry(cust.country);
    setLocation(cust.location);
    setShowSuggestions(false);
  };
  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg">
        <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📄 Fill Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="col-span-full relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-purple-700 mb-1">👤 Customer Name *</label>
            <div className="relative">
              <input 
                className={`${inputClass} pr-10`}
                placeholder="Type name to see suggestions..." 
                value={customerName} 
                onChange={e => {
                  setCustomerName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || isSearching) && (
              <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto overflow-x-hidden">
                {isSearching && suggestions.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                )}
                {suggestions.map((cust, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCustomer(cust)}
                    className="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-purple-600" />
                      <span className="font-bold text-slate-800 text-sm">{cust.customerName}</span>
                      {cust.shopName && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                          {cust.shopName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-500 truncate italic">
                        {[cust.fullAddress, cust.city, cust.pincode].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-bold text-purple-700 mb-1">🏠 Full Address (House No, Street, Area) *</label>
            <textarea className={`${inputClass} h-20 resize-none`} placeholder="Enter Detailed Address for Invoice" value={fullAddress} onChange={e => setFullAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">🏙️ City *</label>
            <input className={inputClass} placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">📍 Pincode *</label>
            <input className={inputClass} placeholder="6-digit Pincode" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">🏳️ State *</label>
            <input className={inputClass} placeholder="State" value={state} onChange={e => setState(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-1">🌍 Country *</label>
            <input className={inputClass} placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-purple-200 pt-4 mt-4">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">Service Specific Details</p>
        </div>

        {/* Note: The 'other' tab can use these fields if needed. If 'other' has unique fields, create a separate block. */}
        {(activeTab === "license" || activeTab === "other") && (
          <>
            <input className={inputClass} placeholder="🏪 Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} />
            <input className={inputClass} placeholder="📍 Location" value={location} onChange={e => setLocation(e.target.value)} />
            {isValidUrl(location) && (
              <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
            )}
            <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
          </>
        )}

        {activeTab === "photo" && (
          <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-xl text-purple-800 mb-4 border-b pb-3">📄 Fill Information</h3>
            <label className="block mb-2 text-sm font-medium text-purple-700">🏷️ Outlet Name</label>
            <input className={inputClass} placeholder="Enter Outlet Name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            <label className="block mb-2 text-sm font-medium text-purple-700">🆔 Restaurant ID</label>
            <input className={inputClass} placeholder="Enter Restaurant ID" value={restId} onChange={(e) => setRestId(e.target.value)} />
            <label className="block mb-2 text-sm font-medium text-purple-700">📞 Phone Number</label>
            <input className={inputClass} placeholder="Enter Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}

        {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
          <>
            <input className={inputClass} placeholder="🏷️ Outlet Name" value={shopName} onChange={e => setShopName(e.target.value)} />
            <input className={inputClass} placeholder="📞 Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className={inputClass} placeholder="📧 Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className={inputClass} placeholder="📍 Address (Google Maps link allowed)" value={location} onChange={e => setLocation(e.target.value)} />
            {isValidUrl(location) && (
              <a href={location} target="_blank" rel="noopener noreferrer" className="block text-blue-600 mb-4 underline">🔗 View on Map</a>
            )}
            <input className={inputClass} placeholder="🏦 Bank Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
            <input className={inputClass} placeholder="🔢 IFSC Code" value={ifscCode} onChange={e => setIfscCode(e.target.value)} />
          </>
        )}

        {activeTab === "account" && (
          <>
            <input className={inputClass} placeholder="🏪 Restaurant Name" value={shopName} onChange={e => setShopName(e.target.value)} />
            <input className={inputClass} type="date" placeholder="📅 Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input className={inputClass} type="date" placeholder="📅 End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <input className={inputClass} placeholder="💰 Package Amount" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} />
            <select className={inputClass} value={timeline} onChange={e => setTimeline(e.target.value)}>
              <option value="">⏳ Select Timeline</option>
              {timelineOptions.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
        <h3 className="font-bold text-lg text-purple-800 mb-3 border-b pb-2">📤 Upload Documents</h3>

        {(activeTab === "license" || activeTab === "other") && (
          <>
            <FileDropzone label="🆔 Aadhaar Card" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
            <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
            <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
            <FileDropzone label="🏦 Cancelled Cheque" onDrop={setChequeFile} acceptedFiles={chequeFile} />
          </>
        )}

        {(activeTab === "zomato" || activeTab === "swiggy" || activeTab === "combo") && (
          <>
            <FileDropzone label="💳 PAN Card" onDrop={setPanFile} acceptedFiles={panFile} />
            <FileDropzone label="📄 Menu Card (PDF or Image)" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
            <FileDropzone label="🍔 Food License" onDrop={setAadhaarFile} acceptedFiles={aadhaarFile} />
          </>
        )}

        {activeTab === "photo" && (
          <>
            <FileDropzone label="🤳 Selfie Photo" onDrop={setSelfieFile} acceptedFiles={selfieFile} />
            <FileDropzone label="📎 Attachments" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
          </>
        )}

        {activeTab === "account" && (
          <>
            <FileDropzone label="📎 Attachments" onDrop={setMenuCardFiles} acceptedFiles={menuCardFiles} />
          </>
        )}
      </div>
    </div>
  );
}