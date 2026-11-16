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
  FaPaperPlane,
  FaEye,
  FaReply,
  FaComments,
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

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchNotes = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.get<Note[]>(`/api/notes?taskId=${taskId}`);
      const sorted = (res.data || []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setNotes(sorted);

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

    const authorName =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      (user as any)?.name ||
      "User";
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
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
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
      {/* Dim Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onClose(notes)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px]"
      />

      {/* Slide-over Right Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative z-10 flex flex-col w-full max-w-lg md:max-w-xl h-full bg-slate-100 shadow-2xl border-l border-slate-200 overflow-hidden font-sans"
      >
        {/* Sleek Slate/Navy Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <FaComments className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold tracking-tight text-white truncate">
                  Task Discussion & Notes
                </h2>
                {taskCode && (
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    {taskCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {taskTitle ? taskTitle : `Task #${taskId.slice(-6)}`} • {notes.length}{" "}
                {notes.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onClose(notes)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              title="Close (Esc)"
              aria-label="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-100">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-indigo-500 flex items-center justify-center mb-4 shadow-sm">
                <FaStickyNote className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No notes or comments yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Post important updates, attach receipts, images, or PDFs. Everything is synchronized with the team.
              </p>
            </div>
          ) : (
            notes.map((note, index) => {
              const isCurrentUser =
                note.authorEmail === user?.primaryEmailAddress?.emailAddress ||
                note.authorName?.toLowerCase() ===
                  `${user?.firstName || ""} ${user?.lastName || ""}`.toLowerCase().trim();

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
                  {/* Sender Name & Timestamp above bubble */}
                  <div
                    className={`flex items-center gap-2 mb-1 px-1 text-xs font-semibold ${
                      isCurrentUser ? "text-indigo-900" : "text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <FaUserCircle className="w-3.5 h-3.5 text-slate-400" />
                      {isCurrentUser ? "You" : note.authorName || note.authorEmail || "Staff Member"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      • {new Date(note.createdAt).toLocaleTimeString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Clean Contrast Message Bubble */}
                  <div
                    className={`group relative max-w-[92%] md:max-w-[88%] rounded-2xl p-4 shadow-sm border transition-all ${
                      isCurrentUser
                        ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none shadow-indigo-600/10"
                        : "bg-white text-slate-900 border-slate-200/90 rounded-tl-none shadow-slate-200"
                    }`}
                  >
                    {/* Note Content Text - Large Crisp Font */}
                    {note.content && (
                      <p
                        className={`text-[14px] md:text-[15px] font-normal leading-relaxed whitespace-pre-wrap break-words ${
                          isCurrentUser ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {note.content}
                      </p>
                    )}

                    {/* Attachments Section */}
                    {hasFile && (
                      <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/15 space-y-2.5">
                        {isImg ? (
                          <div className="space-y-2">
                            {/* Image Preview with Hover Overlay */}
                            <div
                              onClick={() =>
                                setPreviewMedia({ url: fileUrl!, type: "image", name: fileName })
                              }
                              className="relative cursor-pointer overflow-hidden rounded-xl border border-black/10 group/img max-h-60 bg-black/5"
                            >
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-full h-auto max-h-60 object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                                  <FaEye /> View Full Image
                                </span>
                              </div>
                            </div>

                            {/* Image Filename & Download Bar */}
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span
                                className={`text-xs truncate font-medium ${
                                  isCurrentUser ? "text-indigo-100" : "text-slate-700"
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
                                      ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                  }`}
                                  title="Fullscreen Preview"
                                >
                                  <FaEye size={12} />
                                </button>
                                <button
                                  type="button"
                                  disabled={downloadingUrl === fileUrl}
                                  onClick={() => handleDownloadFile(fileUrl!, fileName)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isCurrentUser
                                      ? "bg-white text-indigo-700 hover:bg-indigo-50"
                                      : "bg-indigo-600 text-white hover:bg-indigo-700"
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
                          /* PDF Card */
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isCurrentUser
                                ? "bg-indigo-700/80 border-indigo-400/40 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2.5 bg-rose-500 text-white rounded-lg flex-shrink-0 shadow-sm">
                                <FaFilePdf className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm font-bold truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    isCurrentUser ? "text-indigo-200" : "text-slate-500"
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
                                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                                }`}
                                title="View PDF"
                              >
                                <FaEye size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={downloadingUrl === fileUrl}
                                onClick={() => handleDownloadFile(fileUrl!, fileName)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                  isCurrentUser
                                    ? "bg-white text-rose-700 hover:bg-rose-50"
                                    : "bg-rose-600 text-white hover:bg-rose-700"
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
                          /* Other File Attachment */
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isCurrentUser
                                ? "bg-indigo-700/80 border-indigo-400/40 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-indigo-500 text-white rounded-lg flex-shrink-0 shadow-sm">
                                <FaPaperclip className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate" title={fileName}>
                                  {fileName}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    isCurrentUser ? "text-indigo-200" : "text-slate-500"
                                  }`}
                                >
                                  File
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={downloadingUrl === fileUrl}
                              onClick={() => handleDownloadFile(fileUrl!, fileName)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                isCurrentUser
                                  ? "bg-white text-indigo-700 hover:bg-indigo-50"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
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

                    {/* Reactions Bar & Quick Action Controls */}
                    <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      {/* Emoji Reactions */}
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
                                    ? "bg-white text-indigo-950 border-white font-bold"
                                    : "bg-indigo-100 text-indigo-950 border-indigo-300 font-bold"
                                  : isCurrentUser
                                  ? "bg-indigo-700/80 text-white border-indigo-400/40 hover:bg-indigo-700"
                                  : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[11px] font-semibold">{users.length}</span>
                            </button>
                          );
                        })}

                        {/* Reaction Picker Icon */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReactionNote(
                                activeReactionNote === note.id ? null : note.id!
                              )
                            }
                            className={`p-1 rounded-full transition-colors ${
                              isCurrentUser
                                ? "text-indigo-200 hover:text-white hover:bg-indigo-700/60"
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

                      {/* Right Action Buttons (Reply, Copy, Delete) */}
                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            const mention = `@${
                              note.authorName || note.authorEmail?.split("@")[0] || "User"
                            } `;
                            setInput((prev) => (prev ? prev + `\n${mention}` : mention));
                          }}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                            isCurrentUser
                              ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <FaReply size={10} />
                          <span>Reply</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(note.content);
                            toast.success("Copied to clipboard!");
                          }}
                          className={`p-1.5 rounded-md text-xs transition-colors ${
                            isCurrentUser
                              ? "hover:bg-indigo-700 text-indigo-200 hover:text-white"
                              : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          }`}
                          title="Copy text"
                        >
                          <FaCopy size={12} />
                        </button>

                        {userRole === "master" && (
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className={`p-1.5 rounded-md text-xs transition-colors ${
                              isCurrentUser
                                ? "hover:bg-rose-700 text-indigo-200 hover:text-white"
                                : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            }`}
                            title="Delete note (Master only)"
                          >
                            <FaTrashAlt size={12} />
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
          <div className="px-5 py-2.5 bg-indigo-50 border-t border-indigo-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {file.type.startsWith("image/") ? (
                <FaImage className="text-indigo-600 flex-shrink-0" />
              ) : (
                <FaFilePdf className="text-rose-600 flex-shrink-0" />
              )}
              <span className="text-xs text-indigo-950 font-bold truncate">{file.name}</span>
              <span className="text-[11px] text-indigo-700 font-medium">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remove file"
            >
              <FaTimes size={13} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 space-y-2.5">
          <div className="relative rounded-2xl border-2 border-slate-300 focus-within:border-indigo-600 bg-white transition-all shadow-sm">
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
              className="w-full p-3.5 pr-24 bg-transparent text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
            />

            {/* Mic and Attach File Buttons */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? "text-rose-600 bg-rose-100 animate-pulse scale-110"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
                title={
                  isListening
                    ? "Listening... Click to stop"
                    : "Speak voice note (Hinglish/English)"
                }
                disabled={isUploading}
              >
                <FaMicrophone size={16} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Attach PDF or image"
                disabled={isUploading}
              >
                <FaPaperclip size={16} />
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

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-slate-500 font-medium">
              Supports 1-click Download for PDFs & Images
            </span>
            <button
              type="button"
              onClick={addNote}
              disabled={isUploading || (!input.trim() && !file)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-150">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 z-10">
              <div className="flex items-center gap-3 min-w-0">
                {previewMedia.type === "pdf" ? (
                  <FaFilePdf className="text-rose-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <FaImage className="text-indigo-400 w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-bold text-sm truncate">{previewMedia.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewMedia.url, previewMedia.name)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
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
