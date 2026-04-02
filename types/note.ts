// src/types/note.ts

export type Note = {
  id?: string; // Optional if you're storing in a DB and returning an ID
  taskId?: string; // Link to the parent task (optional if you're associating notes with tasks)
  content: string;
  createdAt: string; // ISO string or Date
  authorName?: string;
  authorEmail?: string;
};
//l;kjhjkl///asdfgbncxz