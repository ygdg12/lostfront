"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// Support both Vite and CRA environment variables
const API_URL =
  import.meta.env?.VITE_API_URL || process.env.REACT_APP_API_URL || "http://localhost:5000/api/found-items"
const BASE_URL = import.meta.env?.VITE_BASE_URL || process.env.REACT_APP_BASE_URL || "http://localhost:5000"
const CLAIMS_URL = (import.meta.env?.VITE_CLAIMS_API_URL || process.env.REACT_APP_CLAIMS_API_URL) || `${BASE_URL}/api/claims`

export default function FoundItems() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [formData, setFormData] = useState({
    uniqueIdentifier: "",
    title: "",
    description: "",
    category: "",
    location: "",
    dateFound: "",
    contactEmail: "",
    contactPhone: "",
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState("grid")
  const fileInputRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Claim modal state
  const [claimItem, setClaimItem] = useState(null)
  const [claimForm, setClaimForm] = useState({ ownershipProof: "", verificationAnswers: "" })
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [userClaims, setUserClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [claimsError, setClaimsError] = useState("")
  const [showClaimsModal, setShowClaimsModal] = useState(false)

  // Update modal state
  const [updateItem, setUpdateItem] = useState(null)
  const [updateFormData, setUpdateFormData] = useState({
    uniqueIdentifier: "",
    title: "",
    description: "",
    category: "",
    location: "",
    dateFound: "",
    contactEmail: "",
    contactPhone: "",
  })

  const fetchUserClaims = async () => {
    const token = localStorage.getItem("authToken")
    if (!token) return
    setClaimsLoading(true)
    setClaimsError("")
    try {
      const res = await fetch(CLAIMS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to load claims")
      setUserClaims(data.claims || [])
    } catch (err) {
      setClaimsError(err.message || "Failed to load claims")
      setUserClaims([])
    } finally {
      setClaimsLoading(false)
    }
  }

  // Get current user from localStorage and refresh on auth changes
  useEffect(() => {
    const updateUser = () => {
      try {
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          setCurrentUser(user)
        } else {
          setCurrentUser(null)
        }
      } catch (err) {
        console.error("Error parsing user from localStorage:", err)
        setCurrentUser(null)
      }
    }
    
    updateUser()
    window.addEventListener("authChange", updateUser)
    return () => window.removeEventListener("authChange", updateUser)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchItems()
    fetchUserClaims()
  }, []) // Only run once on mount

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      const res = await axios.get(API_URL, { headers })
      
      console.log("Fetched items:", res.data.items)
      const normalizedItems = (res.data.items || []).map((item) => {
        const normalizedImages = item.images
          ? item.images.map((img) => {
              const filename = img.split("/").pop()
              const normalizedPath = `/uploads/found-items/${filename}`
              console.log(`Normalizing image: ${img} -> ${normalizedPath}`)
              return normalizedPath
            })
          : []
        return {
          ...item,
          contactEmail: item.contactEmail ?? "",
          contactPhone: item.contactPhone ?? "",
          images: normalizedImages,
        }
      })
      console.log("Normalized items:", normalizedItems)
      setItems(normalizedItems)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to load items"
      console.error("Error fetching items:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })
      showNotification(errorMessage, "error")
    }
  }

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 4000)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setUserClaims([])
    setClaimsError("")
    navigate("/signin")
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleImageChange = (e) => setImages(Array.from(e.target.files))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Client-side validation
    const cleaned = {
      uniqueIdentifier: formData.uniqueIdentifier.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      location: formData.location.trim(),
      dateFound: formData.dateFound,
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
    }
    const { uniqueIdentifier, title, description, category, location, dateFound, contactEmail, contactPhone } = cleaned
    if (!uniqueIdentifier || !title || !description || !category || !location || !dateFound || !contactEmail || !contactPhone) {
      showNotification("Please fill out all required fields", "error")
      setLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      showNotification("Please enter a valid email address", "error")
      setLoading(false)
      return
    }

    // Validate phone format (10-15 digits, allowing spaces, dashes, or +)
    const phoneRegex = /^\+?\d{10,15}$/
    if (!phoneRegex.test(contactPhone.replace(/[\s-]/g, ""))) {
      showNotification("Please enter a valid phone number (10-15 digits)", "error")
      setLoading(false)
      return
    }

    // Validate description length (minimum 10 characters)
    if (description.length < 10) {
      showNotification("Description must be at least 10 characters long", "error")
      setLoading(false)
      return
    }

    try {
      const data = new FormData()
      Object.entries(cleaned).forEach(([k, v]) => {
        if (v) data.append(k, v) // Only append non-empty values
      })
      images.forEach((img) => data.append("images", img))

      // Log FormData for debugging
      const formDataEntries = Object.fromEntries(data)
      console.log("Submitting FormData:", formDataEntries)

      const token = localStorage.getItem("authToken")
      const headers = { "Content-Type": "multipart/form-data" }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await axios.post(API_URL, data, { headers })

      showNotification(res.data.message || "Item successfully added to registry!", "success")
      setFormData({
        uniqueIdentifier: "",
        title: "",
        description: "",
        category: "",
        location: "",
        dateFound: "",
        contactEmail: "",
        contactPhone: "",
      })
      setImages([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      setShowForm(false)
      // Refresh items to show the update button for the newly created item
      await fetchItems()
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to add item"
      console.error("Error submitting form:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      })
      showNotification(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map((item) => item.category))]

  return (
    <div className="min-h-screen bg-red-50">
      {/* Enhanced Notification */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl border transition-all duration-500 transform ${
            notification.show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          } ${
            notification.type === "success"
              ? "bg-[#850303] text-white border-[#850303]"
              : "bg-[#850303] text-white border-[#850303]"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#850303] hover:text-[#850303] font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowClaimsModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#850303]/40 text-[#850303] rounded-lg font-semibold hover:bg-[#850303]/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Claims
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#850303] text-white rounded-lg font-semibold hover:bg-[#700202] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="text-center mb-16 relative">
          {/* Decorative bubbles */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-red-300 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-red-400 rounded-full opacity-40 animate-ping"></div>
          <div className="absolute inset-0 bg-[#850303]/10 blur-3xl -z-10"></div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#850303] rounded-2xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-black mb-4">Found Items Registry</h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            Help reunite lost treasures with their rightful owners through our community-driven platform
          </p>
        </div>

        {/* Claims Modal */}
        {showClaimsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">My Claims</h2>
                  <p className="text-gray-600 text-sm">Track the status of items you have claimed.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchUserClaims}
                    className="px-4 py-2 rounded-lg bg-[#850303] text-white text-sm font-medium hover:bg-[#700202] transition"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowClaimsModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto">
                {claimsError && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm">
                    {claimsError}
                  </div>
                )}
                {claimsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#850303] mx-auto"></div>
                    <p className="mt-3 text-gray-600 text-sm">Loading your claims...</p>
                  </div>
                ) : userClaims.length === 0 ? (
                  <p className="text-center text-gray-600 py-6 text-sm">You have not submitted any claims yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userClaims.map((claim) => {
                      const claimId = claim._id || claim.id
                      const item = typeof claim.item === "object" ? claim.item : (typeof claim.itemId === "object" ? claim.itemId : null)
                      const status = (claim.status || "pending").toLowerCase()
                      const statusClasses =
                        status === "approved"
                          ? "bg-green-100 text-green-800"
                          : status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
                      
                      // Get contact information for approved claims
                      const contactEmail = status === "approved" ? (item?.contactEmail || item?.foundBy?.email) : null
                      const contactPhone = status === "approved" ? (item?.contactPhone || item?.foundBy?.phone) : null
                      
                      return (
                        <div key={claimId} className="border border-[#850303]/10 rounded-xl p-4 bg-[#850303]/5">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-[#850303] mb-1">{item?.title || "Claim"}</h3>
                              <p className="text-gray-700 text-sm mb-2">{item?.description || claim.ownershipProof || "No description provided."}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                                {item?.category && <span><strong>Category:</strong> {item.category}</span>}
                                {(item?.locationFound || item?.location) && (
                                  <span><strong>Location:</strong> {item.locationFound || item.location}</span>
                                )}
                                {claim.createdAt && (
                                  <span><strong>Submitted:</strong> {new Date(claim.createdAt).toLocaleDateString()}</span>
                                )}
                                {claim.reviewedAt && (
                                  <span><strong>Reviewed:</strong> {new Date(claim.reviewedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              {status === "approved" && (contactEmail || contactPhone) && (
                                <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-200">
                                  <p className="text-xs font-semibold text-green-900 mb-2">Contact Information to Retrieve Item:</p>
                                  <div className="space-y-1.5">
                                    {contactEmail && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5 text-green-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <a href={`mailto:${contactEmail}`} className="text-xs text-green-800 hover:text-green-900 hover:underline break-all">
                                          {contactEmail}
                                        </a>
                                      </div>
                                    )}
                                    {contactPhone && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5 text-green-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <a href={`tel:${contactPhone}`} className="text-xs text-green-800 hover:text-green-900 hover:underline">
                                          {contactPhone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses} self-start`}>{statusLabel}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                showForm ? "bg-[#850303] text-white hover:bg-[#850303]" : "bg-[#850303] text-white hover:bg-[#850303]"
              }`}
            >
              {showForm ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Report Found Item
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-[#850303] text-white" : "text-black hover:bg-gray-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-[#850303] text-white" : "text-black hover:bg-gray-100"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">Report Found Item</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Unique Identifier *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="text"
                        name="uniqueIdentifier"
                        placeholder="Serial number, engraving, tag, etc."
                        value={formData.uniqueIdentifier}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Item Title *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="text"
                        name="title"
                        placeholder="What did you find?"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Category *</label>
                      <select
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>
                          Select a category
                        </option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books">Books</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Documents">Documents</option>
                        <option value="Keys">Keys</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">Description *</label>
                    <textarea
                      className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all resize-none"
                      name="description"
                      placeholder="Detailed description to help identify the item"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Location Found *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="text"
                        name="location"
                        placeholder="Where was it found?"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Date Found *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="date"
                        name="dateFound"
                        value={formData.dateFound}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Contact Email *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="email"
                        name="contactEmail"
                        placeholder="your.email@example.com"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-black">Contact Phone *</label>
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                        type="tel"
                        name="contactPhone"
                        placeholder="(555) 123-4567"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-black">Photos</label>
                    <div className="relative">
                      <input
                        className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#850303] file:text-white file:font-medium hover:file:bg-[#850303] file:cursor-pointer cursor-pointer transition-all"
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                      />
                    </div>
                    {images.length > 0 && (
                      <p className="text-sm text-[#850303] font-medium">{images.length} image(s) selected</p>
                    )}
                  </div>

                  <button
                    className="w-full bg-[#850303] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#850303] focus:outline-none focus:ring-2 focus:ring-[#850303] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Found Item
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              className="w-full bg-white border-2 border-[#850303]/20 rounded-xl pl-12 pr-4 py-4 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
              type="text"
              placeholder="Search by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative min-w-[250px]">
            <select
              className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-4 text-black focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center bg-[#850303]/10 px-4 py-2 rounded-xl">
            <span className="text-[#850303] font-semibold text-lg">{filteredItems.length} items</span>
          </div>
        </div>

        {/* Items Display */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">No items found</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              {searchTerm || selectedCategory
                ? "Try adjusting your search criteria or browse all categories"
                : "Be the first to help someone by reporting a found item"}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-6"}>
            {filteredItems.map((item) => {
              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-[#850303]/10 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group ${
                    viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                  }`}
                >
                  {/* Item Images */}
                  {item.images && item.images.length > 0 ? (
                    <div className={`${viewMode === "list" ? "w-full sm:w-64 h-48" : "h-48"} relative overflow-hidden`}>
                      <img
                        src={`${BASE_URL}${item.images[0]}`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          console.error(`Failed to load image: ${BASE_URL}${item.images[0]}`)
                          // Use a reliable external placeholder to avoid 404s in dev
                          e.currentTarget.onerror = null
                          e.currentTarget.src = "https://via.placeholder.com/800x600?text=No+Image"
                        }}
                      />
                      {item.images.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          +{item.images.length - 1} more
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div
                      className={`${viewMode === "list" ? "w-full sm:w-64 h-48" : "h-48"} relative overflow-hidden bg-gray-100 flex items-center justify-center`}
                    >
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}

                  {/* Item Content */}
                  <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-black group-hover:text-[#850303] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#850303]/10 text-[#850303] whitespace-nowrap ml-4">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">{item.description}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 bg-[#850303]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#850303]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h8a2 2 0 002-2L16 7"
                            />
                          </svg>
                        </div>
                        <span className="font-medium">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 bg-[#850303]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium">Found on {new Date(item.dateFound).toLocaleDateString()}</span>
                      </div>
                    </div>


                    {/* Action buttons */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => {
                          setClaimItem(item)
                          setClaimForm({ ownershipProof: "", verificationAnswers: "" })
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#850303] text-white text-sm font-medium hover:opacity-90 transition"
                      >
                        Claim
                      </button>
                      {(() => {
                        // Only show update button if user is logged in
                        if (!currentUser) return false
                        
                        // If item has no foundBy, user cannot update it (item was created anonymously)
                        if (!item.foundBy) return false
                        
                        // Extract foundBy ID - handle both object and string formats
                        let foundById = null
                        if (typeof item.foundBy === "object" && item.foundBy !== null) {
                          foundById = item.foundBy._id || item.foundBy.id
                        } else if (typeof item.foundBy === "string") {
                          foundById = item.foundBy
                        }
                        
                        // Extract current user ID
                        const userId = currentUser._id || currentUser.id
                        
                        // Both IDs must exist for comparison
                        if (!foundById || !userId) return false
                        
                        // Normalize IDs to strings for comparison
                        const foundByIdStr = String(foundById)
                        const userIdStr = String(userId)
                        
                        // Check if user is the owner
                        const isOwner = foundByIdStr === userIdStr
                        
                        return isOwner
                      })() && (
                        <button
                          onClick={() => {
                            setUpdateItem(item)
                            setUpdateFormData({
                              uniqueIdentifier: item.uniqueIdentifier || '',
                              title: item.title,
                              description: item.description,
                              category: item.category,
                              location: item.location,
                              dateFound: item.dateFound ? new Date(item.dateFound).toISOString().split('T')[0] : '',
                              contactEmail: item.contactEmail || '',
                              contactPhone: item.contactPhone || '',
                            })
                          }}
                          className="px-3 py-1.5 rounded-md bg-gray-500 text-white text-sm font-medium hover:opacity-90 transition"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#850303] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* Update Modal */}
      {updateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Update "{updateItem.title}"</h3>
              <button
                onClick={() => setUpdateItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              
              try {
                const token = localStorage.getItem("authToken")
                if (!token) {
                  showNotification("Please sign in to update items", "error")
                  setLoading(false)
                  return
                }
                const payload = { ...updateFormData }
                const res = await fetch(`${API_URL}/${updateItem._id}`, {
                  method: "PATCH",
                  headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || "Failed to update item")
                showNotification(data.message || "Item updated successfully", "success")
                // Update list locally with populated foundBy
                setItems((prev) => prev.map((it) => {
                  const itemId = it._id || it.id
                  const updatedId = data.item._id || data.item.id
                  if (itemId && updatedId && itemId.toString() === updatedId.toString()) {
                    // Merge the updated item, preserving foundBy if it exists
                    return {
                      ...data.item,
                      foundBy: data.item.foundBy || it.foundBy
                    }
                  }
                  return it
                }))
                setUpdateItem(null)
                // Refresh items to ensure all data is up to date
                fetchItems()
              } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || "Failed to update item";
                showNotification(errorMessage, "error");
              } finally {
                setLoading(false);
              }
            }} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Unique Identifier *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="text"
                    name="uniqueIdentifier"
                    placeholder="Serial number, engraving, tag, etc."
                    value={updateFormData.uniqueIdentifier}
                    onChange={(e) => setUpdateFormData({...updateFormData, uniqueIdentifier: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Item Title *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="text"
                    name="title"
                    placeholder="What did you find?"
                    value={updateFormData.title}
                    onChange={(e) => setUpdateFormData({...updateFormData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Category *</label>
                  <select
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    name="category"
                    value={updateFormData.category}
                    onChange={(e) => setUpdateFormData({...updateFormData, category: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Books">Books</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Documents">Documents</option>
                    <option value="Keys">Keys</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-black">Description *</label>
                <textarea
                  className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all resize-none"
                  name="description"
                  placeholder="Detailed description to help identify the item"
                  value={updateFormData.description}
                  onChange={(e) => setUpdateFormData({...updateFormData, description: e.target.value})}
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Location Found *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="text"
                    name="location"
                    placeholder="Where was it found?"
                    value={updateFormData.location}
                    onChange={(e) => setUpdateFormData({...updateFormData, location: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Date Found *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="date"
                    name="dateFound"
                    value={updateFormData.dateFound}
                    onChange={(e) => setUpdateFormData({...updateFormData, dateFound: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Contact Email *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="email"
                    name="contactEmail"
                    placeholder="Email address"
                    value={updateFormData.contactEmail}
                    onChange={(e) => setUpdateFormData({...updateFormData, contactEmail: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">Contact Phone *</label>
                  <input
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all"
                    type="tel"
                    name="contactPhone"
                    placeholder="Phone number"
                    value={updateFormData.contactPhone}
                    onChange={(e) => setUpdateFormData({...updateFormData, contactPhone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUpdateItem(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white hover:bg-[#700202] transition-colors"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Claim "{claimItem.title}"</h3>
              <button
                onClick={() => setClaimItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const token = localStorage.getItem("authToken")
                if (!token) {
                  showNotification("Please sign in to submit a claim", "error")
                  return
                }
                if (!claimForm.ownershipProof.trim()) {
                  showNotification("Ownership proof is required", "error")
                  return
                }
                try {
                  setClaimSubmitting(true)
                  const res = await fetch(CLAIMS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      item: claimItem._id,
                      ownershipProof: claimForm.ownershipProof.trim(),
                      verificationAnswers: claimForm.verificationAnswers.trim() || undefined,
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.message || "Failed to submit claim")
                  showNotification(data.message || "Claim submitted successfully", "success")
                  setClaimItem(null)
                } catch (err) {
                  showNotification(err.message, "error")
                } finally {
                  setClaimSubmitting(false)
                }
              }}
            >
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Ownership Proof *</label>
                  <textarea
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Share a unique detail only you would know (serial, engraving, etc.)"
                    value={claimForm.ownershipProof}
                    onChange={(e) => setClaimForm({ ...claimForm, ownershipProof: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Verification Answers (optional)</label>
                  <textarea
                    className="w-full bg-white border-2 border-[#850303]/20 rounded-xl px-4 py-3 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#850303] focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="Answer any verification questions if provided by staff."
                    value={claimForm.verificationAnswers}
                    onChange={(e) => setClaimForm({ ...claimForm, verificationAnswers: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClaimItem(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#850303] text-white font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {claimSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
