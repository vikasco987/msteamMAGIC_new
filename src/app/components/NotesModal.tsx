"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useUnifiedAuth as useUser } from "@/lib/useUnifiedAuth";
import {
  FaTimes,
  FaStickyNote,
  FaUserCircle,
  FaTrashAlt,
  FaPaperclip,
  FaSpinner,
  FaSmile,
  FaMicrophone,
  FaCopy,
  FaDownload,
  FaFilePdf,
  FaImage,
  FaExternalLinkAlt,
  FaPaperPlane,
  FaChevronRight,
  FaEye,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Note } from "../../../types/note";

interface NotesModalProps {
  taskId: string;
  initialNotes?: Note[];
  taskTitle?: string;
  taskCode?: string;
  isOpen?: boolean;
  onClose: (updatedNotes?: Note[]) => void;
  onNotesUpdated?: () => void;
}

export default function NotesModal({
  taskId,
  initialNotes,
  taskTitle,
  taskCode,
  isOpen = true,
  onClose,
  onNotesUpdated,
}: NotesModalProps) {
  const { user, isLoaded } = useUser();
  const [notes, setNotes] = useState<Note[]>(initialNotes ? [...initialNotes] : []);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [activeReactionNote, setActiveReactionNote] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "👀", "🙏", "🔥", "✅"];

  const userRole = user?.publicMetadata?.role as string | undefined;
  const isAuthorized = Boolean(userRole);

  // Auto-scroll to bottom of notes when loaded or new note added
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch only notes for THIS exact task
  const fetchNotes = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.get<Note[]>(`/api/notes?taskId=${taskId}`);
      // Sort oldest to newest so newest appear at the bottom like modern chat/feed
      const sorted = (res.data || []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setNotes(sorted);

      // Mark notes as read in the background
      if (user?.id) {
        await axios.post("/api/notes/mark-read", { taskId });
        router.refresh();
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [taskId, user?.id, router]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (notes.length > 0) {
      setTimeout(scrollToBottom, 150);
    }
  }, [notes.length]);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewMedia) {
          setPreviewMedia(null);
        } else {
          onClose(notes);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, notes, previewMedia]);

  // Clean speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Microphone speech recognition is not supported in this browser");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const initialInput = input.trim();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") toast.error(`Mic Error: ${event.error}`);
      };

      const processTranscript = (text: string) => {
        const dictionary: Record<string, string> = {
          "\\bcal\\b": "kal",
          "\\bcall\\b": "kal",
          "\\bperson\\b": "parson",
          "\\bhigh\\b": "hai",
          "\\bhey\\b": "hai",
          "\\bball\\b": "bol",
          "\\braha\\b": "raha",
          "\\brahow\\b": "raho",
          "\\bli\\b": "liye",
          "\\blee\\b": "liye",
          "\\bkey\\b": "ke",
          "\\bkay\\b": "ke",
          "\\bmarning\\b": "morning",
        };
        let cleaned = text.toLowerCase();
        Object.entries(dictionary).forEach(([wrong, right]) => {
          cleaned = cleaned.replace(new RegExp(wrong, "gi"), right);
        });
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      };

      recognition.onresult = (event: any) => {
        let fullFinal = "";
        let fullInterim = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) fullFinal += event.results[i][0].transcript;
          else fullInterim += event.results[i][0].transcript;
        }

        const currentTranscript = fullFinal + (fullInterim ? " " + fullInterim : "");
        const processed = processTranscript(currentTranscript);
        setInput(initialInput ? initialInput + " " + processed : processed);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      toast.error("Voice typing initialization failed");
    }
  };

  const addNote = async () => {
    if (!input.trim() && !file) return;

    setIsUploading(true);

    const authorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || (user as any)?.name || "User";
    const authorEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      (user as any)?.email ||
      "unknown@example.com";

    try {
      let uploadedFileUrl = "";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await axios.post("/api/upload", formData);
        uploadedFileUrl = uploadRes.data.url;
      }

      const res = await axios.post<Note>("/api/notes", {
        taskId,
        content: input,
        authorName,
        authorEmail,
        fileUrl: uploadedFileUrl || undefined,
      });

      setNotes((prev) => [...prev, res.data]);
      setInput("");
      setFile(null);
      if (onNotesUpdated) onNotesUpdated();
      setTimeout(scrollToBottom, 100);
      toast.success("Note added!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteNote = async (noteId: string | undefined) => {
    if (!noteId) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axios.delete(`/api/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (onNotesUpdated) onNotesUpdated();
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note.");
    }
  };

  const toggleReaction = async (noteId: string | undefined, emoji: string) => {
    if (!noteId || !user) return;

    // Optimistic update
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        const reactions = note.reactions || [];
        const existingIdx = reactions.findIndex(
          (r: any) => r.userId === user.id && r.emoji === emoji
        );
        let newReactions = [...reactions];
        if (existingIdx > -1) {
          newReactions.splice(existingIdx, 1);
        } else {
          newReactions.push({
            emoji,
            userId: user.id,
            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          });
        }
        return { ...note, reactions: newReactions };
      })
    );

    setActiveReactionNote(null);

    try {
      await axios.post(`/api/notes/${noteId}/react`, { emoji });
    } catch (error) {
      console.error("Error reacting to note:", error);
      toast.error("Failed to add reaction");
    }
  };

  // Robust File Download Helper for Images and PDFs (bypasses CORS restrictions)
  const handleDownloadFile = async (url: string, defaultName?: string) => {
    setDownloadingUrl(url);
    const toastId = toast.loading("Downloading attachment...");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      let filename = defaultName;
      if (!filename) {
        const parts = url.split("/");
        filename = parts[parts.length - 1]?.split("?")[0] || "attachment";
      }

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download complete!", { id: toastId });
    } catch (err) {
      console.warn("Direct blob download failed, falling back to direct link open:", err);
      // Fallback: trigger standard browser download/open
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = defaultName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.dismiss(toastId);
    } finally {
      setDownloadingUrl(null);
    }
  };

  const isImageFile = (url: string) => {
    return /\.(jpeg|jpg|png|webp|gif|svg)$/i.test(url.split("?")[0]);
  };

  const isPdfFile = (url: string) => {
    return /\.pdf$/i.test(url.split("?")[0]);
  };

  const getFileName = (url: string) => {
    const cleanUrl = url.split("?")[0];
    const segments = cleanUrl.split("/");
    return decodeURIComponent(segments[segments.length - 1] || "Attachment");
  };

  if (!isLoaded || !isAuthorized) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onClose(notes)}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      />

      {/* Slide-over Right Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 flex flex-col w-full max-w-lg md:max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 overflow-hidden"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaStickyNote className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white truncate">
                  Task Notes & Discussion
                </h2>
                {taskCode && (
                  <span className="bg-white/25 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    {taskCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100 font-medium truncate">
                {taskTitle ? taskTitle : `Task #${taskId.slice(-6)}`} • {notes.length} {notes.length === 1 ? "note" : "notes"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onClose(notes)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all focus:outline-none"
              title="Close Panel (Esc)"
              aria-label="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Messages / Notes Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/70">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-inner">
                <FaStickyNote className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No notes recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Add progress updates, instructions, PDFs, or images below. All team members assigned will stay aligned.
              </p>
            </div>
          ) : (
            notes.map((note, index) => {
              const isCurrentUser =
                note.authorEmail === user?.primaryEmailAddress?.emailAddress ||
                note.authorName?.toLowerCase() === `${user?.firstName || ""} ${user?.lastName || ""}`.toLowerCase().trim();

              const fileUrl = note.fileUrl;
              const hasFile = Boolean(fileUrl);
              const isImg = hasFile && isImageFile(fileUrl!);
              const isPdf = hasFile && isPdfFile(fileUrl!);
              const fileName = hasFile ? getFileName(fileUrl!) : "";

              return (
                <div
                  key={note.id || `${note.content}-${index}`}
                  className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                >
                  {/* Note Card */}
                  <div
                    className={`group relative max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-sm border transition-all ${
                      isCurrentUser
                        ? "bg-amber-500 text-white border-amber-600 rounded-tr-none shadow-amber-500/10"
                        : "bg-white text-slate-800 border-slate-200/80 rounded-tl-none shadow-slate-200/50"
                    }`}
                  >
                    {/* Author & Timestamp */}
                    <div
                      className={`flex items-center justify-between gap-4 mb-1.5 text-[11px] font-semibold ${
                        isCurrentUser ? "text-amber-100" : "text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FaUserCircle className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
                        <span className="truncate">
                          {isCurrentUser ? "You" : note.authorName || note.authorEmail || "Staff Member"}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-75 whitespace-nowrap">
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Note Content */}
                    {note.content && (
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isCurrentUser ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {note.content}
                      </p>
                    )}

                    {/* Attachment Section (Images & PDFs with 1-Click Download) */}
                    {hasFile && (
                      <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 space-y-2">
                        {isImg ? (
                          <div className="space-y-2">
                            {/* Image Thumbnail Preview */}
                            <div
                              onClick={() =>
                                setPreviewMedia({ url: fileUrl!, type: "image", name: fileName })
                              }
                              className="relative cursor-pointer overflow-hidden rounded-xl border border-black/10 group/img max-h-56 bg-black/5"
                            >
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-full h-auto max-h-56 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow">
                                  <FaEye /> Preview
                                </span>
                              </div>
                            </div>

                            {/* Image Action Buttons */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[11px] truncate font-medium ${
                                  isCurrentUser ? "text-amber-100" : "text-slate-600"
                                }`}
                                title={fileName}
                              >
                                {fileName}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewMedia({ url: fileUrl!, type: "image", name: fileName })
                                  }
                                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                    isCurrentUser
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                                  title="View Fullscreen"
                                >
                                  <FaEye size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={downloadingUrl === fileUrl}
                                  onClick={() => handleDownloadFile(fileUrl!, fileName)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isCurrentUser
                                      ? "bg-white text-amber-700 hover:bg-amber-50"
                                      : "bg-amber-600 text-white hover:bg-amber-700"
                                  }`}
                                  title="Download Image"
                                >
                                  {downloadingUrl === fileUrl ? (
                                    <FaSpinner className="animate-spin text-xs" />
                                  ) : (
                                    <FaDownload size={11} />
                                  )}
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : isPdf ? (
                          /* PDF Attachment Card with Direct Download */
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isCurrentUser
                                ? "bg-amber-600/60 border-amber-400/40 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-red-500 text-white rounded-lg flex-shrink-0 shadow-sm">
                                <FaFilePdf className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    isCurrentUser ? "text-amber-200" : "text-slate-400"
                                  }`}
                                >
                                  PDF Document
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewMedia({ url: fileUrl!, type: "pdf", name: fileName })
                                }
                                className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                                  isCurrentUser
                                    ? "bg-white/20 hover:bg-white/30 text-white"
                                    : "bg-slate-200/80 hover:bg-slate-300 text-slate-700"
                                }`}
                                title="View PDF"
                              >
                                <FaEye size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={downloadingUrl === fileUrl}
                                onClick={() => handleDownloadFile(fileUrl!, fileName)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                  isCurrentUser
                                    ? "bg-white text-amber-800 hover:bg-amber-50"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                                title="Download PDF"
                              >
                                {downloadingUrl === fileUrl ? (
                                  <FaSpinner className="animate-spin text-xs" />
                                ) : (
                                  <FaDownload size={11} />
                                )}
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Generic Attachment Card */
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isCurrentUser
                                ? "bg-amber-600/60 border-amber-400/40 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-blue-500 text-white rounded-lg flex-shrink-0 shadow-sm">
                                <FaPaperclip className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    isCurrentUser ? "text-amber-200" : "text-slate-400"
                                  }`}
                                >
                                  Attachment
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={downloadingUrl === fileUrl}
                              onClick={() => handleDownloadFile(fileUrl!, fileName)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                isCurrentUser
                                  ? "bg-white text-amber-800 hover:bg-amber-50"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {downloadingUrl === fileUrl ? (
                                <FaSpinner className="animate-spin text-xs" />
                              ) : (
                                <FaDownload size={11} />
                              )}
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions & Note Actions */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      {/* Existing Reactions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(
                          (note.reactions || []).reduce((acc: any, r: any) => {
                            if (!acc[r.emoji]) acc[r.emoji] = [];
                            acc[r.emoji].push(r);
                            return acc;
                          }, {})
                        ).map(([emoji, users]: [string, any]) => {
                          const hasReacted = users.some((u: any) => u.userId === user?.id);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleReaction(note.id, emoji)}
                              title={users.map((u: any) => u.userName).join(", ")}
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${
                                hasReacted
                                  ? isCurrentUser
                                    ? "bg-white text-amber-900 border-white font-bold"
                                    : "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                                  : isCurrentUser
                                  ? "bg-amber-600/80 text-white border-amber-400/40 hover:bg-amber-600"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[11px]">{users.length}</span>
                            </button>
                          );
                        })}

                        {/* Add Reaction Picker */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReactionNote(activeReactionNote === note.id ? null : note.id!)
                            }
                            className={`p-1 rounded-full transition-colors ${
                              isCurrentUser
                                ? "text-amber-100 hover:text-white hover:bg-amber-600/70"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            }`}
                            title="Add reaction"
                          >
                            <FaSmile size={13} />
                          </button>

                          {activeReactionNote === note.id && (
                            <div className="absolute bottom-7 left-0 z-20 bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 flex items-center gap-1">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(note.id, emoji)}
                                  className="hover:scale-125 transition-transform text-base p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right action icons (Reply, Copy, Delete) */}
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            const mention = `@${
                              note.authorName || note.authorEmail?.split("@")[0] || "User"
                            } `;
                            setInput((prev) => (prev ? prev + `\n${mention}` : mention));
                          }}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                            isCurrentUser
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(note.content);
                            toast.success("Copied to clipboard!");
                          }}
                          className={`p-1.5 rounded-md text-xs transition-colors ${
                            isCurrentUser
                              ? "hover:bg-amber-600 text-amber-100 hover:text-white"
                              : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          }`}
                          title="Copy text"
                        >
                          <FaCopy size={11} />
                        </button>
                        {userRole === "master" && (
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className={`p-1.5 rounded-md text-xs transition-colors ${
                              isCurrentUser
                                ? "hover:bg-red-700 text-amber-100 hover:text-white"
                                : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                            }`}
                            title="Delete note (Master only)"
                          >
                            <FaTrashAlt size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Selected File Chip preview prior to send */}
        {file && (
          <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {file.type.startsWith("image/") ? (
                <FaImage className="text-amber-600 flex-shrink-0" />
              ) : (
                <FaFilePdf className="text-red-600 flex-shrink-0" />
              )}
              <span className="text-xs text-amber-900 font-bold truncate">{file.name}</span>
              <span className="text-[10px] text-amber-700">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <FaTimes size={13} />
            </button>
          </div>
        )}

        {/* Panel Footer Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 space-y-2">
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 bg-slate-50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
              placeholder="Write a note or comment... (Press Enter to send)"
              rows={2}
              className="w-full p-3 pr-24 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
            />

            {/* Input Toolbar Icons */}
            <div className="absolute right-2.5 bottom-2 flex items-center gap-1">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? "text-rose-600 bg-rose-100 animate-pulse scale-110"
                    : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak voice note (Hinglish/English)"}
                disabled={isUploading}
              >
                <FaMicrophone size={15} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Attach PDF or image"
                disabled={isUploading}
              >
                <FaPaperclip size={15} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-medium">
              Tip: Supports Images & PDFs with 1-click downloads
            </span>
            <button
              type="button"
              onClick={addNote}
              disabled={isUploading || (!input.trim() && !file)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Note</span>
                  <FaPaperPlane size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lightbox / Preview Modal for Images and PDFs */}
      <AnimatePresence>
        {previewMedia && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-150">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-10">
              <div className="flex items-center gap-3 min-w-0">
                {previewMedia.type === "pdf" ? (
                  <FaFilePdf className="text-red-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <FaImage className="text-amber-400 w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-bold text-sm truncate">{previewMedia.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewMedia.url, previewMedia.name)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <FaDownload />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 w-full h-full flex items-center justify-center p-2 md:p-4 overflow-hidden">
              {previewMedia.type === "pdf" ? (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.name}
                  className="w-full h-full max-w-5xl rounded-2xl bg-white shadow-2xl border-0"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.name}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
