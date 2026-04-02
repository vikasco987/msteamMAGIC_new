// src/components/DraggableCard.tsx
import { useDraggable } from "@dnd-kit/core";

export default function DraggableCard({ id, title }: { id: string; title: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="p-4 bg-white text-gray-800 rounded-lg border-l-4 border-blue-500 shadow-md cursor-grab hover:shadow-lg transition duration-200"
    >
      <div className="font-semibold text-base">{title}</div>
    </div>
  );
}

