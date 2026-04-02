// // src/app/seller-remarks/page.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import PaymentRemarks, { Remark } from "../../components/PaymentRemarks";
// import GlobalRemarks from "../../components/GlobalRemarks";
// import { Button } from "../../../components/ui/button";

// interface Task {
//   id: string;
//   title: string;
//   amount: number;
//   status: string;
//   taskType?: string;
//   shopName?: string;
//   phone?: string;
//   customerName?: string;
//   outletName?: string;
//   remarks?: Remark[];
// }

// export default function SellerRemarksPage() {
//   const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
//   const [viewMode, setViewMode] = useState<"task" | "global">("task");
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalTasks, setTotalTasks] = useState(0);
//   const limit = 10;

//   const loadTasks = async (pageNumber = 1) => {
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `/api/tasks/paginated?page=${pageNumber}&limit=${limit}`
//       );
//       if (!res.ok) throw new Error("Failed to fetch tasks");
//       const data = await res.json();

//       // Include phone, customerName, and outletName
//       setPendingTasks(data.tasks || []);
//       setTotalTasks(data.total || data.tasks.length || 0);
//       setPage(pageNumber);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (viewMode === "task") loadTasks(1);
//   }, [viewMode]);

//   const totalPages = Math.ceil(totalTasks / limit);

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">📝 Pending Payment Remarks</h1>
//         <div className="space-x-2">
//           <Button
//             variant={viewMode === "task" ? "default" : "outline"}
//             onClick={() => setViewMode("task")}
//           >
//             Per Task View
//           </Button>
//           <Button
//             variant={viewMode === "global" ? "default" : "outline"}
//             onClick={() => setViewMode("global")}
//           >
//             Global View
//           </Button>
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading tasks...</p>
//       ) : viewMode === "task" ? (
//         pendingTasks.length === 0 ? (
//           <p className="text-gray-500">No pending payments right now</p>
//         ) : (
//           <div className="space-y-4">
//             {pendingTasks.map((task, idx) => (
//               <div
//                 key={task.id}
//                 className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
//               >
//                 <div className="flex justify-between items-center">
//                   <h2 className="text-lg font-semibold">
//                     #{(page - 1) * limit + idx + 1} {task.title}{" "}
//                     {task.taskType && (
//                       <span className="text-sm text-gray-500">
//                         ({task.taskType})
//                       </span>
//                     )}
//                   </h2>
//                   <span className="text-red-600">Pending ₹{task.amount}</span>
//                 </div>

//                 {(task.shopName || task.phone || task.customerName || task.outletName) && (
//                   <div className="text-sm text-gray-600 space-x-4">
//                     {task.shopName && <span>🏬 {task.shopName}</span>}
//                     {task.phone && <span>📞 {task.phone}</span>}
//                     {task.customerName && <span>👤 {task.customerName}</span>}
//                     {task.outletName && <span>🏪 {task.outletName}</span>}
//                   </div>
//                 )}

//                 <PaymentRemarks remarks={task.remarks || []} taskId={task.id} />
//               </div>
//             ))}

//             {totalPages > 1 && (
//               <div className="flex justify-center items-center gap-3 mt-4">
//                 <Button
//                   disabled={page <= 1 || loading}
//                   onClick={() => loadTasks(page - 1)}
//                 >
//                   Previous
//                 </Button>
//                 <span className="text-sm text-gray-600">
//                   Page {page} of {totalPages} | Total: {totalTasks} tasks
//                 </span>
//                 <Button
//                   disabled={page >= totalPages || loading}
//                   onClick={() => loadTasks(page + 1)}
//                 >
//                   Next
//                 </Button>
//               </div>
//             )}
//           </div>
//         )
//       ) : (
//         <GlobalRemarks />
//       )}
//     </div>
//   );
// }














// // src/app/seller-remarks/page.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import PaymentRemarks, { Remark } from "../../components/PaymentRemarks";
// import GlobalRemarks from "../../components/GlobalRemarks";
// import { Button } from "../../../components/ui/button";

