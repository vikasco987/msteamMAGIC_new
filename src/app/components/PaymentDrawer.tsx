// "use client";

// import React from "react";
// import { Dialog } from "@headlessui/react";
// import { X } from "lucide-react";

// interface PaymentEntry {
//   amount: number;
//   note?: string;
//   date: string;
// }

// interface PaymentDrawerProps {
//   task: {
//     id: string;
//     name?: string;
//     shop?: string;
//     paymentHistory: PaymentEntry[];
//   };
//   onClose: () => void;
// }

// const PaymentDrawer: React.FC<PaymentDrawerProps> = ({ task, onClose }) => {
//   return (
//     <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex">
//       <Dialog.Overlay className="fixed inset-0 bg-black/30" />

//       <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h2 className="text-lg font-bold">Payment History</h2>
//           <button onClick={onClose}>
//             <X className="w-5 h-5 text-gray-600 hover:text-black" />
//           </button>
//         </div>

//         <div className="p-4 space-y-3">
//           <div className="text-sm text-gray-500">
//             <p><strong>Task ID:</strong> {task.id}</p>
//             {task.name && <p><strong>Name:</strong> {task.name}</p>}
//             {task.shop && <p><strong>Shop:</strong> {task.shop}</p>}
//           </div>

//           {task.paymentHistory?.length > 0 ? (
//             task.paymentHistory.map((entry, index) => (
//               <div
//                 key={index}
//                 className="border rounded p-3 bg-gray-50 shadow-sm"
//               >
//                 <p><strong>Amount:</strong> ₹{entry.amount}</p>
//                 <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>
//                 {entry.note && <p><strong>Note:</strong> {entry.note}</p>}
//               </div>
//             ))
//           ) : (
//             <p className="text-gray-500 mt-4">No payment records found.</p>
//           )}
//         </div>
//       </div>
//     </Dialog>
//   );
// };

// export default PaymentDrawer;















// src/app/dashboard/PaymentDrawer.tsx
"use client";

import React from "react";
import { Dialog } from "@headlessui/react"; // Assuming @headlessui/react for this Dialog
import { X } from "lucide-react"; // Assuming lucide-react for the X icon

interface PaymentEntry {
  amount: number;
  note?: string;
  date: string; // Assuming 'date' is a string like an ISO date
}

interface PaymentDrawerProps {
  task: {
    id: string;
    name?: string;
    shop?: string;
    paymentHistory: PaymentEntry[];
  };
  onClose: () => void;
}

const PaymentDrawer: React.FC<PaymentDrawerProps> = ({ task, onClose }) => {
  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex">
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />

      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Payment History</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600 hover:text-black" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-500">
            <p><strong>Task ID:</strong> {task.id}</p>
            {task.name && <p><strong>Name:</strong> {task.name}</p>}
            {task.shop && <p><strong>Shop:</strong> {task.shop}</p>}
          </div>

          {task.paymentHistory?.length > 0 ? (
            task.paymentHistory.map((entry, index) => (
              <div
                key={index}
                className="border rounded p-3 bg-gray-50 shadow-sm"
              >
                <p><strong>Amount:</strong> ₹{entry.amount}</p>
                {/* Assuming 'date' on PaymentEntry from the frontend is compatible with Date constructor */}
                <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>
                {entry.note && <p><strong>Note:</strong> {entry.note}</p>}
              </div>
            ))
          ) : (
            <p className="text-gray-500 mt-4">No payment records found.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PaymentDrawer;