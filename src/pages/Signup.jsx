"use client"

import { useReducer, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  Car,
  Shield,
  LogIn,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const BASE_URL = import.meta.env?.VITE_BASE_URL || process.env.REACT_APP_BASE_URL || "http://localhost:5000"

// Constants for validation
const VALIDATION_RULES = {
  NAME: { required: true, message: "Name is required" },
  EMAIL: { required: true, pattern: /\S+@\S+\.\S+/, message: "Invalid email format" },
  PASSWORD: { required: true, minLength: 8, message: "Password must be at least 8 characters" },
  CONFIRM_PASSWORD: { required: true, message: "Passwords do not match" },
  ADMIN_SECRET: { required: true, message: "Admin secret is required" },
  PHONE: { pattern: /^\+?[\d\s-]{10,}$/, message: "Invalid phone number format" },
  ROLE: { required: true, pattern: /^(user|security)$/, message: "Invalid role selected" },
}

// Initial state for reducer
const initialState = {
  formData: {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    studentId: "",
    phone: "",
    adminSecret: "",
  },
  errors: {},
  passwordStrength: 0,
  isSignup: false,
  showPassword: false,
  showConfirmPassword: false,
  showAdminSecret: false,
  showAdminModal: false,
  adminEmail: "",
  adminPassword: "",
  loading: false,
  error: "",
  success: "",
}

// Reducer for state management
const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: "" },
      }
    case "SET_ERRORS":
      return { ...state, errors: action.errors }
    case "SET_PASSWORD_STRENGTH":
      return { ...state, passwordStrength: action.strength }
    case "TOGGLE_AUTH_MODE":
      return { ...initialState, isSignup: !state.isSignup }
    case "SET_VISIBILITY":
      return { ...state, [action.field]: action.value }
    case "SET_STATUS":
      return { ...state, [action.field]: action.value }
    case "TOGGLE_ADMIN_MODAL":
      return { ...state, showAdminModal: !state.showAdminModal, adminEmail: "", adminPassword: "" }
    case "UPDATE_ADMIN_FIELD":
      return { ...state, [action.field]: action.value }
    case "RESET":
      return initialState
    default:
      return state
  }
}

