// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Phone, AlertCircle, Clock } from "lucide-react";

// interface PendingPaymentRow {
//   taskId: string;
//   taskTitle: string;
//   phone?: string;
//   totalAmount: number;
//   receivedAmount: number;
//   pendingAmount: number;
//   paymentStatus: "todo" | "partial" | "paid";
//   latestRemark?: string;
//   nextFollowUpDate?: string;
//   followUpStatus?: string;
//   priorityLevel?: "high" | "medium" | "low";
// }

// export default function PendingPaymentsPage() {
//   const [rows, setRows] = useState<PendingPaymentRow[]>([]);
//   const [loading, setLoading] = useState(false);

//   const loadPendingPayments = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/pending-payments");
//       if (!res.ok) throw new Error("Failed");
//       const data = await res.json();
//       setRows(data.data || []);
//     } catch (err) {
//       console.error("❌ Failed to load pending payments", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadPendingPayments();
//   }, []);

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold flex items-center gap-2">
//         <AlertCircle className="text-red-500" />
//         Pending Payments Chase
//       </h1>

//       <Card>
//         <CardContent className="p-0 overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100 border-b">
//               <tr>
//                 <th className="p-3 text-left">Task</th>
//                 <th className="p-3 text-left">Phone</th>
//                 <th className="p-3 text-right">Total</th>
//                 <th className="p-3 text-right">Received</th>
//                 <th className="p-3 text-right">Pending</th>
//                 <th className="p-3 text-left">Status</th>
//                 <th className="p-3 text-left">Next Follow-up</th>
//                 <th className="p-3 text-left">Priority</th>
//                 <th className="p-3 text-left">Remark</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={10} className="p-6 text-center text-gray-500">
//                     Loading pending payments…
//                   </td>
//                 </tr>
//               ) : rows.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="p-6 text-center text-gray-400">
//                     No pending payments 🎉
//                   </td>
//                 </tr>
//               ) : (
//                 rows.map((r) => {
//                   const overdue =
//                     r.nextFollowUpDate &&
//                     new Date(r.nextFollowUpDate) < new Date();

//                   return (
//                     <tr
//                       key={r.taskId}
//                       className={`border-b hover:bg-gray-50 ${
//                         overdue ? "bg-red-50" : ""
//                       }`}
//                     >
//                       <td className="p-3 font-medium">{r.taskTitle}</td>

//                       <td className="p-3">
//                         {r.phone ? (
//                           <span className="flex items-center gap-1">
//                             <Phone size={14} /> {r.phone}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 text-right">₹{r.totalAmount}</td>
//                       <td className="p-3 text-right text-green-600">
//                         ₹{r.receivedAmount}
//                       </td>
//                       <td className="p-3 text-right font-bold text-red-600">
//                         ₹{r.pendingAmount}
//                       </td>

//                       <td className="p-3 capitalize">{r.paymentStatus}</td>

//                       <td className="p-3 text-xs">
//                         {r.nextFollowUpDate ? (
//                           <span className="flex items-center gap-1">
//                             <Clock size={12} />
//                             {new Date(r.nextFollowUpDate).toLocaleDateString()}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 capitalize">
//                         {r.priorityLevel || "—"}
//                       </td>

//                       <td className="p-3 text-xs max-w-[220px] truncate">
//                         {r.latestRemark || "—"}
//                       </td>

//                       <td className="p-3 text-center">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() =>
//                             window.open(
//                               `/dashboard/tasks/${r.taskId}?tab=remarks`,
//                               "_blank"
//                             )
//                           }
//                         >
//                           Follow-up
//                         </Button>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

















// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Phone, AlertCircle, Clock } from "lucide-react";

// interface PendingPaymentRow {
//   taskId: string;
//   taskTitle: string;
//   phone?: string;
//   totalAmount: number;
//   receivedAmount: number;
//   pendingAmount: number;
//   paymentStatus: "todo" | "partial" | "paid";
//   latestRemark?: string;
//   nextFollowUpDate?: string;
//   priorityLevel?: "high" | "medium" | "low";
// }

// export default function PendingPaymentsPage() {
//   const [rows, setRows] = useState<PendingPaymentRow[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadPendingPayments();
//   }, []);

