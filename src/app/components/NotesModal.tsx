// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import { FaTimes, FaStickyNote, FaUserCircle } from "react-icons/fa";
// import { useUser } from "@clerk/nextjs";
// import axios from "axios";
// import { Note } from "../../../types/note";

// interface NotesModalProps {
//   taskId: string;
//   initialNotes?: Note[];
//   // onClose: (updatedNotes?: Note[]) => void;
// }

// export default function NotesModal({ taskId, initialNotes, onClose }: NotesModalProps) {
//   const { user, isLoaded } = useUser();
//   const [notes, setNotes] = useState<Note[]>(initialNotes ? [...initialNotes] : []);
//   const [input, setInput] = useState("");

//   // ✅ Check role from publicMetadata
//   const userRole = user?.publicMetadata?.role;
//   const isAuthorized = userRole === "admin" || userRole === "seller" || userRole === "master";

//   // ⛔️ If role check not loaded yet, don't render anything
//   if (!isLoaded) return null;

//   // ⛔️ If unauthorized user tries to access, don't show modal
//   if (!isAuthorized) return null;

//   const fetchNotes = useCallback(async () => {
//     try {
//       const res = await axios.get<Note[]>(`/api/notes?taskId=${taskId}`);
//       setNotes(res.data);
//     } catch (error) {
//       console.error("Error fetching notes:", error);
//     }
//   }, [taskId]);

//   useEffect(() => {
//     fetchNotes();
//   }, [fetchNotes]);

//   const addNote = async () => {
//     if (!input.trim()) return;

//     const authorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
//     const authorEmail =
//       user?.primaryEmailAddress?.emailAddress ||
//       user?.emailAddresses?.[0]?.emailAddress ||
//       "unknown@example.com";

//     try {
//       const newNoteData = {
//         taskId,
//         content: input,
//         authorName,
//         authorEmail,
//       };

//       const res = await axios.post<Note>("/api/notes", newNoteData);

//       const updatedNotes = [...notes, res.data];
//       setNotes(updatedNotes);
//       setInput("");

//     } catch (error) {
//       console.error("Error adding note:", error);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
//       <div className="bg-yellow-50 border border-yellow-200 w-[95%] max-w-lg p-6 rounded-xl shadow-2xl relative transform rotate-1 hover:rotate-0 transition-transform duration-300 ease-in-out">
//         <button
//           className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition-colors duration-200"
//           onClick={() => onClose(notes)}
//           aria-label="Close notes"
//         >
//           <FaTimes size={20} />
//         </button>

//         <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-yellow-900 border-b border-yellow-300 pb-3">
//           <FaStickyNote className="text-yellow-600" /> Task Notes
//         </h2>

//         <div className="bg-white border border-gray-200 rounded-lg shadow-inner p-4 space-y-4 max-h-80 overflow-y-auto mb-4">
//           {notes.length === 0 && (
//             <p className="text-sm text-gray-500 italic text-center py-4">
//               No notes yet. Start writing!
//             </p>
//           )}
//           {notes.map((note: Note) => (
//             <div key={note.id || note.content + note.createdAt} className="border-b border-gray-100 pb-3 last:border-b-0">
//               <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
//                 <FaUserCircle className="text-gray-400" />
//                 <span className="font-semibold text-gray-700">
//                   {note.authorName || note.authorEmail || "Unknown User"}
//                 </span>{" "}
//                 <span className="text-gray-400">•</span>{" "}
//                 {new Date(note.createdAt).toLocaleString()}
//               </div>
//               <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{note.content}</p>
//             </div>
//           ))}
//         </div>

//         <textarea
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Write a new note here..."
//           rows={4}
//           className="w-full p-3 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-yellow-100 text-gray-800 placeholder-gray-500 resize-y transition-all duration-200"
//           aria-label="Write a new note"
//         />

//         <button
//           onClick={addNote}
//           className="mt-4 w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-2.5 rounded-lg shadow-md hover:from-purple-700 hover:to-purple-900 transition-all duration-200 ease-in-out font-semibold text-lg tracking-wide"
//         >
//           Add Note
//         </button>
//       </div>
//     </div>
//   );
// }














"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { FaTimes, FaStickyNote, FaUserCircle, FaTrashAlt, FaPaperclip, FaSpinner, FaSmile, FaMicrophone, FaCopy } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Note } from "../../../types/note";

interface NotesModalProps {
  taskId: string;
  initialNotes?: Note[];
  onClose: (updatedNotes?: Note[]) => void;
}