// Enhanced Input Component with semantic design tokens
const InputField = ({
  icon: Icon,
  type,
  name,
  value,
  onChange,
  placeholder,
  error,
  showToggle,
  toggleVisibility,
  isVisible,
  ariaLabel,
}) => (
  <div className="space-y-2">
    <label className="relative block">
      <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors duration-200" />
      <input
        type={isVisible && showToggle ? "text" : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full pl-12 pr-${showToggle ? "12" : "4"} py-3 bg-input border ${
          error ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-ring"
        } rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => toggleVisibility(name)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          aria-label={isVisible ? `Hide ${ariaLabel}` : `Show ${ariaLabel}`}
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </label>
    {error && (
      <p className="text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
)

export default function Signup() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const navigate = useNavigate()

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length > 7) strength += 25
    if (password.match(/[A-Z]/)) strength += 25
    if (password.match(/[0-9]/)) strength += 25
    if (password.match(/[^A-Za-z0-9]/)) strength += 25
    return strength
  }

  useEffect(() => {
    if (state.isSignup) {
      dispatch({ type: "SET_PASSWORD_STRENGTH", strength: calculatePasswordStrength(state.formData.password) })
    }
  }, [state.formData.password, state.isSignup])

  // Validation logic
  const validateForm = () => {
    const errors = {}

    if (state.isSignup && !state.formData.name.trim()) {
      errors.name = VALIDATION_RULES.NAME.message
    }

    if (!state.formData.email.trim()) {
      errors.email = VALIDATION_RULES.EMAIL.message
    } else if (!VALIDATION_RULES.EMAIL.pattern.test(state.formData.email)) {
      errors.email = VALIDATION_RULES.EMAIL.message
    }

    if (!state.formData.password) {
      errors.password = VALIDATION_RULES.PASSWORD.message
    } else if (state.isSignup && state.formData.password.length < VALIDATION_RULES.PASSWORD.minLength) {
      errors.password = VALIDATION_RULES.PASSWORD.message
    }

    if (state.isSignup && state.formData.password !== state.formData.confirmPassword) {
      errors.confirmPassword = VALIDATION_RULES.CONFIRM_PASSWORD.message
    }

    if (state.isSignup && !state.formData.role) {
      errors.role = VALIDATION_RULES.ROLE.message
    } else if (state.isSignup && !VALIDATION_RULES.ROLE.pattern.test(state.formData.role)) {
      errors.role = VALIDATION_RULES.ROLE.message
    }

    if (state.isSignup && state.formData.phone && !VALIDATION_RULES.PHONE.pattern.test(state.formData.phone)) {
      errors.phone = VALIDATION_RULES.PHONE.message
    }

    dispatch({ type: "SET_ERRORS", errors })
    return Object.keys(errors).length === 0
  }

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target
    dispatch({ type: "UPDATE_FIELD", field: name, value })
    dispatch({ type: "SET_STATUS", field: "error", value: "" })
  }

  // Toggle visibility for password fields
  const toggleVisibility = (field) => {
    const fieldMap = {
      password: "showPassword",
      confirmPassword: "showConfirmPassword",
      adminSecret: "showAdminSecret",
    }
    dispatch({ type: "SET_VISIBILITY", field: fieldMap[field], value: !state[fieldMap[field]] })
  }

  // Toggle between signin and signup
  const toggleAuthMode = () => {
    dispatch({ type: "TOGGLE_AUTH_MODE" })
  }

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      console.log("Validation failed, errors:", state.errors)
      return
    }

    dispatch({ type: "SET_STATUS", field: "loading", value: true })
    dispatch({ type: "SET_STATUS", field: "error", value: "" })
    dispatch({ type: "SET_STATUS", field: "success", value: "" })

    try {
      const endpoint = state.isSignup ? `${BASE_URL}/api/auth/signup` : `${BASE_URL}/api/auth/signin`
      const formData = new FormData(e.target)
      const payload = state.isSignup
        ? {
            name: state.formData.name,
            email: state.formData.email,
            password: state.formData.password,
            // Map UI role "security" to backend-expected "staff"
            role: (state.formData.role || formData.get("role")) === "security" ? "staff" : (state.formData.role || formData.get("role")),
            studentId: state.formData.studentId || undefined,
            phone: state.formData.phone || undefined,
          }
        : {
            email: state.formData.email,
            password: state.formData.password,
          }

      console.log("Submitting form data:", Object.fromEntries(formData))
      console.log("Submitting payload:", payload)
      console.log("Endpoint:", endpoint)

      if (state.isSignup && !["user", "security", "staff"].includes(payload.role)) {
        throw new Error("Invalid role in payload")
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        throw new Error(`Server error (${response.status}): Unable to parse response`)
      }

      console.log("Response data:", data, "Status:", response.status)

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Authentication failed (${response.status})`
        console.error("API error:", errorMessage, data)
        throw new Error(errorMessage)
      }

      dispatch({ type: "SET_STATUS", field: "success", value: data.message })

      // Normalize user and role from response
      const rawUser = data.user || {}
      // Map server "staff" to UI role "security"
      const serverRole = rawUser.role === "staff" ? "security" : rawUser.role
      const allowedRoles = ["user", "security", "admin"]
      const normalizedRole = allowedRoles.includes(serverRole) ? serverRole : "user"
      const user = { ...rawUser, role: normalizedRole }

      // Update localStorage
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("user", JSON.stringify(user))

      // Dispatch custom event to notify AuthContext
      window.dispatchEvent(new Event("authChange"))

      // Wait for AuthContext to update
      setTimeout(() => {
        console.log("Navigating post-auth, localStorage:", {
          authToken: localStorage.getItem("authToken"),
          user: localStorage.getItem("user"),
        })
        const destination = user.role === "security" ? "/security" : "/dashboard"
        navigate(destination, { replace: true })
      }, 200)
    } catch (err) {
      console.error("Submission error:", err)
      const errorMessage = err.message || "An unexpected error occurred. Please check your connection and try again."
      dispatch({ type: "SET_STATUS", field: "error", value: errorMessage })
    } finally {
      dispatch({ type: "SET_STATUS", field: "loading", value: false })
    }
  }

  // Password strength color using semantic tokens
  const getPasswordStrengthColor = () => {
    if (state.passwordStrength <= 25) return "bg-destructive"
    if (state.passwordStrength <= 50) return "bg-yellow-500"
    if (state.passwordStrength <= 75) return "bg-blue-500"
    return "bg-secondary"
  }

  const getPasswordStrengthText = () => {
    if (state.passwordStrength <= 25) return "Weak"
    if (state.passwordStrength <= 50) return "Fair"
    if (state.passwordStrength <= 75) return "Good"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Bubbly background */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-20 h-20 bg-red-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-red-400 rounded-full opacity-40 animate-ping"></div>
      <div className="absolute inset-0 bg-[#850303]/10 blur-3xl -z-10"></div>

      <div className="flex w-full max-w-7xl flex-col lg:flex-row justify-between relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex items-center min-h-screen">
          <div className="flex flex-col space-y-8 max-w-2xl">
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-[#850303] tracking-tight text-balance">
                Lost Items Reporting and Searching
                <span className="block text-[#850303]"></span>
              </h1>
              <p className="text-xl text-black leading-relaxed">
                Secure, efficient reporting and recovery of lost items on campus. Join our community-driven platform to
                help reunite students with their belongings.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 text-black">
                <div className="w-2 h-2 bg-[#4d0000] rounded-full"></div>
                <span>Quick and easy item reporting</span>
              </div>
              <div className="flex items-center gap-3 text-black">
                <div className="w-2 h-2 bg-[#4d0000] rounded-full"></div>
                <span>Convenient For Students</span>
              </div>
              <div className="flex items-center gap-3 text-black">
                <div className="w-2 h-2 bg-[#4d0000] rounded-full"></div>
                <span>Secure and confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md lg:max-w-md flex items-center min-h-screen">
          <div className="w-full bg-card border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#850303] rounded-2xl mb-6 shadow-lg">
                {state.isSignup ? (
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                ) : (
                  <LogIn className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-card-foreground mb-2">
                {state.isSignup ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground">
                {state.isSignup ? "Join the WSU community today" : "Sign in to access your account"}
              </p>
            </div>

            {/* Messages */}
            {state.success && (
              <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{state.success}</span>
              </div>
            )}
            {state.error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{state.error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <input type="hidden" name="role" value={state.formData.role} />
              {state.isSignup && (
                <InputField
                  icon={User}
                  type="text"
                  name="name"
                  value={state.formData.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  error={state.errors.name}
                  ariaLabel="Full Name"
                />
              )}

              <InputField
                icon={Mail}
                type="email"
                name="email"
                value={state.formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                error={state.errors.email}
                ariaLabel="Email Address"
              />

              <div className="space-y-3">
                <InputField
                  icon={Lock}
                  type="password"
                  name="password"
                  value={state.formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  error={state.errors.password}
                  showToggle
                  toggleVisibility={toggleVisibility}
                  isVisible={state.showPassword}
                  ariaLabel="Password"
                />
                {state.isSignup && state.formData.password && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${state.passwordStrength}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Password Strength: {getPasswordStrengthText()}</span>
                      <span>{state.passwordStrength}%</span>
                    </p>
                  </div>
                )}
              </div>

              {state.isSignup && (
                <InputField
                  icon={Lock}
                  type="password"
                  name="confirmPassword"
                  value={state.formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  error={state.errors.confirmPassword}
                  showToggle
                  toggleVisibility={toggleVisibility}
                  isVisible={state.showConfirmPassword}
                  ariaLabel="Confirm Password"
                />
              )}

              {state.isSignup && (
                <div className="space-y-2">
                  <label className="relative block">
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <select
                      name="role"
                      value={state.formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 appearance-none text-sm"
                      aria-label="User Role"
                    >
                      <option value="user">Regular User</option>
                      <option value="security">Security Officer</option>
                    </select>
                  </label>
                  {state.errors.role && (
                    <p className="text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4" />
                      {state.errors.role}
                    </p>
                  )}
                </div>
              )}

              {state.isSignup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField
                    icon={Car}
                    type="text"
                    name="studentId"
                    value={state.formData.studentId}
                    onChange={handleInputChange}
                    placeholder={state.formData.role === "security" ? "Officer ID (Optional)" : "Student ID (Optional)"}
                    error={state.errors.studentId}
                    ariaLabel={state.formData.role === "security" ? "Officer ID" : "Student ID"}
                  />
                  <InputField
                    icon={Phone}
                    type="tel"
                    name="phone"
                    value={state.formData.phone}
                    onChange={handleInputChange}
                    placeholder={state.formData.role === "security" ? "Officer Phone (Optional)" : "Phone Number (Optional)"}
                    error={state.errors.phone}
                    ariaLabel="Phone Number"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={state.loading}
                className="w-full bg-[#850303] hover:bg-[#660000] disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-sm"
                aria-label={state.isSignup ? "Create Account" : "Sign In"}
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{state.isSignup ? "Creating Account..." : "Signing In..."}</span>
                  </>
                ) : (
                  <>
                    {state.isSignup ? (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Admin Login Button - Only show when in sign-in mode */}
            {!state.isSignup && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_ADMIN_MODAL" })}
                  disabled={state.loading}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Admin
                </button>
              </div>
            )}

            {/* Toggle Button */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                {state.isSignup ? "Already have an account?" : "Don't have an account?"}
              </p>
              <button
                onClick={toggleAuthMode}
                disabled={state.loading}
                className="text-[#850303] hover:text-[#660000] font-medium text-sm transition-colors duration-200 underline decoration-2 underline-offset-4 hover:decoration-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={state.isSignup ? "Switch to Sign In" : "Switch to Sign Up"}
              >
                {state.isSignup ? "Sign in here" : "Create one now"}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Secured with industry-standard encryption
              </p>
            </div>
          </div>
        </div>

        {/* Admin Modal */}
        {state.showAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Admin Access</h3>
                <button 
                  onClick={() => dispatch({ type: "TOGGLE_ADMIN_MODAL" })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">Enter admin credentials to sign in</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={state.adminEmail}
                    onChange={(e) => dispatch({ type: "UPDATE_ADMIN_FIELD", field: "adminEmail", value: e.target.value })}
                    placeholder="Enter admin email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={state.adminPassword}
                    onChange={(e) => dispatch({ type: "UPDATE_ADMIN_FIELD", field: "adminPassword", value: e.target.value })}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (state.adminEmail && state.adminPassword) {
                        dispatch({ type: "SET_STATUS", field: "loading", value: true })
                        dispatch({ type: "SET_STATUS", field: "error", value: "" })

                        try {
                          const response = await fetch(`${BASE_URL}/api/auth/signin`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: state.adminEmail, password: state.adminPassword }),
                          })

                          let data
                          try {
                            data = await response.json()
                          } catch (parseError) {
                            throw new Error(`Server error (${response.status}): Unable to parse response`)
                          }

                          if (response.ok) {
                            localStorage.setItem("authToken", data.token || "admin-authenticated")
                            localStorage.setItem("user", JSON.stringify(data.user || { role: "admin", email: state.adminEmail }))
                            dispatch({ type: "TOGGLE_ADMIN_MODAL" })
                            window.location.href = "/Admin"
                          } else {
                            dispatch({ type: "SET_STATUS", field: "error", value: data?.message || data?.error || "Invalid credentials" })
                          }
                        } catch (err) {
                          console.error("Admin signin error:", err)
                          dispatch({ type: "SET_STATUS", field: "error", value: err.message || "Network error. Please try again." })
                        } finally {
                          dispatch({ type: "SET_STATUS", field: "loading", value: false })
                        }
                      }
                    }}
                    disabled={state.loading || !state.adminEmail || !state.adminPassword}
                    className="flex-1 px-4 py-2 bg-[#850303] text-white rounded-lg font-semibold hover:bg-[#700202] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.loading ? "Signing In..." : "Sign In"}
                  </button>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_ADMIN_MODAL" })}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    disabled={state.loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}