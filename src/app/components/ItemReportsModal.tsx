import React, { useState } from "react";
import { X, User, ChevronDown, ChevronUp, CheckCircle, Package } from "lucide-react";

interface ItemReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  serials: any[];
}

export default function ItemReportsModal({ isOpen, onClose, itemName, serials }: ItemReportsModalProps) {
  const [activeTab, setActiveTab] = useState<"added" | "used">("added");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  if (!isOpen) return null;

  // Process "Added By" Data
  const addedByGroups: Record<string, any[]> = {};
  serials.forEach(s => {
    const creator = s.createdByName || "Unknown User";
    if (!addedByGroups[creator]) addedByGroups[creator] = [];
    addedByGroups[creator].push(s);
  });

  const addedByList = Object.keys(addedByGroups).map(name => ({
    name,
    count: addedByGroups[name].length,
    serials: addedByGroups[name]
  })).sort((a, b) => b.count - a.count);

  // Process "Used By" Data (Only serials that have a task attached)
  const usedByGroups: Record<string, any[]> = {};
  const usedSerials = serials.filter(s => s.task);
  
  usedSerials.forEach(s => {
    // Assuming task creator is the user who used it
    const user = s.task.createdByName || s.task.assigneeName || "Unknown User";
    if (!usedByGroups[user]) usedByGroups[user] = [];
    usedByGroups[user].push(s);
  });

  const usedByList = Object.keys(usedByGroups).map(name => ({
    name,
    count: usedByGroups[name].length,
    serials: usedByGroups[name]
  })).sort((a, b) => b.count - a.count);

  const toggleExpand = (userName: string) => {
    setExpandedUser(prev => prev === userName ? null : userName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Inventory Reports</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Item: <span className="text-indigo-600 font-bold">{itemName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab("added")}
            className={`pb-3 font-bold text-sm transition-all relative flex items-center gap-2 ${
              activeTab === "added" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package size={16} />
            Added By Report
          </button>
          <button
            onClick={() => setActiveTab("used")}
            className={`pb-3 font-bold text-sm transition-all relative flex items-center gap-2 ${
              activeTab === "used" ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle size={16} />
            Used By Report
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {/* Added By Tab */}
          {activeTab === "added" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center mb-6">
                <span className="font-bold text-indigo-800">Total Items Added</span>
                <span className="text-2xl font-black text-indigo-600">{serials.length}</span>
              </div>

              {addedByList.length === 0 ? (
                <p className="text-center text-slate-400 font-medium py-8">No records found.</p>
              ) : (
                addedByList.map((user, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div 
                      onClick={() => toggleExpand(user.name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.count} items added</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">
                          {user.count}
                        </span>
                        {expandedUser === user.name ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                      </div>
                    </div>

                    {expandedUser === user.name && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Serial Numbers</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {user.serials.map((s, sIdx) => (
                            <div key={sIdx} className="bg-white border border-slate-200 p-2 rounded text-xs font-mono text-slate-600 text-center shadow-sm">
                              {s.number}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Used By Tab */}
          {activeTab === "used" && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex justify-between items-center mb-6">
                <span className="font-bold text-rose-800">Total Items Used in Tasks</span>
                <span className="text-2xl font-black text-rose-600">{usedSerials.length}</span>
              </div>

              {usedByList.length === 0 ? (
                <p className="text-center text-slate-400 font-medium py-8">No items have been used in tasks yet.</p>
              ) : (
                usedByList.map((user, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div 
                      onClick={() => toggleExpand(`used-${user.name}`)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.count} items used</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-sm font-bold">
                          {user.count}
                        </span>
                        {expandedUser === `used-${user.name}` ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                      </div>
                    </div>

                    {expandedUser === `used-${user.name}` && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                        <div className="space-y-2">
                          {user.serials.map((s, sIdx) => (
                            <div key={sIdx} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-mono font-bold text-slate-700">{s.number}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">Task: {s.task?.title || "Unknown Task"}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase self-start sm:self-auto">
                                {new Date(s.task?.createdAt || s.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
