// components/CommentSection.tsx
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FaUserCircle, FaPaperPlane } from 'react-icons/fa'; // Assuming you have react-icons installed

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  createdAt: string;
}

interface CommentSectionProps {
  comments: Comment[];
  addComment: (content: string) => Promise<void>;
  currentUserName?: string; // Optional: To display current user's name
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, addComment, currentUserName }) => {
  const [newCommentContent, setNewCommentContent] = useState('');

  const handleAddComment = async () => {
    if (newCommentContent.trim() === '') return;
    await addComment(newCommentContent);
    setNewCommentContent('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 Comments</h3>

      {/* Existing Comments */}
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <FaUserCircle className="text-gray-400 text-2xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-gray-800 text-sm">{comment.authorName}</p>
                  <span className="text-xs text-gray-500">
                    {format(parseISO(comment.createdAt), "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Comment */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <FaUserCircle className="text-gray-400 text-2xl flex-shrink-0" />
          <span className="font-medium text-gray-800 text-sm">
            {currentUserName || "You"}
          </span>
        </div>
        <div className="flex gap-2">
          <textarea
            rows={3}
            placeholder="Write a comment..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
          <button
            onClick={handleAddComment}
            className="inline-flex items-center justify-center h-10 w-10 min-w-[40px] rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            title="Add Comment"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;