"use client";

import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import { Camera, CheckCircle2, Shield, X, RefreshCw, AlertCircle } from "lucide-react";

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "checkIn" | "checkOut";
  currentLocation: { lat: number; lng: number } | null;
  reason?: string;
  remarks?: string;
  onSuccess: (attendance: Record<string, unknown>) => void;
}

export default function FaceVerificationModal({
  isOpen,
  onClose,
  actionType,
  currentLocation,
  reason,
  remarks,
  onSuccess,
}: FaceVerificationModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<"fetching" | "ready" | "failed">("fetching");

  // Fetch challenge nonce when modal opens
  useEffect(() => {
    if (isOpen) {
      setChallengeStatus("fetching");
      setCapturedImage(null);
      fetch("/api/biometrics/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.challengeId) {
            setChallengeId(data.challengeId);
            setChallengeStatus("ready");
          } else {
            setChallengeStatus("failed");
            toast.error(data.error || "Failed to initiate anti-replay challenge");
          }
        })
        .catch(() => {
          setChallengeStatus("failed");
          toast.error("Network error getting security challenge");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Failed to capture image. Please check camera permissions.");
      return;
    }
    setCapturedImage(imageSrc);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleVerifySubmit = async () => {
    if (!capturedImage) {
      toast.error("Please capture your face photo first.");
      return;
    }
    if (!challengeId) {
      toast.error("Security challenge not ready. Please retry.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("AI verifying your face biometrics...");

    try {
      // 1. Create temporary image element to run face-api detection
      const img = document.createElement("img");
      img.src = capturedImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const { getFaceEmbeddingFromElement } = await import("@/lib/biometrics/client-face");
      const faceResult = await getFaceEmbeddingFromElement(img);

      if (!faceResult || !faceResult.embedding) {
        toast.error("No clear face detected in the photo. Please look straight into the camera and retake.", { id: toastId });
        setLoading(false);
        return;
      }

      // Fetch fresh challenge immediately before submission
      let activeChallenge = challengeId;
      try {
        const chalRes = await fetch("/api/biometrics/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify" }),
        });
        const chalData = await chalRes.json();
        if (chalData.success && chalData.challengeId) {
          activeChallenge = chalData.challengeId;
          setChallengeId(chalData.challengeId);
        }
      } catch (err) {
        console.error("Challenge fetch error:", err);
      }

      toast.loading("Matching against enrolled face profile...", { id: toastId });

      const res = await fetch("/api/attendance/face-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: activeChallenge,
          image: capturedImage,
          clientEmbedding: faceResult.embedding,
          type: actionType,
          reason,
          remarks,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ [Biometrics] Face verification check successful:", {
          action: actionType,
          employee: data.attendance?.employeeName,
          attendanceId: data.attendance?.id,
          timestamp: new Date().toISOString(),
        });
        toast.success(data.message || `Successfully ${actionType === "checkIn" ? "Checked In" : "Checked Out"}!`, { id: toastId });
        onSuccess(data.attendance);
        onClose();
      } else {
        console.warn("⚠️ [Biometrics] Face verification rejected by server:", data);
        toast.error(data.error || "Face verification failed", { id: toastId });
        // Refresh challenge for next attempt
        fetch("/api/biometrics/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify" }),
        })
          .then((r) => r.json())
          .then((d) => d.success && setChallengeId(d.challengeId));
        setCapturedImage(null);
      }
    } catch (err) {
      console.error("❌ [Biometrics] Network/Client exception during face verification:", err);
      toast.error("Network error during face verification. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${actionType === "checkIn" ? "bg-gradient-to-r from-teal-600 to-green-700" : "bg-gradient-to-r from-rose-600 to-pink-700"}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Face Verified {actionType === "checkIn" ? "Check-in" : "Check-out"}</h3>
              <p className="text-xs text-white/80">Tamper-proof biometric presence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {challengeStatus === "fetching" ? (
            <div className="py-12 text-center text-gray-500 font-medium">Securing anti-replay session...</div>
          ) : challengeStatus === "failed" ? (
            <div className="py-8 text-center text-red-500 font-medium flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span>Could not establish biometric challenge. Please close and retry.</span>
            </div>
          ) : (
            <>
              {/* Webcam view */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-950 aspect-video flex items-center justify-center border-2 border-gray-200 shadow-inner">
                {capturedImage ? (
                  <img src={capturedImage} alt="Face Verification Frame" className="w-full h-full object-cover" />
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Oval Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-teal-400/60 m-6 rounded-full aspect-square self-center justify-self-center animate-pulse" />
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>📍 Location Geofence: Active</span>
                <span className="text-teal-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Security Token Active
                </span>
              </div>

              {/* Controls */}
              <div className="flex gap-3 pt-2">
                {capturedImage ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className="w-4 h-4" /> Retake
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleVerifySubmit}
                      className={`flex-[2] py-3 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                        actionType === "checkIn"
                          ? "bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700"
                          : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
                      }`}
                    >
                      {loading ? "Matching..." : `Verify & ${actionType === "checkIn" ? "Check In" : "Check Out"}`}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-base shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.01] transition"
                  >
                    <Camera className="w-5 h-5" /> Capture & Scan Face
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
