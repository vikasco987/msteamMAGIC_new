




"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "@/components/ui/input";

interface TaskInfo {
  id: string;
  title?: string;
  amount?: number;
  status?: string;
}

interface Remark {
  id: string;
  remark: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
  paymentStatus?: string;
  amountDiscussed?: number;
  amountReceived?: number;
  nextFollowUpDate?: string;
  followUpStatus?: string;
  contactMethod?: string;
  contactedBy?: string;
  contactOutcome?: string;
  priorityLevel?: string;
  pendingDeadline?: string;
  pendingReason?: string;
  customerFeedback?: string;
  internalNotes?: string;
  task?: TaskInfo | null;
}

interface Props {
  taskId?: string;
  global?: boolean;
}

export default function PaymentRemarks({ taskId, global = false }: Props) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRemarks, setTotalRemarks] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState("todo");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("scheduled");
  const [contactMethod, setContactMethod] = useState("call");
  const [contactedBy, setContactedBy] = useState("");
  const [contactOutcome, setContactOutcome] = useState("not reachable");
  const [priorityLevel, setPriorityLevel] = useState("medium");

  const [pendingDeadline, setPendingDeadline] = useState("");
  const [pendingReason, setPendingReason] = useState("");
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const limit = 10;

  const loadRemarks = useCallback(
    async (pageNumber = 1) => {
      if (!taskId && !global) return;
      setLoading(true);
      try {
        const url = new URL("/api/remarks", window.location.origin);
        url.searchParams.set("page", pageNumber.toString());
        url.searchParams.set("limit", limit.toString());
        if (taskId && !global) url.searchParams.set("taskId", taskId);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch remarks");

        const data = await res.json();

        setRemarks(data.data || []);
        setPage(data.pagination.page || 1);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalRemarks(data.pagination.total || 0);
        setHasNext(data.pagination.hasNext || false);
      } catch (err) {
        console.error("❌ Fetch remarks failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [taskId, global]
  );

  useEffect(() => {
    if (taskId || global) loadRemarks(1);
  }, [taskId, global, loadRemarks]);

  const addRemark = async () => {
    if (!newRemark.trim() || !taskId) return;

    try {
      const res = await fetch("/api/remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remark: newRemark,
          taskId,
          paymentStatus,
          nextFollowUpDate: nextFollowUpDate || null,
          followUpStatus,
          contactMethod,
          contactedBy,
          contactOutcome,
          priorityLevel,
          pendingDeadline: pendingDeadline || null,
          pendingReason,
          customerFeedback,
          internalNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to add remark");

      const saved = await res.json();
      setRemarks((prev) => [saved.data || saved, ...prev]);
      setTotalRemarks((prev) => prev + 1);

      // Reset form
      setNewRemark("");
      setPaymentStatus("todo");
      setNextFollowUpDate("");
      setFollowUpStatus("scheduled");
      setContactMethod("call");
      setContactedBy("");
      setContactOutcome("not reachable");
      setPriorityLevel("medium");
      setPendingDeadline("");
      setPendingReason("");
      setCustomerFeedback("");
      setInternalNotes("");
    } catch (err) {
      console.error("❌ Add remark failed:", err);
      alert("Failed to add remark. Check console for details.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 p-4">
          <h2 className="text-lg font-semibold">
            💬 {global ? "All Remarks Timeline" : "Pending Payment Remarks"}
          </h2>

          {remarks.length === 0 && !loading ? (
            <p className="text-sm text-gray-500">No remarks yet</p>
          ) : (
            <div className="space-y-2 border p-2 rounded-md">
              {remarks.map((r, idx) => (
                <div
                  key={r.id}
                  className={`p-2 rounded-md border ${
                    r.pendingDeadline && new Date(r.pendingDeadline) < new Date()
                      ? "bg-red-100"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="text-sm">
                    <strong>#{(page - 1) * limit + idx + 1}</strong> {r.remark}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{r.authorName || "Unknown"}</span>
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="text-xs text-blue-600 mt-1 space-y-1">
                    {r.paymentStatus && <p>Status: {r.paymentStatus}</p>}
                    {r.amountDiscussed !== undefined && <p>Discussed: ₹{r.amountDiscussed}</p>}
                    {r.amountReceived !== undefined && <p>Received: ₹{r.amountReceived}</p>}
                    {r.nextFollowUpDate && (
                      <p>
                        Next Follow-up: {new Date(r.nextFollowUpDate).toLocaleString()} (
                        {r.followUpStatus || "N/A"} )
                      </p>
                    )}
                    {r.pendingDeadline && (
                      <p className="text-xs text-red-600">
                        Deadline: {new Date(r.pendingDeadline).toLocaleString()}
                        {new Date(r.pendingDeadline) < new Date() ? " ⏰ Overdue" : ""}
                      </p>
                    )}
                    {(r.contactMethod || r.contactedBy || r.contactOutcome || r.priorityLevel) && (
                      <p>
                        Contact: {r.contactMethod || "N/A"} by {r.contactedBy || "N/A"} | Outcome:{" "}
                        {r.contactOutcome || "N/A"} | Priority: {r.priorityLevel || "N/A"}
                      </p>
                    )}
                    {r.pendingReason && <p>Reason: {r.pendingReason}</p>}
                    {r.customerFeedback && <p>Customer Feedback: {r.customerFeedback}</p>}
                    {r.internalNotes && <p>Internal Notes: {r.internalNotes}</p>}
                  </div>

                  {r.task && (
                    <div className="text-xs text-gray-600 mt-1">
                      Task: {r.task.title} | ₹{r.task.amount} | {r.task.status}
                    </div>
                  )}
                </div>
              ))}

              {loading && <p className="text-center text-gray-500 py-2">Loading...</p>}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-2">
                  <Button disabled={page <= 1 || loading} onClick={() => loadRemarks(page - 1)}>
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600">
                    Showing {remarks.length} of {totalRemarks} remarks | Page {page} of {totalPages}
                  </span>

                  <Button disabled={!hasNext || loading} onClick={() => loadRemarks(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {!global && taskId && (
            <div className="space-y-2 mt-2">
              <Input
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                placeholder="Write a remark..."
              />
              <div className="grid grid-cols-2 gap-2">
                {/* Dropdowns for faster selection */}
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="todo">Todo</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>

                <Input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  placeholder="Next follow-up"
                />

                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>

                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>

                <Input
                  value={contactedBy}
                  onChange={(e) => setContactedBy(e.target.value)}
                  placeholder="Contacted by"
                />

                <select
                  value={contactOutcome}
                  onChange={(e) => setContactOutcome(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="not reachable">Not reachable</option>
                  <option value="negotiated">Negotiated</option>
                  <option value="promised date">Promised date</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={priorityLevel}
                  onChange={(e) => setPriorityLevel(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <Input
                  type="datetime-local"
                  value={pendingDeadline}
                  onChange={(e) => setPendingDeadline(e.target.value)}
                  placeholder="Pending deadline"
                />
                <Input
                  value={pendingReason}
                  onChange={(e) => setPendingReason(e.target.value)}
                  placeholder="Pending reason"
                />
                <Input
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  placeholder="Customer feedback"
                />
                <Input
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Internal notes"
                />
              </div>
              <Button onClick={addRemark}>Add Remark</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
