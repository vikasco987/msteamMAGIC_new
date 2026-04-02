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

import React, { useEffect, useState, useCallback } from "react";
import { FaTimes, FaStickyNote, FaUserCircle } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
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

  const userRole = user?.publicMetadata?.role;
  const isAuthorized = userRole === "admin" || userRole === "seller" || userRole === "master";

  // ✅ Wait for user to load
  if (!isLoaded || !isAuthorized) return null;

  // ✅ Fetch only notes for THIS exact task
  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get<Note[]>(`/api/notes?taskId=${taskId}`);
      setNotes(res.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [taskId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async () => {
    if (!input.trim()) return;

    const authorName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    const authorEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "unknown@example.com";

    try {
      const res = await axios.post<Note>("/api/notes", {
        taskId, // ✅ Correct task ID
        content: input,
        authorName,
        authorEmail,
      });

      setNotes((prev) => [...prev, res.data]);
      setInput("");
    } catch (error) {
      console.error("Error adding note:", error);
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
                <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <FaUserCircle className="text-gray-400" />
                  <span className="font-semibold text-gray-700">
                    {note.authorName || note.authorEmail || "Unknown User"}
                  </span>{" "}
                  <span className="text-gray-400">•</span>{" "}
                  {new Date(note.createdAt).toLocaleString()}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{note.content}</p>
              </div>
            ))
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a new note here..."
          rows={4}
          className="w-full p-3 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-yellow-100 text-gray-800 placeholder-gray-500 resize-y transition-all duration-200"
          aria-label="Write a new note"
        />

        <button
          onClick={addNote}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-2.5 rounded-lg shadow-md hover:from-purple-700 hover:to-purple-900 transition-all duration-200 ease-in-out font-semibold text-lg tracking-wide"
        >
          Add Note
        </button>
      </div>
    </div>
  );
}
