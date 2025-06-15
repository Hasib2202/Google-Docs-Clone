// pages/dashboard/my-docs.js
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Head from "next/head";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast"; // make sure toast is imported

export default function MyDocs() {
  const [docs, setDocs] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Determine API URL based on environment
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documents/my-docs`;

        const res = await axios.get(apiUrl, { withCredentials: true });
        setDocs(res.data);
      } catch (err) {
        console.error("Failed to fetch documents", {
          error: err.response?.data || err.message,
          status: err.response?.status
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const createDocument = async () => {
    if (!newTitle.trim()) return;

    try {
      // Determine API URL based on environment
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documents`;

      const res = await axios.post(
        apiUrl,
        { title: newTitle, content: "" },
        { withCredentials: true }
      );

      setDocs([res.data, ...docs]);
      setNewTitle("");
      setShowCreateModal(false);
      router.push(`/document/${res.data._id}`);
    } catch (err) {
      console.error("Failed to create document", {
        error: err.response?.data || err.message,
        status: err.response?.status
      });
      toast.error("Failed to create document. Please try again.");
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Determine API URL based on environment
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documents/${id}`;

      await axios.delete(apiUrl, { withCredentials: true });

      setDocs(docs.filter((d) => d._id !== id));
      toast.success("Document deleted successfully");
    } catch (err) {
      const errorData = {
        status: err.response?.status,
        message: err.response?.data?.msg || err.message
      };

      console.error("Failed to delete document", errorData);

      if (errorData.status === 403) {
        toast.error("You are not the owner. You can't delete this document.");
      } else {
        toast.error(errorData.message || "Failed to delete document.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-50 md:p-8">
      <Head>
        <title>My Documents | Google Docs MVP</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 text-white transition rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Document
          </button>
        </header>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => router.push("/dashboard/dashboard")}
            className="flex items-center font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="overflow-hidden bg-white shadow-lg rounded-2xl">
          {docs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No documents yet
              </h3>
              <p className="mb-4 text-gray-500">
                Create your first document to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-white transition rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Create Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc) => (
                <div
                  key={doc._id}
                  className="overflow-hidden transition border border-gray-200 shadow-sm bg-gray-50 rounded-xl hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-800 truncate">
                        {doc.title || "Untitled Document"}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/document/${doc._id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteDocument(doc._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mb-4 text-sm text-gray-500 truncate">
                      {doc.content?.substring(0, 100) || "No content yet"}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Last updated:{" "}
                        {doc.updatedAt
                          ? new Date(doc.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </span>

                      <div className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                        {doc.owner?.name || "You"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Create New Document
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700">Document Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document title"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createDocument}
                className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
