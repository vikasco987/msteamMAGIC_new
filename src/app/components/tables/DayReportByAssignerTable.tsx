// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LabelList,
// } from "recharts";

// export default function DayReportByAssignerBar() {
//   const [data, setData] = useState<any[]>([]);
//   const [details, setDetails] = useState<any[]>([]);
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);

//   useEffect(() => {
//     fetch("/api/stats/user-performance/day-report-by-assigner")
//       .then((res) => res.json())
//       .then((json) => setData(json.data || []));
//   }, []);

//   const fetchDetails = async (date: string) => {
//     setSelectedDate(date);
//     const res = await fetch(`/api/stats/user-performance/day-report-by-assigner?date=${date}`);
//     const json = await res.json();
//     setDetails(json.details || []);
//   };

//   return (
//     <div className="bg-white shadow-md rounded-xl border p-4">
//       <h2 className="text-lg font-semibold mb-4">📊 Day-by-Day Assigner Sales</h2>
//       <div style={{ width: "100%", height: 300 }}>
//         <ResponsiveContainer>
//           <BarChart
//             data={data}
//             layout="vertical"
//             margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
//             onClick={(state) => {
//               if (state && state.activePayload && state.activePayload[0]) {
//                 const date = state.activePayload[0].payload.date;
//                 fetchDetails(date);
//               }
//             }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis type="number" />
//             <YAxis dataKey="date" type="category" width={100} />
//             <Tooltip />
//             <Bar dataKey="totalRevenue" fill="#4f46e5" radius={[0, 6, 6, 0]}>
//               <LabelList dataKey="totalSales" position="insideRight" fill="#fff" />
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {selectedDate && details.length > 0 && (
//         <div className="mt-6">
//           <h3 className="text-md font-semibold mb-2">📌 Details for {selectedDate}</h3>
//           <table className="min-w-full text-sm border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2">Assigner</th>
//                 <th className="p-2">Email</th>
//                 <th className="p-2">Sales</th>
//                 <th className="p-2">Revenue</th>
//                 <th className="p-2">Received</th>
//               </tr>
//             </thead>
//             <tbody>
//               {details.map((d, idx) => (
//                 <tr key={idx} className="border-b">
//                   <td className="p-2">{d.assigner}</td>
//                   <td className="p-2">{d.email}</td>
//                   <td className="p-2">{d.totalSales}</td>
//                   <td className="p-2">₹{d.totalRevenue.toLocaleString()}</td>
//                   <td className="p-2">₹{d.amountReceived.toLocaleString()}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }












// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LabelList,
// } from "recharts";

// export default function DayReportByAssignerBar() {
//   const [data, setData] = useState<any[]>([]);
//   const [details, setDetails] = useState<any[]>([]);
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);

//   useEffect(() => {
//     fetch("/api/stats/user-performance/day-report-by-assigner")
//       .then((res) => res.json())
//       .then((json) => setData(json.data || []));
//   }, []);

//   const fetchDetails = async (date: string) => {
//     setSelectedDate(date);
//     const res = await fetch(`/api/stats/user-performance/day-report-by-assigner?date=${date}`);
//     const json = await res.json();
//     setDetails(json.details || []);
//   };

//   return (
//     <div className="bg-white shadow-md rounded-xl border p-4">
//       <h2 className="text-lg font-semibold mb-4">📊 Day-by-Day Assigner Sales</h2>
//       <div style={{ width: "100%", height: 300 }}>
//         <ResponsiveContainer>
//           <BarChart
//             data={data}
//             layout="vertical"
//             margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
//             onClick={(state) => {
//               if (state && state.activePayload && state.activePayload[0]) {
//                 const date = state.activePayload[0].payload.date;
//                 fetchDetails(date);
//               }
//             }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis type="number" />
//             <YAxis dataKey="date" type="category" width={100} />
//             <Tooltip />
//             <Bar dataKey="totalRevenue" fill="#4f46e5" radius={[0, 6, 6, 0]}>
//               <LabelList dataKey="totalSales" position="insideRight" fill="#fff" />
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {selectedDate && details.length > 0 && (
//         <div className="mt-6 overflow-x-auto">
//           <h3 className="text-md font-semibold mb-2">📌 Details for {selectedDate}</h3>
//           <table className="min-w-full text-sm border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border-r">Assigner</th>
//                 <th className="p-2 border-r">Email</th>
//                 <th className="p-2 border-r">Sales</th>
//                 <th className="p-2 border-r text-right">Revenue</th>
//                 <th className="p-2 border-r text-right">Received</th>
//                 <th className="p-2 text-right">Pending %</th> {/* NEW COLUMN HEADER */}
//               </tr>
//             </thead>
//             <tbody>
//               {details.map((d, idx) => {
//                 // Calculate pending amount (assuming it's not present and needs derivation, 
//                 // but if the API returns pendingAmount, it should be used)
//                 const pendingAmount = d.totalRevenue - d.amountReceived;
                
//                 // Calculate pending percentage
//                 const pendingPercentage = d.totalRevenue > 0
//                   ? (pendingAmount / d.totalRevenue) * 100
//                   : 0;
                  
//                 return (
//                   <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
//                     <td className="p-2 border-r">{d.assigner}</td>
//                     <td className="p-2 border-r">{d.email}</td>
//                     <td className="p-2 border-r text-center">{d.totalSales}</td>
//                     <td className="p-2 border-r text-right font-medium">₹{d.totalRevenue.toLocaleString()}</td>
//                     <td className="p-2 border-r text-right text-blue-600">₹{d.amountReceived.toLocaleString()}</td>
//                     {/* NEW COLUMN DATA CELL */}
//                     <td className="p-2 text-right font-semibold">
//                       <span className={`px-2 py-0.5 rounded-full text-xs ${
//                             pendingPercentage.toFixed(0) === '0'
//                               ? 'bg-green-100 text-green-700'
//                               : 'bg-red-100 text-red-700'
//                           }`}
//                       >
//                           {pendingPercentage.toFixed(1)}%
//                       </span>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }














"use client";
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export default function DayReportByAssignerBar() {
  const [data, setData] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats/user-performance/day-report-by-assigner")
      .then((res) => res.json())
      .then((json) => setData(json.data || []));
  }, []);

  const fetchDetails = async (date: string) => {
    setSelectedDate(date);
    const res = await fetch(`/api/stats/user-performance/day-report-by-assigner?date=${date}`);
    const json = await res.json();
    setDetails(json.details || []);
  };

  return (
    <div className="bg-white shadow-md rounded-xl border p-4">
      <h2 className="text-lg font-semibold mb-4">📊 Day-by-Day Assigner Sales</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0]) {
                const date = state.activePayload[0].payload.date;
                fetchDetails(date);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="date" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="totalRevenue" fill="#4f46e5" radius={[0, 6, 6, 0]}>
              <LabelList dataKey="totalSales" position="insideRight" fill="#fff" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedDate && details.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <h3 className="text-md font-semibold mb-2">📌 Details for {selectedDate}</h3>
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border-r">Assigner</th>
                <th className="p-2 border-r">Email</th>
                <th className="p-2 border-r">Sales</th>
                <th className="p-2 border-r text-right">Revenue</th>
                <th className="p-2 border-r text-right">Received</th>
                <th className="p-2 text-right">Pending %</th> {/* Pending % column is here */}
              </tr>
            </thead>
            <tbody>
              {details.map((d, idx) => {
                // Calculate pending amount 
                const pendingAmount = d.totalRevenue - d.amountReceived;
                
                // Calculate pending percentage
                const pendingPercentage = d.totalRevenue > 0
                  ? (pendingAmount / d.totalRevenue) * 100
                  : 0;
                  
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-2 border-r">{d.assigner}</td>
                    <td className="p-2 border-r">{d.email}</td>
                    <td className="p-2 border-r text-center">{d.totalSales}</td>
                    <td className="p-2 border-r text-right font-medium">₹{d.totalRevenue.toLocaleString()}</td>
                    <td className="p-2 border-r text-right text-blue-600">₹{d.amountReceived.toLocaleString()}</td>
                    {/* Displaying Pending Percentage */}
                    <td className="p-2 text-right font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                            pendingPercentage.toFixed(0) === '0'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                          {pendingPercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}