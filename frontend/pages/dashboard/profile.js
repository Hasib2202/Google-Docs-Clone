import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { FiUser, FiLock, FiCamera, FiArrowLeft } from "react-icons/fi";
import Head from "next/head";


export default function ProfileUpdate() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Determine API URL based on environment
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/user`;
        const res = await axios.get(apiUrl, { withCredentials: true });

        setUser(res.data);
        setForm({ name: res.data.name, password: "" });

        // Determine avatar URL based on environment
        const avatarBaseUrl = process.env.NODE_ENV === 'development'
          ? 'http://localhost:5000'
          : process.env.NEXT_PUBLIC_BACKEND_URL;

        // Fixed avatar URL construction
        setAvatarPreview(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/avatars/${res.data.avatar}`
        );
      } catch (err) {
        console.error("User fetch error:", {
          error: err.response?.data || err.message,
          status: err.response?.status
        });
        router.push("/auth/login");
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    if (form.password) formData.append("password", form.password);
    if (avatar) formData.append("avatar", avatar);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-profile`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Profile updated successfully");
      // Redirect to dashboard after successful update
      setTimeout(() => {
        router.push("/dashboard/dashboard");
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-100">
      <Head>
        <title>Profile | Google Docs MVP</title>
      </Head>
      <div className="w-full max-w-4xl">
        <div className="flex justify-start mb-6">
          <button
            onClick={() => router.push("/dashboard/dashboard")}
            className="flex items-center font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
          <div className="md:flex">
            {/* Left side - Avatar Section */}
            <div className="flex flex-col items-center p-8 text-white md:w-1/3 bg-gradient-to-br from-indigo-500 to-purple-600">
              <h2 className="mb-6 text-2xl font-bold">Profile Picture</h2>

              <div className="relative mb-6 group">
                <div className="w-40 h-40 overflow-hidden border-4 rounded-full shadow-lg border-white/30">
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 cursor-pointer bg-black/40 group-hover:opacity-100">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <FiCamera className="text-3xl text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <label
                htmlFor="avatar-upload"
                className="flex items-center px-6 py-2 font-medium text-indigo-600 transition-colors bg-white rounded-lg cursor-pointer hover:bg-indigo-50"
              >
                <FiCamera className="mr-2" />
                Change Photo
              </label>

              <p className="mt-4 text-sm text-center text-indigo-200">
                JPG, PNG or GIF. Max size of 2MB.
              </p>
            </div>

            {/* Right side - Form Section */}
            <div className="p-8 md:w-2/3">
              <h2 className="mb-2 text-3xl font-bold text-gray-800">
                Update Profile
              </h2>
              <p className="mb-8 text-gray-600">
                Edit your personal information below
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full py-3 pl-10 pr-4 transition border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="New Password (leave blank to keep current)"
                      className="w-full py-3 pl-10 pr-4 transition border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center transition ${isLoading
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                      } text-white shadow-md hover:shadow-lg`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
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
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/dashboard")}
                    className="flex items-center justify-center px-6 py-3 font-medium text-gray-700 transition border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="pt-6 mt-8 border-t border-gray-200">
                <h3 className="mb-3 font-bold text-gray-700">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{user?.email || "loading..."}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "loading..."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* Footer */}
        <footer className="mt-8 text-sm text-center text-gray-500">
          <p>© 2025 Google Docs MVP. All rights reserved.</p>
        </footer>
      </div>
    </div>

  );
}
