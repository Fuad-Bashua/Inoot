"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface FormErrors {
  email?: string
  password?: string
  form?: string
}

// Map NextAuth error messages to human-readable, supportive text
function parseAuthError(error: string): string {
  if (error.includes("No account found")) return "No account found with that email."
  if (error.includes("Incorrect password")) return "That password doesn't match — give it another try."
  if (error.includes("Email and password are required")) return "Please enter your email and password."
  return "Something went wrong. Please try again."
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.email.trim()) newErrors.email = "Email address is required."
    if (!form.password) newErrors.password = "Password is required."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    const result = await signIn("credentials", {
      email: form.email.trim(),
      password: form.password,
      redirect: false,
    })

    if (result?.error) {
      setErrors({ form: parseAuthError(result.error) })
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-[#9CA3AF] mt-2 text-base leading-relaxed">
          Pick up right where you left off.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
          autoFocus
          variant="glass"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          variant="glass"
        />

        {errors.form && (
          <div
            className="px-4 py-3 rounded-xl bg-[rgba(107,143,158,0.1)] border-l-4 border-[#6B8F9E] text-[#cfe2ea] text-sm leading-relaxed"
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
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-[#9CA3AF] mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[#9ec0ce] font-medium hover:text-white transition-colors"
        >
          Sign up
        </Link>
      </p>
    </>
  )
}