//   const loadPendingPayments = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/pending-payments");
//       if (!res.ok) throw new Error("Failed to load");
//       const result = await res.json();
//       setRows(result.data || []);
//     } catch (err) {
//       console.error("❌ Failed to load pending payments", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date?: string) => {
//     if (!date) return "—";
//     return new Date(date).toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold flex items-center gap-2">
//         <AlertCircle className="text-red-500" />
//         Pending Payments Chase
//       </h1>

//       <Card>
//         <CardContent className="p-0 overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100 border-b">
//               <tr>
//                 <th className="p-3 text-left">Task</th>
//                 <th className="p-3 text-left">Phone</th>
//                 <th className="p-3 text-right">Total</th>
//                 <th className="p-3 text-right">Received</th>
//                 <th className="p-3 text-right">Pending</th>
//                 <th className="p-3 text-left">Status</th>
//                 <th className="p-3 text-left">Next Follow-up</th>
//                 <th className="p-3 text-left">Priority</th>
//                 <th className="p-3 text-left">Remark</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={10} className="p-6 text-center text-gray-500">
//                     Loading pending payments…
//                   </td>
//                 </tr>
//               ) : rows.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="p-6 text-center text-gray-400">
//                     No pending payments 🎉
//                   </td>
//                 </tr>
//               ) : (
//                 rows.map((r) => {
//                   const overdue =
//                     r.nextFollowUpDate &&
//                     new Date(r.nextFollowUpDate) < new Date();

//                   return (
//                     <tr
//                       key={r.taskId}
//                       className={`border-b hover:bg-gray-50 ${
//                         overdue ? "bg-red-50" : ""
//                       }`}
//                     >
//                       <td className="p-3 font-medium">{r.taskTitle}</td>

//                       <td className="p-3">
//                         {r.phone ? (
//                           <span className="flex items-center gap-1">
//                             <Phone size={14} /> {r.phone}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 text-right">₹{r.totalAmount}</td>
//                       <td className="p-3 text-right text-green-600">
//                         ₹{r.receivedAmount}
//                       </td>
//                       <td className="p-3 text-right font-bold text-red-600">
//                         ₹{r.pendingAmount}
//                       </td>

//                       <td className="p-3 capitalize">{r.paymentStatus}</td>

//                       <td className="p-3 text-xs">
//                         {r.nextFollowUpDate ? (
//                           <span
//                             className={`flex items-center gap-1 ${
//                               overdue ? "text-red-600 font-semibold" : ""
//                             }`}
//                           >
//                             <Clock size={12} />
//                             {formatDate(r.nextFollowUpDate)}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 capitalize">
//                         {r.priorityLevel || "—"}
//                       </td>

//                       <td className="p-3 text-xs max-w-[240px] truncate">
//                         {r.latestRemark || "—"}
//                       </td>

//                       <td className="p-3 text-center">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() =>
//                             window.open(
//                               `/dashboard/tasks/${r.taskId}?tab=remarks`,
//                               "_blank"
//                             )
//                           }
//                         >
//                           Follow-up
//                         </Button>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }












// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Phone, AlertCircle, Clock } from "lucide-react";

// interface PendingPaymentRow {
//   taskId: string;
//   taskTitle: string;
//   phone?: string;
//   totalAmount: number;
//   receivedAmount: number;
//   pendingAmount: number;
//   latestRemark?: string;
//   nextFollowUpDate?: string;
// }

// export default function PendingPaymentsPage() {
//   const [rows, setRows] = useState<PendingPaymentRow[]>([]);
//   const [loading, setLoading] = useState(false);

//   // 🔍 filters
//   const [search, setSearch] = useState("");
//   const [followUpType, setFollowUpType] = useState<"all" | "overdue" | "upcoming">("all");

//   // 📄 pagination
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const limit = 10;

//   useEffect(() => {
//     loadPendingPayments();
//   }, [page, search, followUpType]);

//   const loadPendingPayments = async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: String(page),
//         limit: String(limit),
//         search,
//         followUpType,
//       });

//       const res = await fetch(`/api/pending-payments?${params.toString()}`);
//       if (!res.ok) throw new Error("Failed to load");

//       const result = await res.json();
//       setRows(result.data || []);
//       setTotalPages(result.totalPages || 1);
//     } catch (err) {
//       console.error("❌ Failed to load pending payments", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date?: string) => {
//     if (!date) return "—";
//     return new Date(date).toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold flex items-center gap-2">
//         <AlertCircle className="text-red-500" />
//         Pending Payments Chase
//       </h1>

