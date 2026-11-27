"use client";
import React, { useState, useRef } from "react";
import { Bug, Sparkles, Wrench, FlaskConical, Settings, Link as LinkIcon, Calendar, Flag, CheckCircle2, FileText, Mic, MicOff } from "lucide-react";

export type TechTaskType =
  | "Bug"
  | "New Feature"
  | "Improvement"
  | "Testing"
  | "Tech Maintenance";

export interface TechTaskData {
  taskType: TechTaskType;
  title: string;
  projectModule: string;
  description: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  dueDate: string;
  doneWhen: string;
  referenceLink: string;
  techFiles: File[];
  // Bug fields
  bugWhere: string;
  bugSteps: string;
  bugCurrent: string;
  bugExpected: string;
  bugPlatformVersion: string;
  // New Feature / Improvement fields
  featureUserNeed: string;
  featureNewFlow: string;
  featureExistingFlows: string;
  // Testing fields
  testingBuildEnv: string;
  testingScenarios: string;
  testingExpectedResult: string;
  // Tech Maintenance fields
  maintServiceModule: string;
  maintWhyNeeded: string;
  maintVerifyAfter: string;
}

export const initialTechTaskData: TechTaskData = {
  taskType: "Bug",
  title: "",
  projectModule: "",
  description: "",
  priority: "Normal",
  dueDate: "",
  doneWhen: "",
  referenceLink: "",
  techFiles: [],
  bugWhere: "",
  bugSteps: "",
  bugCurrent: "",
  bugExpected: "",
  bugPlatformVersion: "",
  featureUserNeed: "",
  featureNewFlow: "",
  featureExistingFlows: "",
  testingBuildEnv: "",
  testingScenarios: "",
  testingExpectedResult: "",
  maintServiceModule: "",
  maintWhyNeeded: "",
  maintVerifyAfter: "",
};

const TASK_TYPES: { value: TechTaskType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "Bug", label: "Bug", icon: <Bug className="w-4 h-4 text-rose-600" />, desc: "Report an issue or broken flow" },
  { value: "New Feature", label: "New Feature", icon: <Sparkles className="w-4 h-4 text-indigo-600" />, desc: "Request a new capability" },
  { value: "Improvement", label: "Improvement", icon: <Wrench className="w-4 h-4 text-amber-600" />, desc: "Enhance an existing feature" },
  { value: "Testing", label: "Testing", icon: <FlaskConical className="w-4 h-4 text-emerald-600" />, desc: "QA / build verification" },
  { value: "Tech Maintenance", label: "Tech Maintenance", icon: <Settings className="w-4 h-4 text-slate-600" />, desc: "Refactor, infra, or cleanup" },
];

interface Props {
  data: TechTaskData;
  onChange: (updated: TechTaskData) => void;
}

