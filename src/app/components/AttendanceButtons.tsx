
//http://localhost:3000/admin/attend


"use client";

import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { 
    FaPlayCircle, FaStopCircle, FaHourglassHalf, FaCalendarCheck, 
    FaBolt, FaExclamationCircle, FaMapMarkerAlt, FaSyncAlt, FaHeart 
} from "react-icons/fa";
import DailyAttendanceTable from "../attendance/employee/components/DailyAttendanceTable";
// 1. IMPORT THE NEW COMPONENT
import Motivation from "../attendance/employee/components/Motivation";

// --- ATTENDANCE POLICY CONSTANTS ---
const STANDARD_START_HOUR = 10; // 10 AM
const STANDARD_END_HOUR = 19; // 7 PM
const STANDARD_WORK_HOURS_MS = 9 * 60 * 60 * 1000; // 9 hours
const GRACE_MINUTES = 0; // No grace period

// --- GEOFENCING CONSTANTS ---
const OFFICE_LOCATION = { lat: 28.532676, lng: 77.089221 };
const GEOFENCE_RADIUS_METERS = 50;

// Haversine formula to calculate distance
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}

// Define the type for the tabs, including the new 'motivation' tab
type TabType = "today" | "monthly" | "Marathon";

export default function AttendanceButtons() {
    // ------------------ State ------------------
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [showReason, setShowReason] = useState(false);
    const [exceptionContext, setExceptionContext] = useState<string>("");
    const [actionType, setActionType] = useState<"checkIn" | "checkOut" | null>(null);
    const [checkInStatus, setCheckInStatus] = useState<"notCheckedIn" | "checkedIn" | "checkedOut">("notCheckedIn");
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [hoursWorked, setHoursWorked] = useState<string>("00:00:00");
    const [overtime, setOvertime] = useState<string>("00:00:00");
    const [tardinessDuration, setTardinessDuration] = useState<string>("00:00:00");
    const [earlyExitDuration, setEarlyExitDuration] = useState<string>("00:00:00");
    const [isClient, setIsClient] = useState(false);
    // 2. UPDATE STATE TO INCLUDE NEW TAB TYPE
    const [showTab, setShowTab] = useState<TabType>("today"); 
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // ------------------ Refs ------------------
    const checkInDateRef = useRef<Date | null>(null);
    const checkOutDateRef = useRef<Date | null>(null);

    // ------------------ Helpers ------------------
    const formatTime = (utcDate: string) => {
        if (!utcDate) return null;
        const d = new Date(utcDate);
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDuration = (ms: number) => {
        const absMs = Math.abs(ms);
        const h = Math.floor(absMs / (1000 * 60 * 60)).toString().padStart(2, "0");
        const m = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
        const s = Math.floor((absMs % (1000 * 60)) / 1000).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    // ------------------ Geolocation ------------------
    const fetchLocation = async (manualAttempt: boolean = false) => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation not supported by your browser.");
            return;
        }
        if (manualAttempt || !currentLocation) setLoading(true);
        setLocationError(null);

        try {
            await new Promise<void>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        resolve();
                    },
                    (err) => {
                        const errorMsg = err.code === err.PERMISSION_DENIED 
                            ? "Location access denied. Please allow location access in browser settings."
                            : "Failed to get location. Try again.";
                        setLocationError(errorMsg);
                        setCurrentLocation(null);
                        reject(new Error(errorMsg));
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            });
        } catch {}
        finally { if (manualAttempt || !currentLocation) setLoading(false); }
    };

    // ------------------ Fetch Today's Attendance ------------------
    const fetchTodayAttendance = async () => {
        try {
            const res = await fetch("/api/attendance/today");
            const data = await res.json();
            if (data.attendance) {
                const att = data.attendance;
                const checkedOut = !!att.checkOut;

                setCheckInStatus(checkedOut ? "checkedOut" : !!att.checkIn ? "checkedIn" : "notCheckedIn");
                if (att.checkIn) { checkInDateRef.current = new Date(att.checkIn); setCheckInTime(formatTime(att.checkIn)); } 
                else { checkInDateRef.current = null; setCheckInTime(null); }
                if (att.checkOut) { checkOutDateRef.current = new Date(att.checkOut); setCheckOutTime(formatTime(att.checkOut)); } 
                else { checkOutDateRef.current = null; setCheckOutTime(null); }
            } else {
                setCheckInStatus("notCheckedIn");
                setCheckInTime(null); setCheckOutTime(null); checkInDateRef.current = null; checkOutDateRef.current = null;
            }
        } catch (err) { console.error("Error fetching today's attendance:", err); }
    };

    // ------------------ Client-side Effects ------------------
    useEffect(() => { setIsClient(true); fetchTodayAttendance(); fetchLocation(); }, []);

    useEffect(() => {
        const calculateDurations = () => {
            let workedMs = 0;
            if (checkInStatus === "checkedIn" && checkInDateRef.current) workedMs = new Date().getTime() - checkInDateRef.current.getTime();
            else if (checkInStatus === "checkedOut" && checkInDateRef.current && checkOutDateRef.current) workedMs = checkOutDateRef.current.getTime() - checkInDateRef.current.getTime();

            setHoursWorked(formatDuration(workedMs));
            const overtimeMs = workedMs - STANDARD_WORK_HOURS_MS;
            setOvertime(overtimeMs > 0 ? formatDuration(overtimeMs) : "00:00:00");

            if (checkInDateRef.current) {
                const standardStartTime = new Date(checkInDateRef.current); standardStartTime.setHours(STANDARD_START_HOUR, GRACE_MINUTES, 0, 0);
                const tardyMs = checkInDateRef.current.getTime() - standardStartTime.getTime();
                setTardinessDuration(tardyMs > 0 ? formatDuration(tardyMs) : "00:00:00");
            } else setTardinessDuration("00:00:00");

            if (checkOutDateRef.current) {
                const standardEndTime = new Date(checkOutDateRef.current); standardEndTime.setHours(STANDARD_END_HOUR, 0, 0, 0);
                const earlyExitMs = standardEndTime.getTime() - checkOutDateRef.current.getTime();
                setEarlyExitDuration(earlyExitMs > 0 ? formatDuration(earlyExitMs) : "00:00:00");
            } else setEarlyExitDuration("00:00:00");

            if (checkInStatus === "notCheckedIn") { setHoursWorked("00:00:00"); setOvertime("00:00:00"); setTardinessDuration("00:00:00"); setEarlyExitDuration("00:00:00"); }
        };

        calculateDurations();
        const interval = setInterval(() => { if (checkInStatus === "checkedIn") calculateDurations(); }, 1000);
        return () => clearInterval(interval);
    }, [checkInStatus]);

    // ------------------ Attendance Actions ------------------
    const handleAttendance = async (type: "checkIn" | "checkOut") => {
        setLoading(true);
        if (!currentLocation) { toast.error("Location is mandatory."); setLoading(false); fetchLocation(true); return; }

        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, reason, remarks, lat: currentLocation.lat, lng: currentLocation.lng }),
            });
            const data = await res.json();
            if (!res.ok) toast.error(data.error || `Failed to ${type}`);
            else { toast.success(`Successfully ${type === "checkIn" ? "Checked In" : "Checked Out"}!`); fetchLocation(); fetchTodayAttendance(); }
        } catch { toast.error("Error marking attendance"); }
        finally { setLoading(false); setReason(""); setRemarks(""); setShowReason(false); setExceptionContext(""); setActionType(null); }
    };

    const checkInClick = () => {
        const now = new Date(); const startBoundary = new Date(now); startBoundary.setHours(STANDARD_START_HOUR, GRACE_MINUTES, 0, 0);
        setActionType("checkIn");
        
        let needsReason = false;
        let contexts = [];

        if (now.getTime() > startBoundary.getTime()) {
            contexts.push("Late Check-in");
            needsReason = true;
        }

        if (currentLocation && getDistanceInMeters(currentLocation.lat, currentLocation.lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng) > GEOFENCE_RADIUS_METERS) {
            contexts.push("Outside Office Area");
            needsReason = true;
        }

        if (needsReason) {
            setExceptionContext(contexts.join(" & "));
            setShowReason(true);
        } else {
            handleAttendance("checkIn");
        }
    };

    const checkOutClick = () => {
        const now = new Date(); const endBoundary = new Date(now); endBoundary.setHours(STANDARD_END_HOUR, 0, 0, 0);
        setActionType("checkOut");

        let needsReason = false;
        let contexts = [];

        if (now.getTime() < endBoundary.getTime()) {
            contexts.push("Early Check-out");
            needsReason = true;
        }

        if (currentLocation && getDistanceInMeters(currentLocation.lat, currentLocation.lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng) > GEOFENCE_RADIUS_METERS) {
            contexts.push("Outside Office Area");
            needsReason = true;
        }

        if (needsReason) {
            setExceptionContext(contexts.join(" & "));
            setShowReason(true);
        } else {
            handleAttendance("checkOut");
        }
    };

    // ------------------ Render ------------------
    if (!isClient) return <div className="p-8 bg-white rounded-xl shadow-2xl text-gray-500 text-center font-medium">Loading Employee Portal...</div>;

    const isLate = tardinessDuration !== "00:00:00";
    const isEarlyExit = earlyExitDuration !== "00:00:00";
    const isLocationReady = !!currentLocation && !locationError;

    let attendanceStatusText = "", attendanceStatusClass = "", attendanceStatusIcon = null;
    if (checkInStatus === "checkedOut") {
        if (isLate || isEarlyExit) { attendanceStatusText = "Day Completed: Exceptions Found"; attendanceStatusClass = "bg-gradient-to-r from-red-500 to-orange-500 text-white"; attendanceStatusIcon = <FaExclamationCircle className="text-3xl" />; }
        else { attendanceStatusText = "Day Completed: Policy Compliant 🎉"; attendanceStatusClass = "bg-gradient-to-r from-green-500 to-green-700 text-white"; attendanceStatusIcon = <FaCalendarCheck className="text-3xl" />; }
    } else if (checkInStatus === "checkedIn") { attendanceStatusText = "Currently Clocked In & Working"; attendanceStatusClass = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-pulse-slow"; attendanceStatusIcon = <FaBolt className="text-3xl" />; }
    else { attendanceStatusText = "Ready to Start Day"; attendanceStatusClass = "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800"; attendanceStatusIcon = <FaHourglassHalf className="text-3xl" />; }

    const attendanceSummary = [
        { title: "Live Hours Worked", value: hoursWorked, icon: <FaHourglassHalf className="text-blue-500" />, isWarning: false, desc: "Time since your Check-in." },
        { title: "Overtime Clock", value: overtime, icon: <FaBolt className="text-purple-500" />, isWarning: false, desc: "Time worked beyond 9 hours." },
        { title: "Tardiness (Late)", value: tardinessDuration, icon: <FaExclamationCircle className="text-red-500" />, isWarning: isLate, bgColor: isLate ? "bg-red-50" : "bg-white", desc: "After 10:00 AM (Policy)." },
        { title: "Early Exit", value: earlyExitDuration, icon: <FaExclamationCircle className="text-orange-500" />, isWarning: isEarlyExit, bgColor: isEarlyExit ? "bg-orange-50" : "bg-white", desc: "Before 7:00 PM (Policy)." },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 bg-gray-100 min-h-screen font-sans">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Header and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-center bg-white p-4 rounded-xl shadow-lg">
                <h1 className="text-3xl font-extrabold text-gray-900 border-l-4 border-blue-600 pl-3">Employee Attendance Portal</h1>
                <div className="flex gap-2 p-1 rounded-full bg-gray-100 shadow-inner">
                    <button onClick={() => setShowTab("today")} className={`px-5 py-2 rounded-full font-bold transition duration-300 transform ${showTab === "today" ? "bg-blue-600 text-white shadow-xl scale-105" : "text-gray-600 hover:bg-white"}`}>Today's Punch</button>
                    <button onClick={() => setShowTab("monthly")} className={`px-5 py-2 rounded-full font-bold transition duration-300 transform ${showTab === "monthly" ? "bg-blue-600 text-white shadow-xl scale-105" : "text-gray-600 hover:bg-white"}`}>Monthly Records</button>
                    {/* 3. ADD THE NEW TAB BUTTON */}
                    <button onClick={() => setShowTab("Marathon")} className={`px-5 py-2 rounded-full font-bold transition duration-300 transform ${showTab === "Marathon" ? "bg-blue-600 text-white shadow-xl scale-105" : "text-gray-600 hover:bg-white"}`}>Marathon <FaHeart className="inline ml-1 text-pink-300"/></button>
                </div>
            </div>

            {/* Location Status (Only visible on the 'Today' tab) */}
            {showTab === "today" && (
                <>
                    <div className={`p-4 rounded-xl shadow-md mb-6 flex items-center justify-between transition-colors duration-300 ${isLocationReady ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-800'}`}>
                        <div className="flex items-center gap-3">
                            <FaMapMarkerAlt className="text-2xl" />
                            <p className="font-semibold">
                                Location Status: 
                                <span className={`font-bold ml-2 ${isLocationReady ? 'text-green-700' : 'text-red-700'}`}>{isLocationReady ? 'GPS Ready' : 'Location Required!'}</span>
                                {isLocationReady && <span className="text-sm font-normal ml-2">({currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)})</span>}
                            </p>
                        </div>
                        <button onClick={() => fetchLocation(true)} disabled={loading} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition duration-300 ${loading ? 'bg-gray-300 cursor-wait' : isLocationReady ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                            <FaSyncAlt className={`${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Fetching...' : 'Re-fetch Location'}
                        </button>
                    </div>
                    {locationError && <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg mb-6 text-sm font-medium">{locationError}</div>}
                </>
            )}

            {/* Tab Content */}
            {showTab === "today" && (
                <div className="flex flex-col gap-6">
                    {/* Policy Status Card */}
                    <div className={`p-6 rounded-3xl shadow-2xl transition duration-500 ${attendanceStatusClass}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">{attendanceStatusIcon}<div><h3 className="text-sm font-light uppercase opacity-90">Current Status</h3><p className="text-3xl font-extrabold">{attendanceStatusText}</p></div></div>
                            <div className="text-right"><p className="text-xl font-bold">{checkInTime || '—'} <span className="text-sm font-light opacity-80">IN</span> / {checkOutTime || '—'} <span className="text-sm font-light opacity-80">OUT</span></p><p className="text-sm font-medium opacity-80 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {attendanceSummary.map(item => (
                            <div key={item.title} className={`flex flex-col p-5 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-t-4 ${item.isWarning ? "border-red-500 bg-white" : "border-blue-500 bg-white"}`}>
                                <div className="flex items-center justify-between"><span className={`text-xs font-semibold uppercase ${item.isWarning ? "text-red-700" : "text-gray-500"}`}>{item.title}</span><div className="text-2xl">{item.icon}</div></div>
                                <span className={`font-black text-3xl mt-2 tracking-wider ${item.isWarning ? "text-red-800" : "text-gray-900"}`}>{item.value}</span>
                                <p className="text-xs text-gray-400 mt-2 italic">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Reason / Remarks */}
                    {showReason && (
                        <div className="p-8 bg-white rounded-3xl shadow-2xl border-t-8 border-yellow-500 transform transition-all duration-500 animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <FaExclamationCircle className="text-3xl text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Action Required</h3>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Policy Exception: {exceptionContext}</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 text-gray-700">
                                {exceptionContext.includes("Outside Office Area") && (
                                    <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl mb-3 border border-red-100">
                                        <FaMapMarkerAlt className="text-xl mt-0.5 flex-shrink-0" />
                                        <p className="font-medium text-sm leading-relaxed">
                                            You appear to be outside the office premises. Are you currently on a field visit or working from home?
                                        </p>
                                    </div>
                                )}
                                <p className="text-sm font-medium">Please provide a valid reason below to proceed with your {actionType === 'checkIn' ? 'punch in' : 'punch out'}.</p>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* Quick Select Options */}
                                {exceptionContext.includes("Outside Office Area") && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <button onClick={() => setReason("Field Visit")} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${reason === 'Field Visit' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Field Visit</button>
                                        <button onClick={() => setReason("Work From Home")} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${reason === 'Work From Home' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Work From Home</button>
                                        <button onClick={() => setReason("Client Meeting")} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${reason === 'Client Meeting' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Client Meeting</button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason <span className="text-red-500">*</span></label>
                                        <textarea placeholder="e.g., Working from home due to..." value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 min-h-[100px] transition duration-300 shadow-sm text-gray-800 bg-gray-50 hover:bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remarks (Optional)</label>
                                        <textarea placeholder="Any additional comments..." value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 min-h-[80px] transition duration-300 shadow-sm text-gray-800 bg-gray-50 hover:bg-white" />
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 mt-2">
                                    <button onClick={() => setShowReason(false)} className="flex-1 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition duration-300">
                                        Cancel
                                    </button>
                                    <button onClick={() => actionType && handleAttendance(actionType)} disabled={loading || !reason || !isLocationReady} className={`flex-[2] py-4 rounded-xl font-bold text-white transition duration-300 shadow-lg ${loading || !reason || !isLocationReady ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 hover:shadow-xl"}`}>
                                        {loading ? "Submitting..." : !isLocationReady ? "Location Required" : `Confirm & ${actionType === 'checkIn' ? 'PUNCH IN' : 'PUNCH OUT'}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Check-in / Check-out Buttons */}
                    {!showReason && (
                        <div className="flex flex-col sm:flex-row gap-6 mt-4">
                            <button onClick={checkInClick} disabled={loading || checkInStatus !== "notCheckedIn" || !isLocationReady} className={`flex-1 flex flex-col items-center justify-center gap-2 p-8 rounded-2xl font-black text-2xl transition duration-500 shadow-2xl border-b-8 ${checkInStatus !== "notCheckedIn" || !isLocationReady ? "bg-gray-300 text-gray-600 cursor-not-allowed border-gray-500" : "bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 transform hover:scale-[1.03] border-green-800"}`}><FaPlayCircle className="text-4xl mb-1" />{checkInStatus !== "notCheckedIn" ? "Checked In/Out Today" : !isLocationReady ? "Location Required" : "PUNCH IN"}</button>
                            <button onClick={checkOutClick} disabled={loading || checkInStatus !== "checkedIn" || !isLocationReady} className={`flex-1 flex flex-col items-center justify-center gap-2 p-8 rounded-2xl font-black text-2xl transition duration-500 shadow-2xl border-b-8 ${checkInStatus !== "checkedIn" || !isLocationReady ? "bg-gray-300 text-gray-600 cursor-not-allowed border-gray-500" : "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transform hover:scale-[1.03] border-red-800"}`}><FaStopCircle className="text-4xl mb-1" />{!isLocationReady ? "Location Required" : "PUNCH OUT"}</button>
                        </div>
                    )}
                </div>
            )}

            {/* Monthly View */}
            {showTab === "monthly" && (
                <div className="mt-6 bg-white p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 pb-3 border-blue-100">Monthly Payroll Summary</h2>
                    <p className="text-gray-600 mb-6 italic">High-level data for payroll processing, tracking compliance, leave, and working hours.</p>
                    <DailyAttendanceTable />
                </div>
            )}
            
            {/* 4. CONDITIONAL RENDERING FOR THE NEW TAB */}
            {showTab === "Marathon" && (
                <div className="mt-6 bg-white p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 pb-3 border-pink-300 flex items-center gap-2">Daily Motivation & Well-being <FaHeart className="text-pink-500" /></h2>
                    <p className="text-gray-600 mb-6 italic">Take a moment to center yourself and get inspired!</p>
                    {/* The imported Motivation component is rendered here */}
                    <Motivation />
                </div>
            )}
        </div>
    );
}