//       {/* 🔍 Filters */}
//       <div className="flex flex-wrap gap-3">
//         <Input
//           placeholder="Search task or phone…"
//           value={search}
//           onChange={(e) => {
//             setPage(1);
//             setSearch(e.target.value);
//           }}
//           className="w-64"
//         />

//         <select
//           value={followUpType}
//           onChange={(e) => {
//             setPage(1);
//             setFollowUpType(e.target.value as any);
//           }}
//           className="border rounded px-3 py-2 text-sm"
//         >
//           <option value="all">All Follow-ups</option>
//           <option value="overdue">Overdue</option>
//           <option value="upcoming">Upcoming</option>
//         </select>
//       </div>

//       {/* 📊 Table */}
//       <Card>
//         <CardContent className="p-0 overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100 border-b">
//               <tr>
//                 <th className="p-3 text-left">Task</th>
//                 <th className="p-3 text-left">Phone</th>
//                 <th className="p-3 text-right">Total</th>
//                 <th className="p-3 text-right">Received</th>
//                 <th className="p-3 text-right">Pending</th>
//                 <th className="p-3 text-left">Next Follow-up</th>
//                 <th className="p-3 text-left">Remark</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={8} className="p-6 text-center text-gray-500">
//                     Loading pending payments…
//                   </td>
//                 </tr>
//               ) : rows.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="p-6 text-center text-gray-400">
//                     No pending payments 🎉
//                   </td>
//                 </tr>
//               ) : (
//                 rows.map((r) => {
//                   const overdue =
//                     r.nextFollowUpDate &&
//                     new Date(r.nextFollowUpDate) < new Date();

//                   return (
//                     <tr
//                       key={r.taskId}
//                       className={`border-b hover:bg-gray-50 ${
//                         overdue ? "bg-red-50" : ""
//                       }`}
//                     >
//                       <td className="p-3 font-medium">{r.taskTitle}</td>

//                       <td className="p-3">
//                         {r.phone ? (
//                           <span className="flex items-center gap-1">
//                             <Phone size={14} /> {r.phone}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 text-right">₹{r.totalAmount}</td>
//                       <td className="p-3 text-right text-green-600">
//                         ₹{r.receivedAmount}
//                       </td>
//                       <td className="p-3 text-right font-bold text-red-600">
//                         ₹{r.pendingAmount}
//                       </td>

//                       <td className="p-3 text-xs">
//                         {r.nextFollowUpDate ? (
//                           <span
//                             className={`flex items-center gap-1 ${
//                               overdue ? "text-red-600 font-semibold" : ""
//                             }`}
//                           >
//                             <Clock size={12} />
//                             {formatDate(r.nextFollowUpDate)}
//                           </span>
//                         ) : (
//                           "—"
//                         )}
//                       </td>

//                       <td className="p-3 text-xs max-w-[240px] truncate">
//                         {r.latestRemark || "—"}
//                       </td>

//                       <td className="p-3 text-center">
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() =>
//                             window.open(
//                               `/dashboard/tasks/${r.taskId}?tab=remarks`,
//                               "_blank"
//                             )
//                           }
//                         >
//                           Follow-up
//                         </Button>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>

//       {/* 📄 Pagination */}
//       <div className="flex justify-end gap-2">
//         <Button
//           size="sm"
//           variant="outline"
//           disabled={page <= 1}
//           onClick={() => setPage((p) => p - 1)}
//         >
//           Prev
//         </Button>

//         <span className="text-sm px-2 py-1">
//           Page {page} of {totalPages}
//         </span>

//         <Button
//           size="sm"
//           variant="outline"
//           disabled={page >= totalPages}
//           onClick={() => setPage((p) => p + 1)}
//         >
//           Next
//         </Button>
//       </div>
//     </div>
//   );
// }







"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, AlertCircle, Clock } from "lucide-react";

interface PendingPaymentRow {
  taskId: string;
  taskTitle: string;
  shopName: string;
  customerName?: string;
  phone?: string;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  latestRemark?: string;
  nextFollowUpDate?: string;
}

