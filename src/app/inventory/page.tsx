"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, Printer, RotateCcw, AlertTriangle, CheckCircle, Clock, Truck, ShieldAlert, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function InventoryDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control: "stock" or "tracker"
  const [activeDashboardTab, setActiveDashboardTab] = useState<"stock" | "tracker">("stock");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: "", sku: "", quantity: "0", type: "HARDWARE" });

  // Edit Stock modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Software fields
  const [softwareAction, setSoftwareAction] = useState<"increment" | "decrement" | "set">("increment");
  const [softwareQty, setSoftwareQty] = useState("0");

  // Hardware serial number fields
  const [serialNumbersText, setSerialNumbersText] = useState("");
  const [existingSerials, setExistingSerials] = useState<any[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [submittingSerials, setSubmittingSerials] = useState(false);

  // Printer Tracking Dashboard states
  const [trackerSerials, setTrackerSerials] = useState<any[]>([]);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState("");

  // Remarks editing states
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [remarksInput, setRemarksInput] = useState("");

  const hasAutoOpenedRef = useRef(false);
  const serialImageInputRef = useRef<HTMLInputElement>(null);
  const [extractingSerial, setExtractingSerial] = useState(false);

  const handleExtractSerialFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingSerial(true);
    const loadingToast = toast.loading("AI is reading serial number from image...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ai/extract-serial", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to extract serials");
      }

      if (data.serials && data.serials.length > 0) {
        const foundSerials = data.serials.map((s: string) => s.trim()).filter(Boolean);
        if (foundSerials.length > 0) {
          setSerialNumbersText(prev => {
            const currentLines = prev.trim() ? prev.trim().split("\n") : [];
            const newLines = [...currentLines, ...foundSerials];
            return newLines.join("\n");
          });
          toast.success(`AI successfully extracted ${foundSerials.length} serial number(s)!`, { id: loadingToast });
        } else {
          toast.error("AI could not find any readable serial numbers in this image.", { id: loadingToast });
        }
      } else {
        toast.error("AI could not find any readable serial numbers in this image.", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("AI Serial Extraction Error:", error);
      toast.error(error.message || "Failed to parse image via AI.", { id: loadingToast });
    } finally {
      setExtractingSerial(false);
      if (e.target) e.target.value = ""; // Clear file input
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      const fetchedItems = data.items || [];
      setItems(fetchedItems);

      // Auto-open modal if specified in query parameter (runs once on initial mount)
      if (!hasAutoOpenedRef.current) {
        const params = new URLSearchParams(window.location.search);
        const editName = params.get("edit");
        if (editName) {
          const itemToEdit = fetchedItems.find(
            (i: any) => i.name.toLowerCase() === editName.toLowerCase()
          );
          if (itemToEdit) {
            handleOpenEditStock(itemToEdit);
            hasAutoOpenedRef.current = true;
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackerSerials = async () => {
    try {
      setLoadingTracker(true);
      const res = await fetch("/api/inventory/serial-numbers?itemName=Printer");
      const data = await res.json();
      setTrackerSerials(data.serialNumbers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTracker(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeDashboardTab === "tracker") {
      fetchTrackerSerials();
    }
  }, [activeDashboardTab]);

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

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? All associated serial numbers and dispatch logs will also be permanently deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory?id=${itemId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Inventory item deleted successfully.");
        fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete inventory item.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while deleting the item.");
    }
  };

  const handleOpenEditStock = async (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
    setSoftwareQty("0");
    setSerialNumbersText("");
    setExistingSerials([]);

    if (item.type === "HARDWARE") {
      await fetchItemSerials(item.name);
    }
  };

  const fetchItemSerials = async (itemName: string) => {
    try {
      setLoadingSerials(true);
      const res = await fetch(`/api/inventory/serial-numbers?itemName=${encodeURIComponent(itemName)}`);
      const data = await res.json();
      setExistingSerials(data.serialNumbers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleUpdateSoftwareStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          quantity: softwareQty,
          action: softwareAction
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchInventory();
      } else {
        alert("Failed to update stock");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSerials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const list = serialNumbersText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (list.length === 0) return;

    try {
      setSubmittingSerials(true);
      const res = await fetch("/api/inventory/serial-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: selectedItem.name,
          serialNumbers: list
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "⚠️ Failed to add serial numbers.");
        return;
      }
      if (data.success) {
        setSerialNumbersText("");
        await fetchItemSerials(selectedItem.name);
        fetchInventory();
        if (data.errors && data.errors.length > 0) {
          alert(`Added ${data.addedCount} serials. Errors encountered:\n` + data.errors.join("\n"));
        } else {
          alert(`Successfully added ${data.addedCount} serials.`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingSerials(false);
    }
  };

  const handleUpdateSerialStatus = async (serialId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/inventory/serial-numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serialId,
          status: newStatus
        })
      });

      if (res.ok) {
        if (selectedItem) {
          await fetchItemSerials(selectedItem.name);
        }
        if (activeDashboardTab === "tracker") {
          await fetchTrackerSerials();
        }
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSerial = async (serialId: string) => {
    if (!confirm("Are you sure you want to delete this serial number from inventory?")) return;

    try {
      const res = await fetch("/api/inventory/serial-numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serialId,
          deleteAction: true
        })
      });

      if (res.ok) {
        if (selectedItem) {
          await fetchItemSerials(selectedItem.name);
        }
        if (activeDashboardTab === "tracker") {
          await fetchTrackerSerials();
        }
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRemarks = async (serialId: string) => {
    try {
      const res = await fetch("/api/inventory/serial-numbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serialId,
          remarks: remarksInput
        })
      });

      if (res.ok) {
        setEditingRemarksId(null);
        if (selectedItem) {
          await fetchItemSerials(selectedItem.name);
        }
        if (activeDashboardTab === "tracker") {
          await fetchTrackerSerials();
        }
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered tracker serials based on search term
  const filteredTrackerSerials = trackerSerials.filter((s) => {
    const term = trackerSearch.toLowerCase();
    const matchesSerial = s.number.toLowerCase().includes(term);
    const matchesShop = s.task?.shopName?.toLowerCase().includes(term) || s.task?.customerName?.toLowerCase().includes(term);
    const matchesAwb = s.task?.dispatchLog?.awbNumber?.toLowerCase().includes(term);
    const matchesCourier = s.task?.dispatchLog?.courierName?.toLowerCase().includes(term);
    return matchesSerial || matchesShop || matchesAwb || matchesCourier;
  });

  // --- Summary Metrics Calculations ---
  const totalRegistered = trackerSerials.length;
  const inStockAvailable = trackerSerials.filter(s => s.status === "Available").length;
  const defectiveCount = trackerSerials.filter(s => s.status === "Defective").length;
  
  let inTransitCount = 0;
  let deliveredCount = 0;
  let rtoCount = 0;
  let pendingShipCount = 0;

  trackerSerials.forEach(s => {
    if (s.status === "Shipped") {
      const trackingStatus = s.task?.dispatchLog?.trackingStatus || "Pending";
      if (trackingStatus === "Delivered") {
        deliveredCount++;
      } else if (trackingStatus === "In Transit" || trackingStatus === "Out for Delivery") {
        inTransitCount++;
      } else if (trackingStatus.toLowerCase().includes("rto")) {
        rtoCount++;
      } else {
        pendingShipCount++;
      }
    }
  });

  // Helper to render shipment/serial badges
  const renderStatusBadge = (serial: any) => {
    if (serial.status === "Defective") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
          <AlertTriangle size={12} /> Defective
        </span>
      );
    }
    if (serial.status === "Available") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle size={12} /> In Stock
        </span>
      );
    }
    
    // If shipped, read task's dispatchLog status
    const trackingStatus = serial.task?.dispatchLog?.trackingStatus || "Shipped";
    if (trackingStatus === "Delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
          <CheckCircle size={12} /> Delivered
        </span>
      );
    }
    if (trackingStatus === "In Transit") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm shadow-amber-500/20">
          <Truck size={12} /> In Transit
        </span>
      );
    }
    if (trackingStatus.toLowerCase().includes("rto")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-600/20 animate-pulse">
          <RotateCcw size={12} /> RTO Return
        </span>
      );
    }
    if (trackingStatus === "Out for Delivery") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500 text-white shadow-sm shadow-sky-500/20">
          <Truck size={12} /> Out for Delivery
        </span>
      );
    }
    
    // Default Shipped
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
        <Clock size={12} /> Pending Ship
      </span>
    );
  };

  const isEmbedded = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("edit");

  if (isEmbedded) {
    const editName = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("edit") : null;
    const itemExists = items.some((i: any) => i.name.toLowerCase() === editName?.toLowerCase());

    if (loading || (!selectedItem && itemExists)) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-100 border-t-indigo-600"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading Edit Form...</p>
          </div>
        </div>
      );
    }

    if (!itemExists) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <p className="text-slate-500 font-bold text-sm">⚠️ Inventory Item "{editName}" not found.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[98vh] sm:max-h-[95vh] flex flex-col border border-slate-200">
          <div className="flex justify-between items-start mb-4 pb-2 border-b">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-800">Edit Stock: {selectedItem.name}</h2>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/inventory?edit=${encodeURIComponent(selectedItem.name)}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Direct link copied to clipboard!");
                  }}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors uppercase tracking-wider"
                >
                  🔗 Copy Link
                </button>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type: {selectedItem.type}</span>
            </div>
          </div>

          {selectedItem.type === "SOFTWARE" ? (
            /* SOFTWARE EDIT VIEW */
            <form onSubmit={handleUpdateSoftwareStock} className="flex flex-col gap-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Action</label>
                <div className="flex gap-2">
                  {(["increment", "decrement", "set"] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setSoftwareAction(act)}
                      className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                        softwareAction === act 
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  required
                  type="number"
                  value={softwareQty}
                  onChange={(e) => setSoftwareQty(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">Update Stock</button>
              </div>
            </form>
          ) : (
            /* HARDWARE (SERIAL NUMBERS) EDIT VIEW */
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
              {/* 1. Add new serial numbers */}
              <form onSubmit={handleAddSerials} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">➕ Add Serial Numbers</h3>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Enter one unique number/serial per line</p>
                  <button
                    type="button"
                    disabled={extractingSerial}
                    onClick={() => serialImageInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors border border-indigo-100 disabled:opacity-50"
                  >
                    {extractingSerial ? (
                      <>
                        <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1"></span>
                        Reading...
                      </>
                    ) : (
                      "📷 AI Scan Label"
                    )}
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={serialNumbersText}
                  onChange={(e) => setSerialNumbersText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  placeholder="PRN-100021&#10;PRN-100022&#10;PRN-100023"
                />
                <button
                  type="submit"
                  disabled={submittingSerials}
                  className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
                >
                  {submittingSerials ? "Adding..." : "Add to Stock"}
                </button>
              </form>

              {/* 2. List of existing serial numbers */}
              <div>
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">📦 Existing Serial Numbers</h3>
                {loadingSerials ? (
                  <p className="text-slate-400 text-xs font-bold text-center py-4">Loading unit serials...</p>
                ) : existingSerials.length === 0 ? (
                  <p className="text-slate-400 text-xs font-bold text-center py-4 italic">No serial numbers assigned. Add some above.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y bg-white max-h-[220px] overflow-y-auto">
                    {existingSerials.map((s) => (
                      <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-slate-700 text-xs truncate">{s.number}</span>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              s.status === "Available" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              s.status === "Shipped" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                              "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}>
                              {s.status}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              • By {s.createdByName || "System"} on {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 items-center">
                          {s.status === "Available" && (
                            <button
                              onClick={() => handleUpdateSerialStatus(s.id, "Defective")}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[9px] font-black text-amber-700 rounded border border-amber-100 uppercase transition-all"
                            >
                              Defective
                            </button>
                          )}
                          {s.status === "Defective" && (
                            <button
                              onClick={() => handleUpdateSerialStatus(s.id, "Available")}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[9px] font-black text-emerald-700 rounded border border-emerald-100 uppercase transition-all"
                            >
                              Available
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSerial(s.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all"
                            title="Delete Unit"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Printer className="text-indigo-600" size={26} /> Inventory & Device Center
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Track Hardware Items, Serial Numbers, and Live Courier Dispatches
            </p>
          </div>

          <div className="flex gap-4">
            <a href="/dispatch" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center">
              Dispatch Dashboard ➔
            </a>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveDashboardTab("stock")}
            className={`pb-3 font-bold text-sm transition-all relative ${
              activeDashboardTab === "stock"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📦 Stock Overview
          </button>
          <button
            onClick={() => setActiveDashboardTab("tracker")}
            className={`pb-3 font-bold text-sm transition-all relative flex items-center gap-1.5 ${
              activeDashboardTab === "tracker"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🕵️‍♂️ Printer Tracking Dashboard
          </button>
        </div>

        {/* Tab 1: Stock Overview */}
        {activeDashboardTab === "stock" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-slate-400 font-bold p-4 text-center col-span-3">Loading inventory...</p>
            ) : items.length === 0 ? (
              <p className="text-slate-400 font-bold p-4 text-center col-span-3">No inventory items found. Add one to get started.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        item.type === "HARDWARE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.type}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.sku && <span className="text-xs font-mono text-slate-400">{item.sku}</span>}
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
                    <button 
                      onClick={() => handleOpenEditStock(item)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                    >
                      Edit Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Printer Tracking Dashboard */}
        {activeDashboardTab === "tracker" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Serial, Shop, AWB..."
                  value={trackerSearch}
                  onChange={(e) => setTrackerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total Devices Registered: {trackerSerials.length}
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5 border-b border-slate-100 bg-slate-50/20">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Devices</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{totalRegistered}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">In Stock</p>
                <p className="text-2xl font-black text-emerald-700 mt-2">{inStockAvailable}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">In Transit</p>
                <p className="text-2xl font-black text-indigo-700 mt-2">{inTransitCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Delivered</p>
                <p className="text-2xl font-black text-sky-700 mt-2">{deliveredCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">RTO Return</p>
                <p className="text-2xl font-black text-rose-700 mt-2">{rtoCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Defective</p>
                <p className="text-2xl font-black text-amber-700 mt-2">{defectiveCount}</p>
              </div>
            </div>

            {/* Tracker Table */}
            <div className="overflow-x-auto">
              {loadingTracker ? (
                <p className="text-slate-400 font-bold text-center py-8">Loading printer list...</p>
              ) : filteredTrackerSerials.length === 0 ? (
                <p className="text-slate-400 font-bold text-center py-8">No matching printer units found.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest">Serial Number</th>
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest">Real-time Status</th>
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest">Shipped Customer</th>
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest">AWB & Tracking</th>
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest">Remarks / Notes</th>
                      <th className="p-4 font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrackerSerials.map((serial) => {
                      const dispatch = serial.task?.dispatchLog;
                      return (
                        <tr key={serial.id} className="border-b hover:bg-slate-50/50 transition-colors">
                          {/* 1. Serial number */}
                          <td className="p-4">
                             <p className="font-mono font-bold text-slate-800 text-sm leading-tight">{serial.number}</p>
                             <p className="text-[10px] text-slate-400 mt-1 font-medium">
                               Added on {new Date(serial.createdAt).toLocaleDateString()} by{" "}
                               <span className="font-bold text-slate-500">
                                 {serial.createdByName || "System"}
                               </span>
                             </p>
                           </td>
                          {/* 2. Real-time Status */}
                          <td className="p-4">
                            {renderStatusBadge(serial)}
                          </td>
                          {/* 3. Customer */}
                          <td className="p-4">
                            {serial.task ? (
                              <div>
                                <p className="font-bold text-slate-700">{serial.task.shopName || serial.task.customerName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">ID: {serial.task.id.slice(-6)}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned (In stock)</span>
                            )}
                          </td>
                          {/* 4. AWB details */}
                          <td className="p-4">
                            {dispatch ? (
                              <div>
                                <p className="font-bold text-slate-700">{dispatch.awbNumber}</p>
                                <p className="text-[10px] text-indigo-600 mt-0.5 font-bold uppercase flex gap-1 items-center">
                                  <span>{dispatch.courierName || "Courier"}</span>
                                  <a href={`/dispatch/track?awb=${dispatch.awbNumber}`} className="hover:underline">
                                    🔍 Live Track ↗
                                  </a>
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          {/* 5. Remarks */}
                          <td className="p-4 max-w-[200px]">
                            {editingRemarksId === serial.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={remarksInput}
                                  onChange={(e) => setRemarksInput(e.target.value)}
                                  className="p-1 border border-slate-200 rounded text-xs w-full bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveRemarks(serial.id)}
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-xs"
                                  title="Save"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingRemarksId(null)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded font-bold text-xs"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingRemarksId(serial.id);
                                  setRemarksInput(serial.remarks || "");
                                }}
                                className="cursor-pointer text-slate-600 hover:text-indigo-600 transition-colors py-1 group flex items-center justify-between gap-1"
                                title="Click to edit remark"
                              >
                                <span className={serial.remarks ? "font-medium" : "text-slate-300 italic"}>
                                  {serial.remarks || "Add note..."}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-500 font-bold ml-1 transition-opacity shrink-0">
                                  📝 Edit
                                </span>
                              </div>
                            )}
                          </td>
                          {/* 6. Actions */}
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              {serial.task && (
                                <a
                                  href={`/team-board?task=${serial.task.id}`}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase rounded text-[10px] tracking-wider transition-colors"
                                >
                                  View Task
                                </a>
                              )}
                              {serial.status === "Available" && (
                                <button
                                  onClick={() => handleUpdateSerialStatus(serial.id, "Defective")}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] uppercase font-bold"
                                >
                                  Defective
                                </button>
                              )}
                              {serial.status === "Defective" && (
                                <button
                                  onClick={() => handleUpdateSerialStatus(serial.id, "Available")}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] uppercase font-bold"
                                >
                                  Make Available
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSerial(serial.id)}
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Delete device"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
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

      {/* Edit Stock Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-start mb-4 pb-2 border-b">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-800">Edit Stock: {selectedItem.name}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/inventory?edit=${encodeURIComponent(selectedItem.name)}`;
                      navigator.clipboard.writeText(link);
                      toast.success("Direct link copied to clipboard!");
                    }}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors uppercase tracking-wider"
                  >
                    🔗 Copy Link
                  </button>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type: {selectedItem.type}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
            </div>

            {selectedItem.type === "SOFTWARE" ? (
              /* SOFTWARE EDIT VIEW */
              <form onSubmit={handleUpdateSoftwareStock} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Action</label>
                  <div className="flex gap-2">
                    {(["increment", "decrement", "set"] as const).map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => setSoftwareAction(act)}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                          softwareAction === act 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700" 
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input
                    required
                    type="number"
                    value={softwareQty}
                    onChange={(e) => setSoftwareQty(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">Update Stock</button>
                </div>
              </form>
            ) : (
              /* HARDWARE (SERIAL NUMBERS) EDIT VIEW */
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
                {/* 1. Add new serial numbers */}
                <form onSubmit={handleAddSerials} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">➕ Add Serial Numbers</h3>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Enter one unique number/serial per line</p>
                    <button
                      type="button"
                      disabled={extractingSerial}
                      onClick={() => serialImageInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors border border-indigo-100 disabled:opacity-50"
                    >
                      {extractingSerial ? (
                        <>
                          <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1"></span>
                          Reading...
                        </>
                      ) : (
                        "📷 AI Scan Label"
                      )}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={serialNumbersText}
                    onChange={(e) => setSerialNumbersText(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    placeholder="PRN-100021&#10;PRN-100022&#10;PRN-100023"
                  />
                  <button
                    type="submit"
                    disabled={submittingSerials}
                    className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
                  >
                    {submittingSerials ? "Adding..." : "Add to Stock"}
                  </button>
                </form>

                {/* 2. List of existing serial numbers */}
                <div>
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">📦 Existing Serial Numbers</h3>
                  {loadingSerials ? (
                    <p className="text-slate-400 text-xs font-bold text-center py-4">Loading unit serials...</p>
                  ) : existingSerials.length === 0 ? (
                    <p className="text-slate-400 text-xs font-bold text-center py-4 italic">No serial numbers assigned. Add some above.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl divide-y bg-white max-h-[220px] overflow-y-auto">
                      {existingSerials.map((s) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono font-bold text-slate-700 text-xs truncate">{s.number}</span>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                s.status === "Available" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                s.status === "Shipped" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                "bg-rose-50 text-rose-600 border border-rose-100"
                              }`}>
                                {s.status}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                • By {s.createdByName || "System"} on {new Date(s.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 items-center">
                            {s.status === "Available" && (
                              <button
                                onClick={() => handleUpdateSerialStatus(s.id, "Defective")}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[9px] font-black text-amber-700 rounded border border-amber-100 uppercase transition-all"
                              >
                                Defective
                              </button>
                            )}
                            {s.status === "Defective" && (
                              <button
                                onClick={() => handleUpdateSerialStatus(s.id, "Available")}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[9px] font-black text-emerald-700 rounded border border-emerald-100 uppercase transition-all"
                              >
                                Available
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSerial(s.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all"
                              title="Delete Unit"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <input
        type="file"
        ref={serialImageInputRef}
        onChange={handleExtractSerialFromImage}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
    </div>
  );
}