// interface Task {
//   id: string;
//   title: string;
//   amount: number;
//   // optional field if your backend uses this name
//   received?: number;
//   status: string;
//   taskType?: string;
//   shopName?: string;
//   phone?: string;
//   customerName?: string;
//   outletName?: string;
//   remarks?: Remark[];
// }

// export default function SellerRemarksPage() {
//   const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
//   const [viewMode, setViewMode] = useState<"task" | "global">("task");
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalTasks, setTotalTasks] = useState(0);
//   const limit = 10;

//   const loadTasks = async (pageNumber = 1) => {
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `/api/tasks/paginated?page=${pageNumber}&limit=${limit}`
//       );
//       if (!res.ok) throw new Error("Failed to fetch tasks");
//       const data = await res.json();

//       // Include phone, customerName, and outletName
//       setPendingTasks(data.tasks || []);
//       setTotalTasks(data.total || data.tasks.length || 0);
//       setPage(pageNumber);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (viewMode === "task") loadTasks(1);
//   }, [viewMode]);

//   const totalPages = Math.ceil(totalTasks / limit);

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">📝 Pending Payment Remarks</h1>
//         <div className="space-x-2">
//           <Button
//             variant={viewMode === "task" ? "default" : "outline"}
//             onClick={() => setViewMode("task")}
//           >
//             Per Task View
//           </Button>
//           <Button
//             variant={viewMode === "global" ? "default" : "outline"}
//             onClick={() => setViewMode("global")}
//           >
//             Global View
//           </Button>
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading tasks...</p>
//       ) : viewMode === "task" ? (
//         pendingTasks.length === 0 ? (
//           <p className="text-gray-500">No pending payments right now</p>
//         ) : (
//           <div className="space-y-4">
//             {pendingTasks.map((task, idx) => {
//               // Calculate received amount:
//               // 1) prefer task.received (or task.amountReceived)
//               // 2) else sum amountReceived from remarks (if present)
//               const receivedFromTask =
//                 (task as any).received ?? (task as any).amountReceived ?? 0;

//               const receivedFromRemarks =
//                 Array.isArray(task.remarks) && task.remarks.length > 0
//                   ? task.remarks.reduce(
//                       (s, r) => s + (r.amountReceived ?? 0),
//                       0
//                     )
//                   : 0;

//               // prefer explicit task.received if it's present (>0), otherwise use remarks sum
//               const received =
//                 receivedFromTask > 0 ? receivedFromTask : receivedFromRemarks;

//               const pendingAmount = Math.max(0, (task.amount ?? 0) - (received ?? 0));

//               return (
//                 <div
//                   key={task.id}
//                   className="border rounded-lg p-4 shadow-sm bg-white space-y-2"
//                 >
//                   <div className="flex justify-between items-center">
//                     <h2 className="text-lg font-semibold">
//                       #{(page - 1) * limit + idx + 1} {task.title}{" "}
//                       {task.taskType && (
//                         <span className="text-sm text-gray-500">
//                           ({task.taskType})
//                         </span>
//                       )}
//                     </h2>

//                     {/* <-- corrected pending amount display --> */}
//                     <span className="text-red-600">Pending ₹{pendingAmount.toLocaleString()}</span>
//                   </div>

//                   {(task.shopName || task.phone || task.customerName || task.outletName) && (
//                     <div className="text-sm text-gray-600 space-x-4">
//                       {task.shopName && <span>🏬 {task.shopName}</span>}
//                       {task.phone && <span>📞 {task.phone}</span>}
//                       {task.customerName && <span>👤 {task.customerName}</span>}
//                       {task.outletName && <span>🏪 {task.outletName}</span>}
//                     </div>
//                   )}

//                   <PaymentRemarks remarks={task.remarks || []} taskId={task.id} />
//                 </div>
//               );
//             })}

//             {totalPages > 1 && (
//               <div className="flex justify-center items-center gap-3 mt-4">
//                 <Button
//                   disabled={page <= 1 || loading}
//                   onClick={() => loadTasks(page - 1)}
//                 >
//                   Previous
//                 </Button>
//                 <span className="text-sm text-gray-600">
//                   Page {page} of {totalPages} | Total: {totalTasks} tasks
//                 </span>
//                 <Button
//                   disabled={page >= totalPages || loading}
//                   onClick={() => loadTasks(page + 1)}
//                 >
//                   Next
//                 </Button>
//               </div>
//             )}
//           </div>
//         )
//       ) : (
//         <GlobalRemarks />
//       )}
//     </div>
//   );
// }












