"use client"

import { useState, useEffect } from "react"

// ✅ Helper functions to format date and time separately
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// ✅ Customer Form Component
function CustomerForm({ onCustomerAdded }: { onCustomerAdded: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", remark: "" })
  const [message, setMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("Saving...")

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage("✅ Customer saved successfully!")
        setForm({ name: "", phone: "", email: "", remark: "" })
        onCustomerAdded()
      } else {
        setMessage("❌ " + (data.error || "Something went wrong"))
      }
    } catch (error: any) {
      setMessage("❌ Network or server error")
    }
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">Add New Customer</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition"
        />
        <textarea
          name="remark"
          placeholder="Remark"
          value={form.remark}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition"
          rows={3}
        />
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-blue-500 hover:to-indigo-500 transition"
        >
          Save Customer
        </button>
      </form>
      {message && <p className="text-center mt-4 text-indigo-700 font-semibold">{message}</p>}
    </div>
  )
}

// ✅ Customer List Component
function CustomerList({ refresh }: { refresh: number }) {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      setMessage("")
      try {
        const res = await fetch("/api/customers")
        const data = await res.json()

        if (res.ok) {
          setCustomers(data)
        } else {
          setMessage("❌ " + (data.error || "Failed to load customers"))
        }
      } catch (error) {
        setMessage("❌ Network or server error")
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [refresh])

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">Customer List</h2>
      {message && <p className="text-center text-red-500 mb-4 font-semibold">{message}</p>}

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-400">No customers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-indigo-50">
              <tr className="text-indigo-600 font-semibold">
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Phone</th>
                <th className="p-3 border-b">Email</th>
                <th className="p-3 border-b">Remark</th>
                <th className="p-3 border-b">Date</th>
                <th className="p-3 border-b">Time</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr
                  key={c.id}
                  className={`text-center hover:bg-indigo-50 transition ${
                    i % 2 === 0 ? "bg-white" : "bg-indigo-50"
                  }`}
                >
                  <td className="p-3 border-b">{c.name}</td>
                  <td className="p-3 border-b">{c.phone}</td>
                  <td className="p-3 border-b">{c.email || "-"}</td>
                  <td className="p-3 border-b">{c.remark || "-"}</td>
                  <td className="p-3 border-b font-medium">{formatDate(c.createdAt)}</td>
                  <td className="p-3 border-b font-medium">{formatTime(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ✅ Main Page with Tabs
export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"form" | "list">("form")
  const [refreshList, setRefreshList] = useState(0)

  const handleCustomerAdded = () => {
    setRefreshList((prev) => prev + 1)
    setActiveTab("list")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-10 space-x-4">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-6 py-3 rounded-2xl font-semibold shadow-md transition ${
              activeTab === "form"
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                : "bg-white text-indigo-600 border border-indigo-200 hover:shadow-lg"
            }`}
          >
            ➕ Add Customer
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 rounded-2xl font-semibold shadow-md transition ${
              activeTab === "list"
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                : "bg-white text-indigo-600 border border-indigo-200 hover:shadow-lg"
            }`}
          >
            📋 View Customers
          </button>
        </div>

        {/* Content */}
        {activeTab === "form" ? (
          <CustomerForm onCustomerAdded={handleCustomerAdded} />
        ) : (
          <CustomerList refresh={refreshList} />
        )}
      </div>
    </div>
  )
}