export default function TechTaskStep({ data, onChange }: Props) {
  const [listeningField, setListeningField] = useState<keyof TechTaskData | null>(null);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const recognitionRef = useRef<any>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const update = <K extends keyof TechTaskData>(key: K, value: TechTaskData[K]) => {
    onChange({ ...dataRef.current, [key]: value });
  };

  const toggleVoice = (field: keyof TechTaskData) => {
    if (listeningField === field) {
      recognitionRef.current?.stop();
      setListeningField(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice typing is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {}

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let newTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newTranscript += event.results[i][0].transcript + " ";
        }
      }
      const trimmed = newTranscript.trim();
      if (trimmed) {
        const current = String(dataRef.current[field] || "");
        const next = current ? `${current} ${trimmed}` : trimmed;
        onChange({ ...dataRef.current, [field]: next });
      }
    };

    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);

    recognitionRef.current = recognition;
    setListeningField(field);
    recognition.start();
  };

  const MicBtn = ({ field }: { field: keyof TechTaskData }) => {
    const active = listeningField === field;
    return (
      <button
        type="button"
        onClick={() => toggleVoice(field)}
        title={active ? "Stop listening" : "Speak to type"}
        className={`p-1.5 rounded-lg transition-all ${
          active
            ? "bg-rose-100 text-rose-600 animate-pulse"
            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        {active ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">💻 Tech Team Task Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the Task Type first — the questions below will adapt automatically.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <span className="text-slate-500 font-semibold px-1.5">🎙️ Voice:</span>
          <button
            type="button"
            onClick={() => setVoiceLang("en-IN")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              voiceLang === "en-IN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang("hi-IN")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              voiceLang === "hi-IN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* 1. Task Type (Required) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Task Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {TASK_TYPES.map((t) => {
            const active = data.taskType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update("taskType", t.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Task Title & Project / Module */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Android से बने कुछ बिल History में नहीं दिखते"
              className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <div className="absolute right-2"><MicBtn field="title" /></div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Project / Module <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={data.projectModule}
              onChange={(e) => update("projectModule", e.target.value)}
              placeholder="e.g. Kravy POS → Billing, Menu, Inventory"
              className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <div className="absolute right-2"><MicBtn field="projectModule" /></div>
          </div>
        </div>
      </div>

      {/* 3. Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Description <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <textarea
            rows={3}
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="क्या समस्या है या क्या काम चाहिए, और उसका असर क्या है..."
            className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <div className="absolute right-2 top-2"><MicBtn field="description" /></div>
        </div>
      </div>

      {/* 4. Dynamic Section Based on Task Type */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>{data.taskType} Specific Details</span>
        </div>

        {data.taskType === "Bug" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                समस्या कहाँ दिखी (Where did it appear?)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={data.bugWhere}
                  onChange={(e) => update("bugWhere", e.target.value)}
                  placeholder="e.g. Billing Checkout / History Screen"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5"><MicBtn field="bugWhere" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform & App Version (Optional)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={data.bugPlatformVersion}
                  onChange={(e) => update("bugPlatformVersion", e.target.value)}
                  placeholder="e.g. Android v2.4.1 / Web Chrome"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5"><MicBtn field="bugPlatformVersion" /></div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                दोहराने के Steps (Steps to Reproduce)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.bugSteps}
                  onChange={(e) => update("bugSteps", e.target.value)}
                  placeholder="1. Open Billing... 2. Create bill... 3. Check History..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="bugSteps" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                अभी क्या हो रहा है (Current Behavior)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.bugCurrent}
                  onChange={(e) => update("bugCurrent", e.target.value)}
                  placeholder="Bill is created on dashboard but missing in History"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="bugCurrent" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                क्या होना चाहिए (Expected Behavior)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.bugExpected}
                  onChange={(e) => update("bugExpected", e.target.value)}
                  placeholder="Bill should appear in both Dashboard and History"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="bugExpected" /></div>
              </div>
            </div>
          </div>
        )}

        {(data.taskType === "New Feature" || data.taskType === "Improvement") && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                किस user को क्या चाहिए (Who needs this & what?)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.featureUserNeed}
                  onChange={(e) => update("featureUserNeed", e.target.value)}
                  placeholder="Cashier / Manager needs..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="featureUserNeed" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                नया flow कैसा होना चाहिए (Proposed New Flow)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.featureNewFlow}
                  onChange={(e) => update("featureNewFlow", e.target.value)}
                  placeholder="Step-by-step how the new flow should work..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="featureNewFlow" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कौन से मौजूदा flows सही चलते रहने चाहिए (Existing Flows to Preserve)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.featureExistingFlows}
                  onChange={(e) => update("featureExistingFlows", e.target.value)}
                  placeholder="e.g. Existing POS billing, KOT print, and GST invoice..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="featureExistingFlows" /></div>
              </div>
            </div>
          </div>
        )}

        {data.taskType === "Testing" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कौन सा build या environment टेस्ट करना है (Build / Environment)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={data.testingBuildEnv}
                  onChange={(e) => update("testingBuildEnv", e.target.value)}
                  placeholder="e.g. Staging / Android APK v2.5.0-rc1"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5"><MicBtn field="testingBuildEnv" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                कौन से scenarios चेक करने हैं (Scenarios to Check)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.testingScenarios}
                  onChange={(e) => update("testingScenarios", e.target.value)}
                  placeholder="List the test scenarios..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="testingScenarios" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                हर scenario का expected result क्या है (Expected Result)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.testingExpectedResult}
                  onChange={(e) => update("testingExpectedResult", e.target.value)}
                  placeholder="Expected outcome for each scenario..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="testingExpectedResult" /></div>
              </div>
            </div>
          </div>
        )}

        {data.taskType === "Tech Maintenance" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                किस service या module पर काम है (Service / Module)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={data.maintServiceModule}
                  onChange={(e) => update("maintServiceModule", e.target.value)}
                  placeholder="e.g. Payment Webhook / MongoDB Sync"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5"><MicBtn field="maintServiceModule" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                बदलाव क्यों चाहिए (Why Change is Needed)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.maintWhyNeeded}
                  onChange={(e) => update("maintWhyNeeded", e.target.value)}
                  placeholder="Reason for refactoring, upgrade, or cleanup..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="maintWhyNeeded" /></div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                बदलाव के बाद क्या verify करना है (Post-Change Verification)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={data.maintVerifyAfter}
                  onChange={(e) => update("maintVerifyAfter", e.target.value)}
                  placeholder="Checks to run after the change..."
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
                <div className="absolute right-1.5 top-1.5"><MicBtn field="maintVerifyAfter" /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Priority & Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <Flag className="w-3.5 h-3.5 text-slate-500" />
            <span>Priority</span>
          </label>
          <select
            value={data.priority}
            onChange={(e) => update("priority", e.target.value as TechTaskData["priority"])}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal (Default)</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Due Date (Optional)</span>
          </label>
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* 6. Done When */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Done When (किस नतीजे या चेक के बाद टास्क पूरा मानेंगे)</span>
        </label>
        <div className="relative">
          <textarea
            rows={2}
            value={data.doneWhen}
            onChange={(e) => update("doneWhen", e.target.value)}
            placeholder="e.g. Android से बनाया बिल Dashboard और History दोनों में दिखे। उसी order को retry करने पर दूसरा बिल न बने।"
            className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <div className="absolute right-2 top-2"><MicBtn field="doneWhen" /></div>
        </div>
      </div>

      {/* 7. Attachments / Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Links (Figma / Logs / Related Task)</span>
          </label>
          <input
            type="url"
            value={data.referenceLink}
            onChange={(e) => update("referenceLink", e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Attachments (Screenshot / Video / Logs)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => update("techFiles", Array.from(e.target.files || []))}
            className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {data.techFiles.length > 0 && (
            <p className="text-[11px] text-emerald-600 mt-1">
              {data.techFiles.length} file(s) selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