// "use client";

// import React, { useEffect, useState } from "react";
// import PaymentRemarks, { Remark } from "../../components/PaymentRemarks";
// import GlobalRemarks from "../../components/GlobalRemarks";
// import { Button } from "../../../components/ui/button";
// import { X } from "lucide-react";

// interface Task {
//   id: string;
//   title: string;
//   amount: number;
//   received?: number;
//   status: string;
//   taskType?: string;
//   shopName?: string;
//   phone?: string;
//   customerName?: string;
//   outletName?: string;
//   remarks?: Remark[];
// }

// export default function SellerRemarksPage() {
//   const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
//   const [viewMode, setViewMode] = useState<"task" | "global">("task");
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalTasks, setTotalTasks] = useState(0);
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
//   const limit = 10;

//   const loadTasks = async (pageNumber = 1) => {
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `/api/tasks/paginated?page=${pageNumber}&limit=${limit}`
//       );
//       if (!res.ok) throw new Error("Failed to fetch tasks");
//       const data = await res.json();
//       setPendingTasks(data.tasks || []);
//       setTotalTasks(data.total || data.tasks.length || 0);
//       setPage(pageNumber);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (viewMode === "task") loadTasks(1);
//   }, [viewMode]);

//   const totalPages = Math.ceil(totalTasks / limit);

//   return (
//     <div className="p-6 space-y-6 relative">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">📝 Pending Payment Remarks</h1>
//         <div className="space-x-2">
//           <Button
//             variant={viewMode === "task" ? "default" : "outline"}
//             onClick={() => setViewMode("task")}
//           >
//             Per Task View
//           </Button>
//           <Button
//             variant={viewMode === "global" ? "default" : "outline"}
//             onClick={() => setViewMode("global")}
//           >
//             Global View
//           </Button>
//         </div>
//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading tasks...</p>
//       ) : viewMode === "task" ? (
//         pendingTasks.length === 0 ? (
//           <p className="text-gray-500">No pending payments right now</p>
//         ) : (
//           <div className="space-y-3">
//             {pendingTasks.map((task, idx) => {
//               const received =
//                 (task as any).received ??
//                 (task as any).amountReceived ??
//                 task.remarks?.reduce(
//                   (sum, r) => sum + (r.amountReceived ?? 0),
//                   0
//                 ) ??
//                 0;
//               const pendingAmount = Math.max(0, (task.amount ?? 0) - received);

//               return (
//                 <div
//                   key={task.id}
//                   onClick={() => setSelectedTask(task)}
//                   className="cursor-pointer border rounded-lg p-4 shadow-sm bg-white hover:bg-gray-50 transition flex justify-between items-center"
//                 >
//                   <div>
//                     <h2 className="font-semibold">
//                       #{(page - 1) * limit + idx + 1} 📂 {task.title}
//                     </h2>
//                     {task.shopName && (
//                       <p className="text-sm text-gray-600">🏬 {task.shopName}</p>
//                     )}
//                   </div>
//                   <span
//                     className={`font-semibold ${
//                       pendingAmount === 0
//                         ? "text-green-600"
//                         : "text-red-600"
//                     }`}
//                   >
//                     Pending ₹{pendingAmount.toLocaleString()}
//                   </span>
//                 </div>
//               );
//             })}

//             {totalPages > 1 && (
//               <div className="flex justify-center items-center gap-3 mt-4">
//                 <Button
//                   disabled={page <= 1 || loading}
//                   onClick={() => loadTasks(page - 1)}
//                 >
//                   Previous
//                 </Button>
//                 <span className="text-sm text-gray-600">
//                   Page {page} of {totalPages} | Total: {totalTasks} tasks
//                 </span>
//                 <Button
//                   disabled={page >= totalPages || loading}
//                   onClick={() => loadTasks(page + 1)}
//                 >
//                   Next
//                 </Button>
//               </div>
//             )}
//           </div>
//         )
//       ) : (
//         <GlobalRemarks />
//       )}

