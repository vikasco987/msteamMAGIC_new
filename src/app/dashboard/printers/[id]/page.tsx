"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeftIcon,
  TruckIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export default function PrinterHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [printer, setPrinter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/printers/${id}`)
      .then(res => res.json())
      .then(data => {
        setPrinter(data.printer);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Printer Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-semibold hover:underline">
          &larr; Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/dashboard/printers" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4 transition-colors">
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Funnel
          </Link>
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="text-indigo-600">🖨️</span> {printer.number}
              </h1>
              <p className="text-slate-500 mt-2 font-medium">Complete lifecycle and dispatch history</p>
            </div>
            
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatches</p>
                <p className="text-2xl font-black text-slate-800">{printer.dispatchCount}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">RTOs</p>
                <p className="text-2xl font-black text-red-600">{printer.rtoCount}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                  printer.status === 'Available' ? 'bg-blue-100 text-blue-700' :
                  printer.status === 'Returned' ? 'bg-orange-100 text-orange-700' :
                  printer.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {printer.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4">Lifecycle Timeline</h2>
          
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-12">
            {printer.dispatches && printer.dispatches.length > 0 ? printer.dispatches.map((dispatch: any, index: number) => {
              const isRTO = dispatch.trackingStatus === "RTO";
              const isDelivered = dispatch.trackingStatus === "Delivered";
              const isInTransit = !isRTO && !isDelivered;

              return (
                <div key={dispatch.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                    isDelivered ? 'bg-emerald-500' : 
                    isRTO ? 'bg-red-500' : 
                    'bg-indigo-500'
                  }`}>
                    {isDelivered ? <CheckBadgeIcon className="w-4 h-4 text-white" /> : 
                     isRTO ? <ExclamationCircleIcon className="w-4 h-4 text-white" /> : 
                     <TruckIcon className="w-4 h-4 text-white" />}
                  </div>

                  {/* Content Card */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cycle #{dispatch.cycleNumber || printer.dispatchCount - index}</span>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDelivered ? 'bg-emerald-100 text-emerald-700' : 
                            isRTO ? 'bg-red-100 text-red-700' : 
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {dispatch.trackingStatus}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mt-1">
                          {dispatch.task?.title || "Unknown Task"}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-600">
                          {new Date(dispatch.dispatchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Dispatch Date</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Task ID</p>
                          <Link href={`/dashboard/tasks?id=${dispatch.taskId}`} className="text-sm font-semibold text-indigo-600 hover:underline">
                            {dispatch.taskId}
                          </Link>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                        <TruckIcon className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AWB Number</p>
                          <p className="text-sm font-semibold text-slate-800">{dispatch.awbNumber}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* If RTO, show reason if available from customFields */}
                    {isRTO && dispatch.task?.customFields?.rtoReason && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">RTO Reason</p>
                        <p className="text-sm font-semibold text-red-800">{dispatch.task.customFields.rtoReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <p className="text-slate-500 italic pl-8 font-medium">No dispatch history available for this printer.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