export default function PendingPaymentsPage() {
  const [rows, setRows] = useState<PendingPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔍 filters
  const [search, setSearch] = useState("");
  const [followUpType, setFollowUpType] =
    useState<"all" | "overdue" | "upcoming">("all");

  // 📄 pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadPendingPayments();
  }, [page, search, followUpType]);

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        followUpType,
      });

      const res = await fetch(`/api/pending-payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");

      const result = await res.json();
      setRows(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error("❌ Failed to load pending payments", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertCircle className="text-red-500" />
        Pending Payments – Customer / Shop Wise
      </h1>

      {/* 🔍 Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search shop, customer, phone…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-72"
        />

        <select
          value={followUpType}
          onChange={(e) => {
            setPage(1);
            setFollowUpType(e.target.value as any);
          }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Follow-ups</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      {/* 📊 Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Shop / Customer</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Received</th>
                <th className="p-3 text-right">Pending</th>
                <th className="p-3 text-left">Pending %</th>
                <th className="p-3 text-left">Next Follow-up</th>
                <th className="p-3 text-left">Remark</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    Loading pending payments…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    No pending payments 🎉
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const overdue =
                    r.nextFollowUpDate &&
                    new Date(r.nextFollowUpDate) < new Date();

                  const pendingPercent =
                    r.totalAmount > 0
                      ? (r.pendingAmount / r.totalAmount) * 100
                      : 0;

                  return (
                    <tr
                      key={r.taskId}
                      className={`border-b hover:bg-gray-50 ${
                        overdue ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-medium">{r.shopName}</div>
                        {r.customerName && (
                          <div className="text-xs text-gray-500">
                            {r.customerName}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        {r.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={14} /> {r.phone}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {formatMoney(r.totalAmount)}
                      </td>

                      <td className="p-3 text-right text-green-600">
                        {formatMoney(r.receivedAmount)}
                      </td>

                      <td className="p-3 text-right font-bold text-red-600">
                        {formatMoney(r.pendingAmount)}
                      </td>

                      <td className="p-3 w-32">
                        <div className="h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-2 bg-red-500"
                            style={{ width: `${pendingPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-center mt-1">
                          {pendingPercent.toFixed(1)}%
                        </div>
                      </td>

                      <td className="p-3 text-xs">
                        {r.nextFollowUpDate ? (
                          <span
                            className={`flex items-center gap-1 ${
                              overdue ? "text-red-600 font-semibold" : ""
                            }`}
                          >
                            <Clock size={12} />
                            {formatDate(r.nextFollowUpDate)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-3 text-xs max-w-[220px] truncate">
                        {r.latestRemark || "—"}
                      </td>

                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/dashboard/tasks/${r.taskId}?tab=remarks`,
                              "_blank"
                            )
                          }
                        >
                          Follow-up
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 📄 Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>

        <span className="text-sm px-2 py-1">
          Page {page} of {totalPages}
        </span>

        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}











// // src/lib/applyBoardFilters.ts

// export interface PendingPaymentRow {
//   taskId: string;
//   taskTitle: string;
//   shopName: string;
//   customerName?: string;
//   phone?: string;
//   totalAmount: number;
//   receivedAmount: number;
//   pendingAmount: number;
//   latestRemark?: string;
//   nextFollowUpDate?: string;
// }

// type FollowUpType = "all" | "overdue" | "upcoming";

// interface FilterOptions {
//   search: string;
//   followUpType: FollowUpType;
// }

// export function applyBoardFilters(
//   rows: PendingPaymentRow[],
//   options: FilterOptions
// ) {
//   const { search, followUpType } = options;
//   const now = new Date();

//   return rows.filter((row) => {
//     /* 🔍 SEARCH FILTER */
//     if (search) {
//       const text = search.toLowerCase();

//       const haystack = [
//         row.shopName,
//         row.customerName,
//         row.phone,
//         row.taskTitle,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       if (!haystack.includes(text)) return false;
//     }

//     /* ⏰ FOLLOW-UP FILTER */
//     if (followUpType !== "all") {
//       if (!row.nextFollowUpDate) return false;

//       const followUpDate = new Date(row.nextFollowUpDate);

//       if (followUpType === "overdue" && followUpDate >= now) {
//         return false;
//       }

//       if (followUpType === "upcoming" && followUpDate < now) {
//         return false;
//       }
//     }

//     return true;
//   });
// }