//       {/* Drawer for Remarks */}
//       {selectedTask && (
//         <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
//           <div className="bg-white w-full sm:w-[480px] h-full shadow-xl p-6 relative overflow-y-auto">
//             <button
//               className="absolute top-4 right-4 text-gray-600 hover:text-black"
//               onClick={() => setSelectedTask(null)}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-bold mb-2">
//               {selectedTask.title}
//             </h2>
//             <p className="text-sm text-gray-600 mb-4">
//               🏬 {selectedTask.shopName || "No shop info"}
//             </p>

//             <PaymentRemarks
//               remarks={selectedTask.remarks || []}
//               taskId={selectedTask.id}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }














// src/app/seller-remarks/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import PaymentRemarks, { Remark } from "../../components/PaymentRemarks";
import GlobalRemarks from "../../components/GlobalRemarks";
import { Button } from "../../../components/ui/button";
import { X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  amount: number;
  received?: number;
  status: string;
  taskType?: string;
  shopName?: string;
  phone?: string;
  customerName?: string;
  outletName?: string;
  remarks?: Remark[];
}

export default function SellerRemarksPage() {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"task" | "global">("task");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const limit = 10;

  const loadTasks = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tasks/paginated?page=${pageNumber}&limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setPendingTasks(data.tasks || []);
      setTotalTasks(data.total || data.tasks.length || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "task") loadTasks(1);
  }, [viewMode]);

  const totalPages = Math.ceil(totalTasks / limit);

  return (
    <div className="p-6 space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📝 Pending Payment Remarks</h1>
        <div className="space-x-2">
          <Button
            variant={viewMode === "task" ? "default" : "outline"}
            onClick={() => setViewMode("task")}
          >
            Per Task View
          </Button>
          <Button
            variant={viewMode === "global" ? "default" : "outline"}
            onClick={() => setViewMode("global")}
          >
            Global View
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : viewMode === "task" ? (
        pendingTasks.length === 0 ? (
          <p className="text-gray-500">No pending payments right now</p>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task, idx) => {
              const received =
                (task as any).received ??
                (task as any).amountReceived ??
                task.remarks?.reduce(
                  (sum, r) => sum + (r.amountReceived ?? 0),
                  0
                ) ??
                0;
              const pendingAmount = Math.max(0, (task.amount ?? 0) - received);

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="cursor-pointer border rounded-lg p-4 shadow-sm bg-white hover:bg-gray-50 transition flex justify-between items-center"
                >
                  <div>
                    <h2 className="font-semibold">
                      #{(page - 1) * limit + idx + 1} 📂 {task.title}
                    </h2>

                    <div className="text-sm text-gray-600 space-y-0.5">
                      {task.shopName && <p>🏬 {task.shopName}</p>}
                      {task.phone && <p>📞 {task.phone}</p>}
                      {task.customerName && <p>👤 {task.customerName}</p>}
                      {task.outletName && <p>🏪 {task.outletName}</p>}
                    </div>
                  </div>

                  <span
                    className={`font-semibold ${
                      pendingAmount === 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Pending ₹{pendingAmount.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-4">
                <Button
                  disabled={page <= 1 || loading}
                  onClick={() => loadTasks(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages} | Total: {totalTasks} tasks
                </span>
                <Button
                  disabled={page >= totalPages || loading}
                  onClick={() => loadTasks(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        <GlobalRemarks />
      )}

      {/* Drawer for Remarks */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full sm:w-[480px] h-full shadow-xl p-6 relative overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black"
              onClick={() => setSelectedTask(null)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2">
              {selectedTask.title}
            </h2>

            <div className="text-sm text-gray-600 mb-4 space-y-1">
              {selectedTask.shopName && <p>🏬 {selectedTask.shopName}</p>}
              {selectedTask.phone && <p>📞 {selectedTask.phone}</p>}
              {selectedTask.customerName && (
                <p>👤 {selectedTask.customerName}</p>
              )}
              {selectedTask.outletName && <p>🏪 {selectedTask.outletName}</p>}
            </div>

            <PaymentRemarks
              remarks={selectedTask.remarks || []}
              taskId={selectedTask.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
