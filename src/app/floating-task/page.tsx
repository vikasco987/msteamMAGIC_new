// app/floating-task/page.tsx
import { Suspense } from "react";
import FloatingTaskContent from "../../app/floating-task/FloatingTaskContent";

export const dynamic = "force-dynamic"; // Optional: disables prerender to avoid static errors

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FloatingTaskContent />
    </Suspense>
  );
}