export default function NotesModal({ taskId, initialNotes, onClose }: NotesModalProps) {
  const { user, isLoaded } = useUser();
  const [notes, setNotes] = useState<Note[]>(initialNotes ? [...initialNotes] : []);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeReactionNote, setActiveReactionNote] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "👀", "🙏"];

  const userRole = user?.publicMetadata?.role as string | undefined;
  // Allow all logged-in users to see notes if they have access to the task modal
  const isAuthorized = Boolean(userRole);

  // ✅ Wait for user to load
  if (!isLoaded || !isAuthorized) return null;

  // ✅ Fetch only notes for THIS exact task
  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get<Note[]>(`/api/notes?taskId=${taskId}`);
      setNotes(res.data);
      
      // Mark notes as read in the background
      // Mark notes as read in the background and refresh data
      if (user?.id) {
        await axios.post('/api/notes/mark-read', { taskId });
        router.refresh();
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [taskId, user?.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Mic not supported in this browser");
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
        if (event.error !== 'no-speech') toast.error(`Mic Error: ${event.error}`);
      };

      const processTranscript = (text: string) => {
        const dictionary: Record<string, string> = {
          '\\bcal\\b': 'kal', '\\bcall\\b': 'kal', '\\bperson\\b': 'parson',
          '\\bhigh\\b': 'hai', '\\bhey\\b': 'hai',
          '\\bball\\b': 'bol', '\\braha\\b': 'raha', '\\brahow\\b': 'raho',
          '\\bli\\b': 'liye', '\\blee\\b': 'liye', '\\bkey\\b': 'ke',
          '\\bkay\\b': 'ke', '\\bmarning\\b': 'morning'
        };
        let cleaned = text.toLowerCase();
        Object.entries(dictionary).forEach(([wrong, right]) => {
          cleaned = cleaned.replace(new RegExp(wrong, 'gi'), right);
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
      toast.error("Voice typing failed");
    }
  };

  const addNote = async () => {
    if (!input.trim() && !file) return;

    setIsUploading(true);

    const authorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    const authorEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
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

      setNotes((prev) => [res.data, ...prev]);
      setInput("");
      setFile(null);
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
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note.");
    }
  };

  const toggleReaction = async (noteId: string | undefined, emoji: string) => {
    if (!noteId || !user) return;
    
    // Optimistic update
    setNotes(prev => prev.map(note => {
      if (note.id !== noteId) return note;
      const reactions = note.reactions || [];
      const existingIdx = reactions.findIndex((r: any) => r.userId === user.id && r.emoji === emoji);
      let newReactions = [...reactions];
      if (existingIdx > -1) {
        newReactions.splice(existingIdx, 1);
      } else {
        newReactions.push({ emoji, userId: user.id, userName: user.fullName || "User" });
      }
      return { ...note, reactions: newReactions };
    }));
    
    setActiveReactionNote(null);

    try {
      await axios.post(`/api/notes/${noteId}/react`, { emoji });
    } catch (error) {
      console.error("Error reacting to note:", error);
      toast.error("Failed to add reaction");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
      <div className="bg-yellow-50 border border-yellow-200 w-[95%] max-w-lg p-6 rounded-xl shadow-2xl relative transform rotate-1 hover:rotate-0 transition-transform duration-300 ease-in-out">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition-colors duration-200"
          onClick={() => onClose(notes)}
          aria-label="Close notes"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-yellow-900 border-b border-yellow-300 pb-3">
          <FaStickyNote className="text-yellow-600" /> Task Notes
        </h2>

        <div className="bg-white border border-gray-200 rounded-lg shadow-inner p-4 space-y-4 max-h-80 overflow-y-auto mb-4">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No notes yet. Start writing!
            </p>
          ) : (
            notes.map((note) => (
              <div key={note.id || note.content + note.createdAt} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FaUserCircle className="text-gray-400" />
                    <span className="font-semibold text-gray-700">
                      {note.authorName || note.authorEmail || "Unknown User"}
                    </span>{" "}
                    <span className="text-gray-400">•</span>{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const mention = `@${note.authorName || note.authorEmail?.split('@')[0] || "User"} `;
                        setInput((prev) => prev ? prev + `\n${mention}` : mention);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium bg-purple-50 px-2 py-0.5 rounded transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(note.content);
                        toast.success("Note copied to clipboard!");
                      }}
                      className="text-gray-500 hover:text-blue-600 font-medium bg-gray-50 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                      title="Copy Note"
                    >
                      <FaCopy size={12} />
                    </button>
                    {userRole === "master" && (
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded transition-colors"
                        title="Delete Note"
                      >
                        <FaTrashAlt size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed mb-2">{note.content}</p>
                
                {/* Image / Attachment Previews */}
                {note.fileUrl && (
                  <div className="mt-2 mb-2">
                    {note.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                      <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={note.fileUrl} alt="Attachment" className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                      </a>
                    ) : (
                      <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                        <FaPaperclip /> View Attachment
                      </a>
                    )}
                  </div>
                )}

                {/* Reactions Section */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Render existing reactions grouped by emoji */}
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
                        onClick={() => toggleReaction(note.id, emoji)}
                        title={users.map((u: any) => u.userName).join(", ")}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                          hasReacted ? "bg-purple-100 border-purple-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-gray-600 font-medium">{users.length}</span>
                      </button>
                    );
                  })}
                  
                  {/* Add Reaction Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveReactionNote(activeReactionNote === note.id ? null : note.id!)}
                      className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                      title="Add Reaction"
                    >
                      <FaSmile size={14} />
                    </button>
                    {activeReactionNote === note.id && (
                      <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 shadow-xl rounded-full px-2 py-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(note.id, emoji)}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {file && (
          <div className="mb-2 p-2 bg-purple-50 rounded-lg flex items-center justify-between border border-purple-100">
            <span className="text-sm text-purple-700 truncate font-medium">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
              <FaTimes />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a new note here..."
            rows={3}
            className="w-full p-3 pr-20 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-yellow-100 text-gray-800 placeholder-gray-500 resize-none transition-all duration-200"
            aria-label="Write a new note"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute bottom-3 right-11 p-2 rounded-full transition-colors ${
              isListening ? "text-rose-500 bg-rose-100 animate-pulse" : "text-gray-500 hover:text-purple-600 hover:bg-purple-100"
            }`}
            title={isListening ? "Listening... Click to stop" : "Speak (Hinglish)"}
            disabled={isUploading}
          >
            <FaMicrophone size={18} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
            title="Attach a file"
            disabled={isUploading}
          >
            <FaPaperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            className="hidden" 
          />
        </div>

        <button
          onClick={addNote}
          disabled={isUploading || (!input.trim() && !file)}
          className="mt-4 w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-2.5 rounded-lg shadow-md hover:from-purple-700 hover:to-purple-900 transition-all duration-200 ease-in-out font-semibold text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? <><FaSpinner className="animate-spin" /> Sending...</> : 'Send'}
        </button>
      </div>
    </div>
  );
}
