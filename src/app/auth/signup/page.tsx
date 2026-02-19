"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  form?: string
}

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = "Your name is required."
    }
    if (!form.email.trim()) {
      newErrors.email = "Email address is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address."
    }
    if (!form.password) {
      newErrors.password = "Password is required."
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password."
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match — give it another try."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      // 1. Create the account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error || "Something went wrong. Please try again." })
        setLoading(false)
        return
      }

      // 2. Auto-login with the new credentials
      const signInResult = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      })

      if (signInResult?.error) {
        setErrors({ form: "Account created but we couldn't log you in. Please log in manually." })
        setLoading(false)
        return
      }

      // 3. Redirect to dashboard
      router.push("/dashboard")
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#2D3436]">Create your account</h1>
        <p className="text-[#636E72] mt-1 text-sm leading-relaxed">
          Take things one step at a time — starting here.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Name"
          name="name"
          type="text"
          placeholder="What should we call you?"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          autoComplete="name"
          autoFocus
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Same password again"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {errors.form && (
          <div
            className="px-4 py-3 rounded-xl bg-[#FDF2F2] border border-[#E07070] text-[#E07070] text-sm leading-relaxed"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          fullWidth
          className="mt-1"
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-[#636E72] mt-6">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-[#6B8F9E] font-medium hover:text-[#5A7D8C] transition-colors"
        >
          Log in
        </Link>
      </p>
    </>
  )
}
