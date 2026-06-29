"use client";

import React, { useEffect, useState } from "react";

export default function InventoryDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: "", sku: "", quantity: "0", type: "HARDWARE" });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemData)
      });
      setShowAddModal(false);
      setNewItemData({ name: "", sku: "", quantity: "0", type: "HARDWARE" });
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventory Management</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Track Hardware & Software Stock
            </p>
          </div>

          <div className="flex gap-4">
            <a href="/dispatch" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors">
              Dispatch Dashboard
            </a>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
            >
              + Add Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-400 font-bold p-4 text-center col-span-3">Loading inventory...</p>
          ) : items.length === 0 ? (
            <p className="text-slate-400 font-bold p-4 text-center col-span-3">No inventory items found. Add one to get started.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                      item.type === "HARDWARE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.type}
                    </span>
                    {item.sku && <span className="text-xs font-mono text-slate-400">{item.sku}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{item.name}</h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Stock</p>
                    <p className={`text-3xl font-black ${item.quantity > 5 ? "text-slate-800" : "text-rose-600"}`}>
                      {item.quantity}
                    </p>
                  </div>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Edit Stock
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-black text-slate-800 mb-6">Add New Inventory Item</h2>
            <form onSubmit={handleAddItem} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</label>
                <input 
                  required
                  type="text" 
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="e.g. Printer, Printer Plus Software"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SKU / Model (Optional)</label>
                <input 
                  type="text" 
                  value={newItemData.sku}
                  onChange={(e) => setNewItemData({...newItemData, sku: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="e.g. PRN-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Quantity</label>
                  <input 
                    required
                    type="number" 
                    value={newItemData.quantity}
                    onChange={(e) => setNewItemData({...newItemData, quantity: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Type</label>
                  <select 
                    value={newItemData.type}
                    onChange={(e) => setNewItemData({...newItemData, type: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
