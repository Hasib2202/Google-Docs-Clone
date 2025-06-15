import Head from "next/head";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Determine API URL based on environment
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? '/api/auth/login'
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`;

    await axios.post(apiUrl, form, {
      withCredentials: true, // Crucial for cookies
    });
    
    toast.success("Login successful!");
    router.push("/dashboard/dashboard");
  } catch (err) {
    // Enhanced error logging
    console.error("Login error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });
    
    toast.error(err.response?.data?.msg || "Login failed");
  }
};

  return (
    <>
      <Head>
        <title>Login | Google Docs MVP</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-100 to-indigo-200">
        <div className="w-full max-w-md p-8 border shadow-2xl bg-white/40 backdrop-blur-lg rounded-2xl border-white/30">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-2">
              <Lock className="w-10 h-10 text-indigo-700" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="mt-1 text-sm text-gray-600">
              Please sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white transition bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-700">
            Don’t have an account?{" "}
            <a href="/auth/register" className="font-medium text-indigo-600 hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
