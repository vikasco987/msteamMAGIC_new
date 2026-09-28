import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import FormClient from "./FormClient";

export default async function PrinterFormPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, shopName: true }
  });

  if (!task) return notFound();

  // Get printers assigned to this task
  const printers = await prisma.serialNumber.findMany({
    where: { taskId },
    include: { inventoryItem: true }
  });

  // Get active team members/users for the "Taken By" dropdown
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, clerkId: true }
  });

  // Extract names for the dropdown
  const assigneeOptions = users.map((u: any) => ({
    id: u.clerkId,
    name: u.name
  }));

  const printerOptions = printers.map((p: any) => ({
    id: p.id,
    number: p.number,
    name: p.inventoryItem?.name || "Printer"
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <span className="text-3xl">🖨️</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Printer Issue Form</h1>
          <p className="text-slate-500 mt-2">Log the handover details for task <strong>{task.title}</strong></p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
          <FormClient 
            taskId={taskId} 
            printers={printerOptions} 
            assignees={assigneeOptions} 
          />
        </div>
      </div>
    </div>
  );
}
