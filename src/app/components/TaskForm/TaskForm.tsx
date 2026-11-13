"use client";
import React, { useState, useEffect } from "react";
import BasicInfoStep, {
  TabType,
  TASK_CATEGORIES,
  AssignmentMode,
} from "./BasicInfoStep";
import UploadsStep from "./UploadsStep";
import CustomFieldsStep from "./CustomFieldsStep";
import { uploadToCloudinary } from "./utils";

type CustomField = {
  label: string;
  value: string;
  files: File[];
};

const LOCAL_STORAGE_KEY = "onboarding-task-form";

// Define the initial state for the single/merchant form fields
const initialFormState = {
  activeTab: "" as TabType | "",
  title: "",
  accountType: "BASIC",
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
  restIds: [] as string[],
  endDate: "",
  aadhaarFile: [] as File[],
  panFile: [] as File[],
  selfieFile: [] as File[],
  chequeFile: [] as File[],
  menuCardFiles: [] as File[],
  fullAddress: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  awbNumber: "",
  softwareDuration: "",
  deliveryCharge: "",
  costPrice: "",
  serialNumber: "",
  rtoReason: "",
  initialNote: "",
  supportGroupUrl: "",
};

export default function TaskForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [step, setStep] = useState(0);

  // Multi-service and Multi-staff extensions
  const [selectedServices, setSelectedServices] = useState<TabType[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("SAME_ALL");
  const [perTaskAssignments, setPerTaskAssignments] = useState<Record<string, string[]>>({});
  const [customServiceTitles, setCustomServiceTitles] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [defaultPrinterCost, setDefaultPrinterCost] = useState("");

  // Result summary state for multi-task creation
  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    createdTasks: { id: string; title: string; assigneeName: string }[];
    failedTasks: { service: string; title: string; error: string }[];
  } | null>(null);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ ...initialFormState, costPrice: defaultPrinterCost });
    setSelectedServices([]);
    setSelectedStaffIds([]);
    setAssignmentMode("SAME_ALL");
    setPerTaskAssignments({});
    setCustomServiceTitles({});
    setStep(0);
    setCreationResult(null);
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
          accountType: parsed.accountType || initialFormState.accountType,
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
          restIds: parsed.restIds || initialFormState.restIds,
          endDate: parsed.endDate || initialFormState.endDate,
          fullAddress: parsed.fullAddress || initialFormState.fullAddress,
          city: parsed.city || initialFormState.city,
          state: parsed.state || initialFormState.state,
          country: parsed.country || initialFormState.country,
          pincode: parsed.pincode || initialFormState.pincode,
          awbNumber: parsed.awbNumber || initialFormState.awbNumber,
          softwareDuration: parsed.softwareDuration || initialFormState.softwareDuration,
          deliveryCharge: parsed.deliveryCharge || initialFormState.deliveryCharge,
          costPrice: parsed.costPrice || initialFormState.costPrice,
          serialNumber: parsed.serialNumber || initialFormState.serialNumber,
          rtoReason: parsed.rtoReason || initialFormState.rtoReason,
          initialNote: parsed.initialNote || initialFormState.initialNote,
          supportGroupUrl: parsed.supportGroupUrl || initialFormState.supportGroupUrl,
        });

        if (Array.isArray(parsed.selectedServices) && parsed.selectedServices.length > 0) {
          setSelectedServices(parsed.selectedServices);
        } else if (parsed.activeTab) {
          setSelectedServices([parsed.activeTab]);
        }

        if (Array.isArray(parsed.selectedStaffIds) && parsed.selectedStaffIds.length > 0) {
          setSelectedStaffIds(parsed.selectedStaffIds);
        } else if (parsed.assigneeId) {
          setSelectedStaffIds([parsed.assigneeId]);
        }

        if (parsed.assignmentMode) setAssignmentMode(parsed.assignmentMode);
        if (parsed.perTaskAssignments) setPerTaskAssignments(parsed.perTaskAssignments);
        if (parsed.customServiceTitles) setCustomServiceTitles(parsed.customServiceTitles);

        setStep(parsed.step || 0);
      } catch (e) {
        console.error("Failed to parse local storage data:", e);
        setFormData(initialFormState);
        setStep(0);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // Fetch Business Settings for default Printer Cost
  useEffect(() => {
    fetch("/api/admin/settings/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.defaultPrinterCost) {
          setDefaultPrinterCost(data.defaultPrinterCost);
        }
      })
      .catch((err) => console.error("Failed to load business settings:", err));
  }, []);

  // Auto-fill costPrice when selecting printer category if empty
  useEffect(() => {
    const hasPrinter =
      selectedServices.includes("printer") ||
      selectedServices.includes("printer_software") ||
      formData.activeTab === "printer" ||
      formData.activeTab === "printer_software";
    if (hasPrinter && !formData.costPrice && defaultPrinterCost) {
      updateFormData("costPrice", defaultPrinterCost);
    }
  }, [selectedServices, formData.activeTab, defaultPrinterCost, formData.costPrice]);

  // Persist form state to localStorage (omitting File objects)
  useEffect(() => {
    const stateToSave = {
      ...formData,
      selectedServices,
      selectedStaffIds,
      assignmentMode,
      perTaskAssignments,
      customServiceTitles,
      step,
      aadhaarFile: [],
      panFile: [],
      selfieFile: [],
      chequeFile: [],
      menuCardFiles: [],
      customFields: formData.customFields.map((f) => ({
        label: f.label,
        value: f.value,
        files: [],
      })),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [formData, selectedServices, selectedStaffIds, assignmentMode, perTaskAssignments, customServiceTitles, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 0 validation
    if (step === 0) {
      const effectiveServices = selectedServices.length > 0 ? selectedServices : (formData.activeTab ? [formData.activeTab] : []);
      if (effectiveServices.length === 0) {
        alert("⚠️ Please select at least one Service Type to continue.");
        return;
      }

      const effectiveStaff = selectedStaffIds.length > 0 ? selectedStaffIds : (formData.assigneeId ? [formData.assigneeId] : []);
      if (effectiveStaff.length === 0) {
        alert("⚠️ Please select at least one Staff Member.");
        return;
      }

      // Check per-task assignments if in SEPARATE or DISTRIBUTE mode with 2+ services
      if (effectiveServices.length > 1 && (assignmentMode === "SEPARATE" || assignmentMode === "DISTRIBUTE")) {
        for (const srv of effectiveServices) {
          const assignees = perTaskAssignments[srv] || [];
          if (assignees.length === 0) {
            const catLabel = TASK_CATEGORIES.find((c) => c.value === srv)?.label || srv;
            alert(`⚠️ Please assign at least one staff member to "${catLabel}".`);
            return;
          }
        }
      }

      const hasPrinter = effectiveServices.some((s) => ["printer", "printer_software"].includes(s));
      if (hasPrinter && (!formData.supportGroupUrl || formData.supportGroupUrl.trim() === "")) {
        alert("⚠️ WhatsApp support group URL is required for Printer services.");
        return;
      }

      if (!formData.initialNote || formData.initialNote.trim() === "") {
        alert("⚠️ Initial Note is compulsory. Please provide details.");
        return;
      }
    }

    // Step 1 validation
    if (step === 1) {
      const effectiveServices = selectedServices.length > 0 ? selectedServices : [formData.activeTab];
      const isOnlyRtoOrEscalation = effectiveServices.every((s) => s === "rto_printer" || s === "escalation");

      if (!isOnlyRtoOrEscalation) {
        const requiredFields = {
          "Customer Name": formData.customerName,
          "Shop/Outlet Name": formData.shopName,
          "Phone": formData.phone,
          "Full Address": formData.fullAddress,
          "City": formData.city,
          "State": formData.state,
          "Pincode": formData.pincode,
        };

        for (const [label, value] of Object.entries(requiredFields)) {
          if (!value || value.trim() === "") {
            alert(`⚠️ ${label} is compulsory to proceed.`);
            return;
          }
        }

        if (formData.customerName.trim().toLowerCase() === formData.shopName.trim().toLowerCase()) {
          alert("⚠️ Customer Name and Shop/Outlet Name cannot be the same. Please provide distinct names.");
          return;
        }
      }

      if (effectiveServices.some((s) => ["printer", "printer_software", "rto_printer"].includes(s))) {
        if (!formData.awbNumber || formData.awbNumber.trim() === "") {
          alert("⚠️ AWB Tracking Number is compulsory for printer tasks.");
          return;
        }
      }

      if (effectiveServices.includes("rto_printer")) {
        if (!formData.rtoReason || formData.rtoReason.trim() === "") {
          alert("⚠️ Reason for RTO is compulsory.");
          return;
        }
      }

      if (effectiveServices.includes("printer_software")) {
        if (!formData.softwareDuration || formData.softwareDuration.trim() === "") {
          alert("⚠️ Software Duration is compulsory for Printer + Software.");
          return;
        }
      }
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // STEP 3: FINAL SUBMISSION
    setLoading(true);
    setUploading(true);
    setUploadStatus("");
    setCreationResult(null);

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

      // Determine all services to create tasks for
      const effectiveServices =
        selectedServices.length > 0
          ? selectedServices
          : formData.activeTab
          ? [formData.activeTab]
          : [];

      const effectiveStaff =
        selectedStaffIds.length > 0
          ? selectedStaffIds
          : formData.assigneeId
          ? [formData.assigneeId]
          : [];

      // Shared base customFields and details
      const sharedCustomFields = {
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        shopName: formData.shopName.trim(),
        location: formData.location.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim(),
        customerName: formData.customerName.trim(),
        restId: formData.restId.trim(),
        restIds: formData.restIds,
        startDate: formData.startDate,
        endDate: formData.endDate,
        packageAmount: formData.packageAmount.trim(),
        timeline: formData.timeline.trim(),
        fullAddress: formData.fullAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        pincode: formData.pincode.trim(),
        awbNumber: formData.awbNumber.trim(),
        softwareDuration: formData.softwareDuration.trim(),
        deliveryCharge: formData.deliveryCharge.trim(),
        costPrice: formData.costPrice.trim(),
        serialNumber: formData.serialNumber.trim(),
        rtoReason: formData.rtoReason.trim(),
        supportGroupUrl: formData.supportGroupUrl.trim(),
        fields: uploadedCustomFields,
      };

      const createdList: { id: string; title: string; assigneeName: string }[] = [];
      const failedList: { service: string; title: string; error: string }[] = [];

      // Create separate independent tasks for each selected service
      for (const srv of effectiveServices) {
        // Resolve Title
        let taskTitle = "";
        if (srv === "escalation") {
          taskTitle = customServiceTitles["escalation"] || "⚠️ Escalation";
        } else if (srv === "other") {
          taskTitle = customServiceTitles["other"] || "🛠️ Other";
        } else {
          taskTitle = TASK_CATEGORIES.find((c) => c.value === srv)?.label || srv;
        }

        // Resolve Assignees for this task
        let taskAssigneeIds: string[] = [];
        if (effectiveServices.length === 1 || assignmentMode === "SAME_ALL") {
          taskAssigneeIds = effectiveStaff;
        } else {
          taskAssigneeIds = perTaskAssignments[srv] || effectiveStaff;
        }

        // Primary assignee: first of array, or fallback
        const primaryAssigneeId = taskAssigneeIds[0] || effectiveStaff[0] || "";

        const payload = {
          title: taskTitle,
          assigneeId: primaryAssigneeId,
          assigneeIds: taskAssigneeIds,
          assigneeEmail: formData.email.trim(),
          activeTab: srv,
          accountType: formData.accountType,
          attachments,
          tags: [],
          initialNote: formData.initialNote.trim(),
          customFields: {
            ...sharedCustomFields,
            activeTab: srv,
          },
        };

        try {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const json = await res.json();
          if (!res.ok) {
            failedList.push({
              service: srv,
              title: taskTitle,
              error: json.error || json.details || "Creation failed",
            });
          } else {
            createdList.push({
              id: json.task?.id || "created",
              title: json.task?.title || taskTitle,
              assigneeName: json.task?.assigneeName || "Assigned",
            });
          }
        } catch (fetchErr: any) {
          failedList.push({
            service: srv,
            title: taskTitle,
            error: fetchErr.message || "Network error",
          });
        }
      }

      if (failedList.length === 0 && createdList.length > 0) {
        setCreationResult({
          success: true,
          createdTasks: createdList,
          failedTasks: [],
        });
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        setCreationResult({
          success: createdList.length > 0,
          createdTasks: createdList,
          failedTasks: failedList,
        });
      }
    } catch (err: any) {
      console.error("❌ Error in task submission", err);
      alert(`❌ Error while submitting: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* Success / Status Summary Modal / Banner if multi-tasks created */}
      {creationResult && (
        <div className="mb-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <span>{creationResult.failedTasks.length === 0 ? "🎉" : "⚠️"}</span>
              <span>
                {creationResult.createdTasks.length}{" "}
                {creationResult.createdTasks.length === 1 ? "Task" : "Tasks"} Created Successfully
              </span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-xl transition"
            >
              Create New Tasks +
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {creationResult.createdTasks.map((t, idx) => (
              <div
                key={t.id + idx}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>{t.title}</span>
                </div>
                <span className="text-emerald-700 font-semibold">{t.assigneeName}</span>
              </div>
            ))}

            {creationResult.failedTasks.map((f, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="font-bold text-red-950">
                  <span>❌ {f.title}: </span>
                  <span className="font-normal text-red-700">{f.error}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            All tasks are independently active in the Team Board and Onboarding Management module.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden transition-all duration-500"
      >
        {/* Modern Stepper Header */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-6 md:p-8">
          <div className="flex items-center justify-between relative max-w-lg mx-auto">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />

            {[
              { label: "Basic", icon: "📝" },
              { label: "Merchant", icon: "🏢" },
              { label: "Uploads", icon: "📁" },
              { label: "Final", icon: "✨" },
            ].map((s, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (idx <= step) setStep(idx);
                  }}
                  disabled={idx > step}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= idx
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 cursor-pointer"
                      : "bg-white text-slate-400 border-2 border-slate-200 cursor-not-allowed opacity-75"
                  }`}
                >
                  {step > idx ? "✓" : idx + 1}
                </button>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    step >= idx ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {step === 0 && (
            <BasicInfoStep
              title={formData.title}
              assigneeId={formData.assigneeId}
              activeTab={formData.activeTab}
              initialNote={formData.initialNote}
              supportGroupUrl={formData.supportGroupUrl}
              setTitle={(val) => updateFormData("title", val)}
              setAssigneeId={(val) => updateFormData("assigneeId", val)}
              setInitialNote={(val) => updateFormData("initialNote", val)}
              setSupportGroupUrl={(val) => updateFormData("supportGroupUrl", val)}
              setActiveTab={(val) => {
                const matchedCategory = TASK_CATEGORIES.find((cat) => cat.value === val);
                setFormData((prev) => ({
                  ...prev,
                  activeTab: val,
                  title: val === "other" || val === "escalation" ? "" : matchedCategory?.label || "",
                }));
              }}
              accountType={formData.accountType}
              setAccountType={(val) => updateFormData("accountType", val)}
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              selectedStaffIds={selectedStaffIds}
              setSelectedStaffIds={setSelectedStaffIds}
              assignmentMode={assignmentMode}
              setAssignmentMode={setAssignmentMode}
              perTaskAssignments={perTaskAssignments}
              setPerTaskAssignments={setPerTaskAssignments}
              customServiceTitles={customServiceTitles}
              setCustomServiceTitles={setCustomServiceTitles}
            />
          )}

          {(step === 1 || step === 2) && (
            <UploadsStep
              step={step}
              activeTab={formData.activeTab || (selectedServices[0] || "")}
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
              restIds={formData.restIds}
              customerName={formData.customerName}
              packageAmount={formData.packageAmount}
              startDate={formData.startDate}
              endDate={formData.endDate}
              timeline={formData.timeline}
              fullAddress={formData.fullAddress}
              city={formData.city}
              state={formData.state}
              country={formData.country}
              pincode={formData.pincode}
              awbNumber={formData.awbNumber}
              softwareDuration={formData.softwareDuration}
              deliveryCharge={formData.deliveryCharge}
              costPrice={formData.costPrice}
              serialNumber={formData.serialNumber}
              rtoReason={formData.rtoReason}
              setFullAddress={(val) => updateFormData("fullAddress", val)}
              setCity={(val) => updateFormData("city", val)}
              setState={(val) => updateFormData("state", val)}
              setCountry={(val) => updateFormData("country", val)}
              setPincode={(val) => updateFormData("pincode", val)}
              setAwbNumber={(val) => updateFormData("awbNumber", val)}
              setSoftwareDuration={(val) => updateFormData("softwareDuration", val)}
              setDeliveryCharge={(val) => updateFormData("deliveryCharge", val)}
              setCostPrice={(val) => updateFormData("costPrice", val)}
              setSerialNumber={(val) => updateFormData("serialNumber", val)}
              setRtoReason={(val) => updateFormData("rtoReason", val)}
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
              setRestIds={(val) => updateFormData("restIds", val)}
              setCustomerName={(val) => updateFormData("customerName", val)}
              setPackageAmount={(val) => updateFormData("packageAmount", val)}
              setStartDate={(val) => updateFormData("startDate", val)}
              setEndDate={(val) => updateFormData("endDate", val)}
              setTimeline={(val) => updateFormData("timeline", val)}
            />
          )}

          {step === 3 && (
            <CustomFieldsStep
              customFields={formData.customFields}
              setCustomFields={(val) => updateFormData("customFields", val)}
            />
          )}

          {uploading && uploadStatus && (
            <div className="flex items-center gap-3 bg-indigo-50 text-indigo-600 p-4 rounded-2xl mt-6 border border-indigo-100 animate-pulse">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
              <p className="text-sm font-bold uppercase tracking-widest">{uploadStatus}</p>
            </div>
          )}

          <div className="mt-10 flex gap-4">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                ← Previous
              </button>
            )}
            {step < 3 ? (
              <button
                type="submit"
                className="flex-[2] bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Continue ➡️
              </button>
            ) : (
              <button
                type="submit"
                className="flex-[2] bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Creating Tasks..."
                  : selectedServices.length > 1
                  ? `✨ Create ${selectedServices.length} Tasks`
                  : "✨ Complete & Create Task"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
