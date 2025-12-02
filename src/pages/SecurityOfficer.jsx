"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const BASE_URL =
  import.meta.env?.VITE_BASE_URL ||
  process.env.REACT_APP_BASE_URL ||
  "https://lost-items-backend-q30o.onrender.com"
const FOUND_ITEMS_URL = `${BASE_URL}/api/found-items`

export default function SecurityOfficer() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState("")
  const [foundItems, setFoundItems] = useState([])
  const [foundLoading, setFoundLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState({}) // { [claimId]: 'approved' | 'rejected' }
  const navigate = useNavigate()

  const fetchClaims = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("authToken")
      const url = `${BASE_URL}/api/claims`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to load claims")
      setClaims(data.claims || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFoundItems = async () => {
    setFoundLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(FOUND_ITEMS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to load found items")
      setFoundItems(data.items || data.foundItems || [])
    } catch (err) {
      console.error("Error loading found items:", err)
    } finally {
      setFoundLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
    fetchFoundItems()
  }, [])

  const stats = useMemo(() => {
    const total = claims.length
    const approved = claims.filter((c) => c.status === "approved").length
    const rejected = claims.filter((c) => c.status === "rejected").length
    const pending = total - approved - rejected
    return { total, approved, rejected, pending }
  }, [claims])

  const updateClaimStatus = async (claimId, status) => {
    setUpdatingId(claimId)
    setError("")
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("No authentication token found. Please sign in again.")
      }

      const url = `${BASE_URL}/api/claims/${claimId}`
      console.log("Updating claim:", { claimId, status, url })

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json().catch(() => ({ message: "Failed to parse response" }))
      
      console.log("Response:", { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.message || `Failed to update claim: ${response.status} ${response.statusText}`)
      }

      // Update the claim in state
      setClaims((prev) => prev.map((c) => {
        const id = c._id || c.id
        if (id === claimId) {
          return { ...c, status, ...(data.claim || {}) }
        }
        return c
      }))

      // Clear any previous errors on success and reflect action inline
      setError("")
      setActionStatus((prev) => ({ ...prev, [claimId]: status }))
      // Refresh found items if claim was approved to hide contact info
      if (status === "approved") {
        fetchFoundItems()
      }
      // Auto-clear the inline status after a short delay
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [claimId]: undefined }))
      }, 2500)
    } catch (e) {
      console.error("Error updating claim:", e)
      setError(e.message || "Failed to update claim. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-red-50 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-24 h-24 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-20 h-20 bg-red-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-red-400 rounded-full opacity-40 animate-ping"></div>
      <div className="absolute inset-0 bg-[#850303]/10 blur-3xl -z-10"></div>

      {/* Header */}
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
              <button
                onClick={() => {
                  localStorage.removeItem("authToken")
                  localStorage.removeItem("user")
                  navigate("/signin")
                }}
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black">Security Officer</h1>
          <p className="text-gray-600 mt-2">Review and manage item claims.</p>
        </div>

        {/* Stats Cards (similar to Admin) */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Claims</p>
                <p className="text-3xl font-bold text-[#850303]">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-[#850303]">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-[#850303]">{stats.approved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-[#850303]">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Claims panel (styled like Admin) */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">Claims</h2>
              <div className="flex items-center gap-2">
                <button onClick={fetchClaims} className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition">Refresh</button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No claims to review</p>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => {
                  const claimId = claim._id || claim.id
                  const item = typeof claim.item === "object" ? claim.item : (typeof claim.itemId === "object" ? claim.itemId : null)
                  const claimUniqueId = item?.uniqueIdentifier
                  // Check if this identifier matches any found item
                  const hasMatchingItem = claimUniqueId && foundItems.some(fi => 
                    fi.uniqueIdentifier && fi.uniqueIdentifier.toLowerCase() === claimUniqueId.toLowerCase()
                  )
                  return (
                    <div key={claimId} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      hasMatchingItem ? "border-green-400 bg-green-50/30" : "border-gray-200"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black mb-2">{item?.title || "Item Claim"}</h3>
                          <div className={`mb-3 p-3 rounded-lg border ${
                            hasMatchingItem 
                              ? "bg-green-100 border-green-300" 
                              : "bg-blue-50 border-blue-200"
                          }`}>
                            {/* Unique Identifier intentionally hidden in claims view */}
                          </div>
                          <p className="text-gray-600 mb-2">{item?.description || "N/A"}</p>
                          <div className="mb-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-1">Ownership Proof:</p>
                            <p className="text-sm text-purple-800 break-words">
                              {claim.ownershipProof || "N/A"}
                            </p>
                          </div>
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
                            {claim.claimantEmail && (
                              <span><strong>Email:</strong> {claim.claimantEmail}</span>
                            )}
                            {claim.createdAt && (
                              <span><strong>Submitted:</strong> {new Date(claim.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {claim.status === "pending" ? (
                            <>
                              <button
                                disabled={updatingId === claimId}
                                onClick={() => updateClaimStatus(claimId, "approved")}
                                className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm disabled:opacity-60"
                              >{updatingId === claimId ? "Updating..." : "Approve"}</button>
                              <button
                                disabled={updatingId === claimId}
                                onClick={() => updateClaimStatus(claimId, "rejected")}
                                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm disabled:opacity-60"
                              >{updatingId === claimId ? "Updating..." : "Reject"}</button>
                              {actionStatus[claimId] && (
                                <span
                                  className={`text-sm font-medium ${
                                    actionStatus[claimId] === "approved" ? "text-green-700" : "text-red-700"
                                  }`}
                                >
                                  {actionStatus[claimId] === "approved" ? "Approved" : "Rejected"}
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              className={`text-sm font-semibold ${
                                claim.status === "approved" ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              {claim.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#850303]/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black">Found Items</h2>
              <button onClick={fetchFoundItems} className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition">Refresh</button>
            </div>
            {foundLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850303] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading found items...</p>
              </div>
            ) : foundItems.length === 0 ? (
              <p className="text-center py-12 text-gray-600">No found items available</p>
            ) : (
              <div className="space-y-4">
                {foundItems.map((item) => {
                  const itemId = item._id || item.id
                  const itemUniqueId = item.uniqueIdentifier
                  // Check if this identifier matches any pending claim
                  const hasMatchingClaim = itemUniqueId && claims.some(c => {
                    const claimItem = typeof c.item === "object" ? c.item : null
                    return claimItem?.uniqueIdentifier && 
                           claimItem.uniqueIdentifier.toLowerCase() === itemUniqueId.toLowerCase() &&
                           c.status === "pending"
                  })
                  // Check if there's an approved claim for this item
                  const hasApprovedClaim = claims.some(c => {
                    if (c.status !== "approved") return false
                    const claimItem = typeof c.item === "object" ? c.item : null
                    if (!claimItem) return false
                    const claimItemId = claimItem._id || claimItem.id || (typeof c.item === "string" ? c.item : null)
                    return claimItemId && claimItemId.toString() === itemId.toString()
                  })
                  return (
                  <div key={itemId} className={`border rounded-lg p-4 ${
                    hasMatchingClaim ? "border-green-400 bg-green-50/30" : "border-gray-200 bg-gray-50"
                  }`}>
                    <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                    <div className={`mb-3 p-3 rounded-lg border ${
                      hasMatchingClaim 
                        ? "bg-green-100 border-green-300" 
                        : "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-semibold mb-1 ${
                            hasMatchingClaim ? "text-green-900" : "text-blue-900"
                          }`}>
                            Unique Identifier:
                            {hasMatchingClaim && (
                              <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">✓ Claim Pending</span>
                            )}
                          </p>
                          <p className={`text-base font-mono font-bold ${
                            hasMatchingClaim ? "text-green-700" : "text-blue-700"
                          }`}>
                            {itemUniqueId || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{item.description || "No description"}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span><strong>Category:</strong> {item.category || "N/A"}</span>
                      <span><strong>Location:</strong> {item.locationFound || item.location || "N/A"}</span>
                      {item.status && <span><strong>Status:</strong> {item.status}</span>}
                      {item.dateFound && <span><strong>Found:</strong> {new Date(item.dateFound).toLocaleDateString()}</span>}
                      {!hasApprovedClaim && item.contactEmail && (
                        <span><strong>Email:</strong> {item.contactEmail}</span>
                      )}
                      {!hasApprovedClaim && item.contactPhone && (
                        <span><strong>Phone:</strong> {item.contactPhone}</span>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


