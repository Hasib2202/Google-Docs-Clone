export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-indigo-800 md:text-5xl">
          Welcome to Google Docs MVP
        </h1>
        <p className="mb-8 text-lg text-gray-700 md:text-xl">
          A simplified collaborative document editor built with the MERN stack.
        </p>

        <div className="flex flex-col justify-center gap-4 mb-10 sm:flex-row">
          <a
            href="/auth/login"
            className="px-6 py-3 text-lg text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Login
          </a>
          <a
            href="/auth/register"
            className="px-6 py-3 text-lg text-white transition bg-green-600 rounded-lg hover:bg-green-700"
          >
            Register
          </a>
        </div>

        <section className="grid gap-6 text-left sm:grid-cols-2 md:grid-cols-3">
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">🔐 Authentication</h3>
            <p className="text-sm text-gray-600">
              Secure registration, login, logout, and profile update using JWT & cookies.
            </p>
          </div>
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">📝 Document Editor</h3>
            <p className="text-sm text-gray-600">
              Create, view, edit, and delete documents with real-time autosave (coming soon).
            </p>
          </div>
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">🌐 Collaboration</h3>
            <p className="text-sm text-gray-600">
              Socket.IO based real-time editing and presence detection (upcoming).
            </p>
          </div>
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">📤 Share Access</h3>
            <p className="text-sm text-gray-600">
              Invite others to collaborate with viewer/editor roles (planned).
            </p>
          </div>
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">🧩 Tech Stack</h3>
            <p className="text-sm text-gray-600">
              Built using MongoDB, Express, React, Node.js, and Next.js with Tailwind CSS.
            </p>
          </div>
          <div className="p-6 bg-white border shadow-md rounded-xl">
            <h3 className="mb-2 text-xl font-semibold text-indigo-700">🚀 Deployment Ready</h3>
            <p className="text-sm text-gray-600">
              Designed for deployment on Vercel (frontend) and Render/Railway (backend).
            </p>
          </div>
        </section>

        <footer className="mt-16 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Docs MVP Project. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
