"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import { Camera, CheckCircle2, Shield, Trash2, X, Lock } from "lucide-react";

interface AdminFaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    userId: string;
    name: string;
    email: string;
  };
  onSuccess: () => void;
}

interface FaceProfileStatus {
  enrolled: boolean;
  status: string;
  profile?: {
    enrolledAt: string;
    status: string;
    isLocked: boolean;
  };
}

export default function AdminFaceEnrollmentModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: AdminFaceEnrollmentModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<FaceProfileStatus | null>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [reason, setReason] = useState("");
  const [samplesCount, setSamplesCount] = useState(0);
  const [isCapturingSamples, setIsCapturingSamples] = useState(false);
  const TOTAL_SAMPLES = 8;

  // Check enrollment status on mount
  useEffect(() => {
    if (isOpen && employee?.userId) {
      setFetchingStatus(true);
      fetch(`/api/admin/face/status/${employee.userId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data);
        })
        .catch(() => toast.error("Could not fetch face status"))
        .finally(() => setFetchingStatus(false));
    }
  }, [isOpen, employee?.userId]);

  if (!isOpen) return null;

  const handleBurstEnrollment = async () => {
    if (!consentGiven) {
      toast.error("Employee consent confirmation is mandatory.");
      return;
    }
    if (status?.enrolled && !reason.trim()) {
      toast.error("Please provide a reason for replacing the existing face profile.");
      return;
    }

    if (!webcamRef.current) {
      toast.error("Camera not available");
      return;
    }

    setIsCapturingSamples(true);
    setLoading(true);
    const toastId = toast.loading("Capturing 8 training face samples... Please slowly move head slightly.");

    try {
      const { getFaceEmbeddingFromElement, computeAverageEmbedding } = await import("@/lib/biometrics/client-face");
      const collectedEmbeddings: number[][] = [];
      let latestScreenshot = "";

      for (let i = 1; i <= TOTAL_SAMPLES; i++) {
        setSamplesCount(i);
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          latestScreenshot = screenshot;
          const img = document.createElement("img");
          img.src = screenshot;
          await new Promise((resolve) => { img.onload = resolve; });

          const detection = await getFaceEmbeddingFromElement(img);
          if (detection && detection.embedding) {
            collectedEmbeddings.push(detection.embedding);
          }
        }
        // Small delay between samples to capture slight angles / expressions
        await new Promise((r) => setTimeout(r, 250));
      }

      if (collectedEmbeddings.length < 3) {
        toast.error("Could not capture enough clear face angles. Please ensure proper lighting and face the camera directly.", { id: toastId });
        setIsCapturingSamples(false);
        setLoading(false);
        setSamplesCount(0);
        return;
      }

      toast.loading(`Training model on ${collectedEmbeddings.length} samples...`, { id: toastId });
      const trainedVector = computeAverageEmbedding(collectedEmbeddings);

      const res = await fetch("/api/admin/face/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: employee.userId,
          image: latestScreenshot,
          clientEmbedding: trainedVector,
          consentConfirmed: consentGiven,
          replaceExisting: true, // Always allow admin to register / re-register
          reason: reason.trim() || "Admin Re-enrollment",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ [Biometrics] Face registration trained and stored successfully:", {
          targetUserId: employee.userId,
          samples: collectedEmbeddings.length,
          profileId: data.profile?.id,
          timestamp: new Date().toISOString(),
        });
        toast.success(data.message || `Trained & locked on ${collectedEmbeddings.length} face samples!`, { id: toastId });
        onSuccess();
        onClose();
      } else {
        console.warn("⚠️ [Biometrics] Face enrollment server error:", data);
        toast.error(data.error || "Enrollment failed", { id: toastId });
      }
    } catch (err) {
      console.error("❌ [Biometrics] Face training network/runtime error:", err);
      toast.error("Error during face training. Please try again.", { id: toastId });
    } finally {
      setIsCapturingSamples(false);
      setLoading(false);
      setSamplesCount(0);
    }
  };

  const handleReset = async (actionType: "reset" | "purge") => {
    const confirmMsg =
      actionType === "purge"
        ? `Are you sure you want to PERMANENTLY PURGE all biometric data for ${employee.name}?`
        : `Are you sure you want to suspend/reset the face profile for ${employee.name}?`;
    if (!confirm(confirmMsg)) return;

    const inputReason = prompt("Enter mandatory reason for this action:") || "";
    if (inputReason.trim().length < 5) {
      alert("A valid reason with at least 5 characters is required.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing reset...");
    try {
      const res = await fetch("/api/admin/face/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: employee.userId,
          reason: inputReason,
          actionType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Face profile updated", { id: toastId });
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Reset failed", { id: toastId });
      }
    } catch {
      toast.error("Error communicating with server", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Shield className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Face Biometric Management</h3>
              <p className="text-xs text-blue-200">{employee.name} ({employee.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {fetchingStatus ? (
            <div className="p-8 text-center text-gray-500 font-medium">Checking profile status...</div>
          ) : (
            <>
              {/* Existing Status Banner */}
              {status?.enrolled ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Face Profile Registered & Locked</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Enrolled on {status.profile?.enrolledAt ? new Date(status.profile.enrolledAt).toLocaleDateString() : "Registered"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReset("reset")}
                      className="px-2.5 py-1 text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-medium transition"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => handleReset("purge")}
                      className="px-2.5 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Purge
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-blue-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>No active face registration. Ready for initial enrollment.</span>
                </div>
              )}

              {/* Camera Preview / Captured Frame */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center border border-gray-200">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 m-6 rounded-full aspect-square self-center justify-self-center opacity-70" />
              </div>

              {/* Progress or Status of Samples */}
              {isCapturingSamples && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-1.5 animate-pulse">
                  <div className="flex justify-between text-xs font-bold text-blue-900">
                    <span>Capturing Face Samples (Training Dataset)...</span>
                    <span>{samplesCount} / {TOTAL_SAMPLES}</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${(samplesCount / TOTAL_SAMPLES) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-blue-700 italic">Please slowly turn head slightly left/right so model learns your face structure.</p>
                </div>
              )}

              {/* Replacement Reason Field */}
              {status?.enrolled && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Replacement Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Appearance changed / previous template issues"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Mandatory DPDP Consent Checkbox */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-900">Informed Biometric Consent: </span>
                    I confirm that the employee has been informed that facial embeddings are used strictly for Kravy POS attendance verification and cannot be modified by the employee once locked.
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || !consentGiven || isCapturingSamples}
                  onClick={handleBurstEnrollment}
                  className={`flex-[2] py-3 rounded-xl text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 ${
                    loading || !consentGiven || isCapturingSamples
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {isCapturingSamples
                    ? `Training (${samplesCount}/${TOTAL_SAMPLES})...`
                    : loading
                    ? "Processing..."
                    : status?.enrolled
                    ? "Retrain & Replace Face"
                    : "Train & Register Face"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
