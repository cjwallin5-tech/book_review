import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 5) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  function validateField(name: string, value: string): string {
    if (name === "username") {
      if (!value) return "Username is required";
      if (value.length < 3 || value.length > 20) return "Must be 3–20 characters";
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Letters, numbers, and underscores only";
    }
    if (name === "email") {
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
    }
    if (name === "password") {
      if (!value) return "Password is required";
      if (value.length < 8) return "At least 8 characters";
      if (!/[A-Z]/.test(value)) return "Needs an uppercase letter";
      if (!/[a-z]/.test(value)) return "Needs a lowercase letter";
      if (!/[0-9]/.test(value)) return "Needs a number";
      if (!/[^A-Za-z0-9]/.test(value)) return "Needs a special character";
    }
    if (name === "confirmPassword") {
      if (!value) return "Please confirm your password";
      if (value !== password) return "Passwords do not match";
    }
    return "";
  }

  function handleBlur(name: string, value: string) {
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error || undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: FieldErrors = {};
    const fields = [
      { name: "username", value: username },
      { name: "email", value: email },
      { name: "password", value: password },
      { name: "confirmPassword", value: confirmPassword },
    ];
    fields.forEach(({ name, value }) => {
      const err = validateField(name, value);
      if (err) errors[name as keyof FieldErrors] = err;
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setGeneralError("");
    try {
      await (register as (username: string, password: string, email?: string) => Promise<void>)(
        username.trim(),
        password,
        email.trim().toLowerCase()
      );
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.toLowerCase().includes("username")) {
          setFieldErrors({ username: msg });
        } else if (msg.toLowerCase().includes("email")) {
          setFieldErrors({ email: msg });
        } else if (msg.toLowerCase().includes("password")) {
          setFieldErrors({ password: msg });
        } else {
          setGeneralError(msg);
        }
      } else {
        setGeneralError("Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1 block w-full rounded-lg border dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 transition-colors";
  const inputOk = "border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500";
  const inputErr = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Create your account</h1>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
        Join the community of readers
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-5"
      >
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={(e) => handleBlur("username", e.target.value)}
            autoComplete="username"
            className={`${inputBase} ${fieldErrors.username ? inputErr : inputOk}`}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            autoComplete="email"
            className={`${inputBase} ${fieldErrors.email ? inputErr : inputOk}`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  const err = validateField("password", e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: err || undefined }));
                }
              }}
              onBlur={(e) => handleBlur("password", e.target.value)}
              autoComplete="new-password"
              className={`${inputBase} pr-10 ${fieldErrors.password ? inputErr : inputOk}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a10.05 10.05 0 011.875.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      strength.score >= i * 1.5
                        ? strength.color
                        : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.label === "Weak" ? "text-red-500" :
                strength.label === "Fair" ? "text-yellow-500" :
                strength.label === "Good" ? "text-blue-500" : "text-green-500"
              }`}>
                {strength.label}
              </p>
            </div>
          )}

          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  const err = e.target.value !== password ? "Passwords do not match" : "";
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: err || undefined }));
                }
              }}
              onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
              autoComplete="new-password"
              className={`${inputBase} pr-10 ${fieldErrors.confirmPassword ? inputErr : inputOk}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a10.05 10.05 0 011.875.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !fieldErrors.confirmPassword && confirmPassword === password && (
            <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Passwords match
            </p>
          )}
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {generalError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{generalError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
