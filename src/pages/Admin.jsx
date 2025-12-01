"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const BASE_URL = import.meta.env?.VITE_BASE_URL || process.env.REACT_APP_BASE_URL || "http://localhost:5000"

export default function Admin() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState("dashboard") // dashboard, users, foundItems, lostItems, claims
  const [users, setUsers] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [lostItems, setLostItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null")
      setUser(u)
      if (!u || u.role !== "admin") {
        navigate("/signin", { replace: true })
      }
    } catch {
      navigate("/signin", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    // Fetch dashboard data on mount
    if (view === "dashboard") {
      fetchUsers()
      fetchClaims()
      fetchFoundItems()
      fetchLostItems()
    } else if (view === "users") {
      fetchUsers()
    } else if (view === "foundItems") {
      fetchFoundItems()
    } else if (view === "lostItems") {
      fetchLostItems()
    } else if (view === "claims") {
      fetchClaims()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]) // fetchClaims, fetchFoundItems, fetchLostItems, fetchUsers are stable functions

  const fetchUsers = async () => {
    // Don't set loading if we're on dashboard (to avoid blocking the UI)
    if (view !== "dashboard") {
      setLoading(true)
    }
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        // Filter out admin users
        const filteredUsers = (data.users || []).filter((u) => u.role !== "admin")
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      if (view !== "dashboard") {
        setLoading(false)
      }
    }
  }

  const fetchClaims = async () => {
    // Don't set loading if we're on dashboard (to avoid blocking the UI)
    if (view !== "dashboard") {
      setLoading(true)
    }
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${BASE_URL}/api/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      } else {
        const errorData = await response.json()
        console.error("Error fetching claims:", errorData.message || "Failed to fetch claims")
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
    } finally {
      if (view !== "dashboard") {
        setLoading(false)
      }
    }
  }

  const fetchFoundItems = async () => {
    // Don't set loading if we're on dashboard (to avoid blocking the UI)
    if (view !== "dashboard") {
      setLoading(true)
    }
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${BASE_URL}/api/found-items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setFoundItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching found items:", error)
    } finally {
      if (view !== "dashboard") {
        setLoading(false)
      }
    }
  }

  const fetchLostItems = async () => {
    // Don't set loading if we're on dashboard (to avoid blocking the UI)
    if (view !== "dashboard") {
      setLoading(true)
    }
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${BASE_URL}/api/lost-items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLostItems(data.items || [])
      }
    } catch (error) {
      console.error("Error fetching lost items:", error)
    } finally {
      if (view !== "dashboard") {
        setLoading(false)
      }
    }
  }

  const handleDeleteClick = (userData) => {
    setUserToDelete(userData)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const token = localStorage.getItem("authToken")
      const userId = userToDelete._id || userToDelete.id
      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setUsers(users.filter((u) => (u._id || u.id) !== userId))
        setShowDeleteModal(false)
        setUserToDelete(null)
      } else {
        const data = await response.json()
        alert(data.message || "Failed to delete user")
        setShowDeleteModal(false)
        setUserToDelete(null)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user")
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    navigate("/signin")
  }

  return (
    <div className="min-h-screen bg-red-50 relative overflow-hidden">
      {/* Bubbly background */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-20 h-20 bg-red-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-red-400 rounded-full opacity-40 animate-ping"></div>
      <div className="absolute inset-0 bg-[#850303]/10 blur-3xl -z-10"></div>

      {/* Header with Logout */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 hover:text-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-red-200">Welcome, {user?.name || "Admin"}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-900 rounded-lg font-semibold hover:bg-red-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">Admin Portal</h1>
            <p className="text-gray-600 mt-2">Manage the platform below.</p>
          </div>
          {view !== "dashboard" && (
            <button
              onClick={() => setView("dashboard")}
              className="px-4 py-2 rounded-lg bg-[#850303] text-white font-medium hover:opacity-90 transition"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        {view === "dashboard" ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-[#850303]">{users.length}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-8 h-8 text-[#850303]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Lost Items</p>
                    <p className="text-3xl font-bold text-[#850303]">{lostItems.length}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Found Items</p>
                    <p className="text-3xl font-bold text-[#850303]">{foundItems.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Claims</p>
                    <p className="text-3xl font-bold text-[#850303]">{claims.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-semibold text-black mb-2">Users Management</h2>
                <p className="text-gray-600 mb-4">View and manage registered users, change roles, and manage permissions.</p>
                <button 
                  onClick={() => setView("users")}
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition"
                >
                  Manage Users
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-semibold text-black mb-2">Found Items</h2>
                <p className="text-gray-600 mb-4">Audit and moderate reported found items. Approve or reject claims.</p>
                <button 
                  onClick={() => setView("foundItems")}
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition"
                >
                  View Found Items
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-semibold text-black mb-2">Lost Items</h2>
                <p className="text-gray-600 mb-4">Audit and moderate reported lost items. Track and match with found items.</p>
                <button 
                  onClick={() => setView("lostItems")}
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition"
                >
                  View Lost Items
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-xl font-semibold text-black mb-2">Claims</h2>
                <p className="text-gray-600 mb-4">View and manage item claims. Approve or reject user claims.</p>
                <button 
                  onClick={() => setView("claims")}
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition"
                >
                  View Claims
                </button>
              </div>
            </div>
          </>
        ) : view === "users" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <h2 className="text-2xl font-bold text-black mb-6">Users Management</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id || u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">{u.studentId || "N/A"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin" ? "bg-red-100 text-red-800" :
                            u.role === "staff" ? "bg-green-100 text-green-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteClick(u)}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : view === "foundItems" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <h2 className="text-2xl font-bold text-black mb-6">Found Items</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading found items...</p>
              </div>
            ) : foundItems.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No found items found</p>
            ) : (
              <div className="space-y-4">
                {foundItems.map((item) => (
                  <div key={item._id || item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span><strong>Category:</strong> {item.category}</span>
                          <span><strong>Location:</strong> {item.locationFound || "N/A"}</span>
                          <span><strong>Status:</strong> {item.status || "unclaimed"}</span>
                          {item.foundBy && (
                            <span><strong>Found By:</strong> {typeof item.foundBy === "object" ? item.foundBy.name : item.foundBy}</span>
                          )}
                          {item.dateFound && (
                            <span><strong>Date Found:</strong> {new Date(item.dateFound).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : view === "lostItems" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <h2 className="text-2xl font-bold text-black mb-6">Lost Items</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading lost items...</p>
              </div>
            ) : lostItems.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No lost items found</p>
            ) : (
              <div className="space-y-4">
                {lostItems.map((item) => (
                  <div key={item._id || item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span><strong>Category:</strong> {item.category}</span>
                          <span><strong>Location:</strong> {item.location || "N/A"}</span>
                          <span><strong>Status:</strong> {item.status || "active"}</span>
                          {item.reportedBy && (
                            <span><strong>Reported By:</strong> {typeof item.reportedBy === "object" ? item.reportedBy.name : item.reportedBy}</span>
                          )}
                          {item.dateLost && (
                            <span><strong>Date Lost:</strong> {new Date(item.dateLost).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : view === "claims" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <h2 className="text-2xl font-bold text-black mb-6">Claims</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No claims found</p>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => {
                  const item = typeof claim.item === "object" ? claim.item : (typeof claim.itemId === "object" ? claim.itemId : null)
                  return (
                    <div key={claim._id || claim.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black mb-2">
                            {item?.title || "Item Claim"}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {item?.description || "N/A"}
                          </p>
                          {item?.category && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Category:</strong> {item.category}
                            </p>
                          )}
                          {item?.uniqueIdentifier && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Unique Identifier:</strong> {item.uniqueIdentifier}
                            </p>
                          )}
                          <div className="mb-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-1">Ownership Proof:</p>
                            <p className="text-sm text-purple-800 break-words">
                              {claim.ownershipProof || "N/A"}
                            </p>
                          </div>
                          {claim.status === "approved" && (() => {
                            const claimantEmail = claim.claimant?.email || claim.claimantEmail
                            const claimantPhone = claim.claimant?.phone
                            return (claimantEmail || claimantPhone) ? (
                              <div className="mb-3 p-3 rounded-lg border bg-green-50 border-green-300">
                                <p className="text-sm font-semibold text-green-900 mb-2">Contact Information:</p>
                                <div className="space-y-1">
                                  {claimantEmail && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <a href={`mailto:${claimantEmail}`} className="text-sm text-green-800 hover:text-green-900 hover:underline">
                                        {claimantEmail}
                                      </a>
                                    </div>
                                  )}
                                  {claimantPhone && (
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      <a href={`tel:${claimantPhone}`} className="text-sm text-green-800 hover:text-green-900 hover:underline">
                                        {claimantPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null
                          })()}
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <span><strong>Status:</strong> </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              claim.status === "approved" ? "bg-green-100 text-green-800" :
                              claim.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {claim.status || "pending"}
                            </span>
                            {claim.claimant && (
                              <span><strong>Claimant:</strong> {typeof claim.claimant === "object" ? claim.claimant.name : claim.claimantName || "N/A"}</span>
                            )}
                            {!claim.claimant && claim.claimantName && (
                              <span><strong>Claimant:</strong> {claim.claimantName}</span>
                            )}
                            {claim.claimant?.studentId && (
                              <span><strong>Student ID:</strong> {claim.claimant.studentId}</span>
                            )}
                            {claim.reviewedBy && (
                              <span><strong>Reviewed By:</strong> {typeof claim.reviewedBy === "object" ? claim.reviewedBy.name : "N/A"}</span>
                            )}
                            {claim.reviewedAt && (
                              <span><strong>Reviewed:</strong> {new Date(claim.reviewedAt).toLocaleDateString()}</span>
                            )}
                            {claim.createdAt && (
                              <span><strong>Submitted:</strong> {new Date(claim.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-black mb-4">Confirm Delete User</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{userToDelete.name}</strong> ({userToDelete.email})? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


