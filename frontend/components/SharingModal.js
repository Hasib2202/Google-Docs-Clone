import { useState, useEffect } from 'react';
import axios from 'axios';

const SharingModal = ({ documentId, onClose, isOwner, currentUserId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOwner) {
      fetchCollaborators();
    }
  }, [documentId, isOwner]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/documents/${documentId}/collaborators`,
        { withCredentials: true }
      );
      setCollaborators(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch collaborators');
      setLoading(false);
    }
  };

  const addCollaborator = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.post(
        `http://localhost:5000/api/documents/${documentId}/share`,
        { email, role },
        { withCredentials: true }
      );

      setEmail('');
      setRole('editor');
      setSuccess('Collaborator added successfully');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.put(
        `http://localhost:5000/api/documents/${documentId}/collaborators/${userId}`,
        { role: newRole },
        { withCredentials: true }
      );

      setSuccess('Role updated successfully');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (userId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.delete(
        `http://localhost:5000/api/documents/${documentId}/collaborators/${userId}`,
        { withCredentials: true }
      );

      setSuccess('Collaborator removed successfully');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Share Document</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isOwner ? (
            <div className="p-4 mb-4 rounded-lg bg-blue-50">
              <p className="text-blue-800">Only the document owner can manage sharing settings</p>
            </div>
          ) : (
            <>
              {/* Add collaborator form */}
              <div className="mb-6">
                <h4 className="mb-2 font-medium text-gray-700">Add Collaborator</h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={addCollaborator}
                    disabled={loading}
                    className="px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Collaborators list */}
              <div>
                <h4 className="mb-2 font-medium text-gray-700">Current Collaborators</h4>
                <div className="space-y-3 overflow-y-auto max-h-60">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                    </div>
                  ) : collaborators.length === 0 ? (
                    <p className="py-4 text-center text-gray-500">No collaborators added yet</p>
                  ) : (
                    collaborators.map(collab => (
                      <div key={collab.user._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-500 rounded-full">
                            {collab.user.avatar ? (
                              <img
                                src={`http://localhost:5000/uploads/avatars/${collab.user.avatar}`}
                                alt={collab.user.name}
                                className="object-cover w-full h-full rounded-full"
                              />
                            ) : (
                              collab.user.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{collab.user.name}</p>
                            <p className="text-sm text-gray-500">{collab.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {collab.role === 'owner' ? (
                            <span className="px-2 py-1 text-sm font-semibold text-blue-600">Owner</span>
                          ) : (
                            <select
                              value={collab.role}
                              onChange={(e) => updateRole(collab.user._id, e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
                          {collab.role !== 'owner' && (
                            <button
                              onClick={() => removeCollaborator(collab.user._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Status messages */}
          {error && (
            <div className="p-3 mt-4 text-red-700 rounded-lg bg-red-50">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mt-4 text-green-700 rounded-lg bg-green-50">
              {success}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-800 transition bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharingModal;
