import Head from "next/head";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }
    if (!avatar) {
      toast.error("Avatar is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("avatar", avatar);

    try {
      await axios.post("http://localhost:5000/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Registered successfully!");
      router.push("/auth/login");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <>
      <Head>
        <title>Register | Google Docs MVP</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-purple-100 to-indigo-200">
        <div className="w-full max-w-md p-8 border shadow-2xl bg-white/40 backdrop-blur-lg rounded-2xl border-white/30">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-2">
              <UserPlus className="w-10 h-10 text-indigo-700" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
            <p className="mt-1 text-sm text-gray-600">Join and start collaborating!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="avatar" className="text-sm font-medium text-gray-700">
                Upload Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                
                className="w-full px-4 py-2 mt-1 transition border border-gray-300 rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-700">
            Already have an account?{" "}
            <a href="/auth/login" className="font-medium text-indigo-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
