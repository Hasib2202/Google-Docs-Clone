import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [previousSharedCount, setPreviousSharedCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();
  const sharedSectionRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/user", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch shared documents when user is available
  useEffect(() => {
    if (user) {
      const fetchSharedDocuments = async () => {
        try {
          const res = await axios.get(
            "http://localhost:5000/api/documents/shared",
            { withCredentials: true }
          );
          setSharedDocuments(res.data);
          
          // Get stored count from localStorage or set initial count
          const storedCount = localStorage.getItem(`sharedDocsCount_${user._id}`);
          if (storedCount === null) {
            // First time loading, set current count as baseline
            localStorage.setItem(`sharedDocsCount_${user._id}`, res.data.length.toString());
            setPreviousSharedCount(res.data.length);
            setNotificationCount(0);
          } else {
            const prevCount = parseInt(storedCount);
            setPreviousSharedCount(prevCount);
            const newDocsCount = res.data.length - prevCount;
            setNotificationCount(newDocsCount > 0 ? newDocsCount : 0);
          }
        } catch (err) {
          console.error("Failed to fetch shared documents", err);
        } finally {
          setIsLoadingShared(false);
        }
      };
      fetchSharedDocuments();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleClick = () => {
    router.push("/dashboard/my-docs");
  };

  const handleNotificationClick = () => {
    // Clear notification count and update stored count
    setNotificationCount(0);
    if (user) {
      localStorage.setItem(`sharedDocsCount_${user._id}`, sharedDocuments.length.toString());
      setPreviousSharedCount(sharedDocuments.length);
    }
    
    // Scroll to shared documents section
    if (sharedSectionRef.current) {
      sharedSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-100 md:p-8">
      <Head>
        <title>Dashboard | Google Docs MVP</title>
      </Head>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 space-x-1 transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow hover:border-red-200 hover:bg-red-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium text-gray-600">Logout</span>
          </button>
        </header>

        {/* Main Content */}
        <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : user ? (
            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-3 md:p-10">
              {/* Profile Section */}
              <div className="md:col-span-1">
                <div className="p-6 text-center text-white shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <div className="relative w-32 h-32 mx-auto mb-4 overflow-hidden border-4 rounded-full border-white/30">
                    {user.avatar ? (
                      <img
                        src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
                        alt="User Avatar"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-indigo-400">
                        <span className="text-4xl font-bold text-white">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="mt-1 text-sm text-indigo-100">{user.email}</p>

                  <div className="mt-6">
                    <button
                      onClick={() => router.push("/dashboard/profile")}
                      className="flex items-center justify-center w-full px-4 py-2 font-medium text-indigo-600 transition-all duration-300 bg-white rounded-lg hover:bg-indigo-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                </div>

                <div className="p-6 mt-6 bg-gray-50 rounded-xl">
                  <h3 className="flex items-center mb-3 font-bold text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 mr-2 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Account Status
                  </h3>
                  <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-600">Verified</span>
                    <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-6 border border-indigo-100 bg-indigo-50 rounded-xl">
                    <h3 className="mb-4 font-bold text-gray-700">
                      Quick Actions
                    </h3>
                    <div className="space-y-4">
                      {/* My Document */}
                      <button
                        onClick={handleClick}
                        className="flex items-center space-x-3 w-full bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200
                     hover:shadow-lg hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-700">
                          My Document
                        </span>
                      </button>

                      {/* Notifications */}
                      <button
                        onClick={handleNotificationClick}
                        className="relative flex items-center space-x-3 w-full bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200
                     hover:shadow-lg hover:bg-blue-100 hover:text-blue-800 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-700">
                          Notifications
                        </span>
                        {/* Notification Badge */}
                        {notificationCount > 0 && (
                          <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </div>
                        )}
                      </button>

                      {/* Security */}
                      <button
                        className="flex items-center space-x-3 w-full bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200
                     hover:shadow-lg hover:bg-green-100 hover:text-green-800 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="p-2 bg-green-100 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-700">
                          Security
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-gray-200 bg-gray-50 rounded-xl">
                    <h3 className="mb-4 font-bold text-gray-700">
                      Your Statistics
                    </h3>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-indigo-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-600">Projects</span>
                        </div>
                        <span className="font-bold text-gray-800">12</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-purple-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-600">Active Since</span>
                        </div>
                        <span className="font-bold text-gray-800">
                          Jan 2023
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-600">Last Active</span>
                        </div>
                        <span className="font-bold text-gray-800">Today</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6 mt-6 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700">Recent Activity</h3>
                    <button className="text-sm font-medium text-indigo-600">
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 mt-1 bg-green-100 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Profile updated
                        </p>
                        <p className="text-sm text-gray-500">
                          You updated your profile information
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          2 hours ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 mt-1 bg-blue-100 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Payment received
                        </p>
                        <p className="text-sm text-gray-500">
                          Subscription payment completed
                        </p>
                        <p className="mt-1 text-xs text-gray-400">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 mb-4 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                Session Expired
              </h3>
              <p className="mb-6 text-gray-600">
                Your session has expired. Please log in again.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="px-6 py-2 font-medium text-white transition-colors duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Shared Documents Section */}
        <section ref={sharedSectionRef} className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Shared with Me</h2>

          {isLoadingShared ? (
            <div className="p-6 text-center bg-white border border-gray-200 rounded-xl">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : sharedDocuments.length === 0 ? (
            <div className="p-6 text-center bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No shared documents</h3>
              <p className="text-gray-500">Documents shared with you will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sharedDocuments.map(doc => (
                <div key={doc._id} className="overflow-hidden transition bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 truncate">{doc.title}</h4>
                      <button
                        onClick={() => router.push(`/document/${doc._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    <p className="mb-4 text-sm text-gray-500 truncate">
                      {doc.content?.substring(0, 100) || 'No content yet'}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Owner: {doc.owner?.name || 'Unknown'}
                      </span>
                      <div className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">
                        {doc.userRole === 'editor' ? 'Editor' : 'Viewer'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 text-sm text-center text-gray-500">
          <p>© 2025 Google Docs MVP. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}