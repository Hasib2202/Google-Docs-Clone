// pages/document/[id].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useSocket } from '../../context/SocketContext';
import SharingModal from '../../components/SharingModal';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function DocumentEditor() {
  const router = useRouter();
  const { id: documentId } = router.query;
  const socket = useSocket();
  const quillRef = useRef(null);
  
  // State variables
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [userRole, setUserRole] = useState('editor'); // 'owner', 'editor', or 'viewer'
  const isOwner = userRole === 'owner'; // Derived state
  // Compute read-only state
  const isReadOnly = userRole === 'viewer';

  // Fetch document data
  useEffect(() => {
    if (!documentId) return;
    
    const fetchDocument = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/documents/${documentId}`, {
          withCredentials: true
        });
        setDocument(res.data);
        setTitle(res.data.title);
        setContent(res.data.content);
        setUserRole(res.data.userRole); // Set user role from API response
        console.log("User role set to:", res.data.userRole); // Debug log
      } catch (err) {
        console.error('Failed to load document', err);
      }
    };
    
    fetchDocument();
  }, [documentId]);
  
  // Socket.IO connection and events
  useEffect(() => {
    if (!socket || !documentId) return;
    
    // Connect to socket
    socket.connect();
    
    // Join document room
    socket.emit('join-document', documentId);
    
    // Handle document updates from server
    const handleDocumentUpdate = (content) => {
      setContent(content);
    };
    
    socket.on('document-update', handleDocumentUpdate);
    
    // Handle user presence updates
    const handleCurrentUsers = (users) => {
      setOnlineUsers(users);
    };
    
    socket.on('current-users', handleCurrentUsers);
    
    // Handle new user joining
    const handleUserJoined = (user) => {
      setOnlineUsers(prev => [...prev, user]);
    };
    
    socket.on('user-joined', handleUserJoined);
    
    // Handle user leaving
    const handleUserLeft = (userId) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== userId));
    };
    
    socket.on('user-left', handleUserLeft);
    
    // Clean up
    return () => {
      socket.emit('leave-document', documentId);
      socket.off('document-update', handleDocumentUpdate);
      socket.off('current-users', handleCurrentUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.disconnect();
    };
  }, [socket, documentId]);
  
  // Handle content changes
  const handleContentChange = (newContent) => {
    if (isReadOnly) return; // Prevent changes in view mode
    
    setContent(newContent);
    
    // Send changes to server
    if (socket) {
      socket.emit('document-change', {
        documentId,
        content: newContent
      });
    }
  };
  
  // Save document to database
  const handleSave = async () => {
    if (!title.trim() || isReadOnly) return;
    setIsSaving(true);
    
    try {
      await axios.put(
        `http://localhost:5000/api/documents/${documentId}`,
        { title, content },
        { withCredentials: true }
      );
      setIsSaving(false);
    } catch (err) {
      console.error('Failed to save document', err);
      setIsSaving(false);
    }
  };
  
  // Auto-save every 3 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (document && !isReadOnly && (title !== document.title || content !== document.content)) {
        handleSave();
      }
    }, 3000);
    
    return () => clearInterval(autoSave);
  }, [title, content, document, isReadOnly]);
  
  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/dashboard/my-docs')}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => !isReadOnly && setTitle(e.target.value)}
              readOnly={isReadOnly}
              className={`text-xl font-bold text-gray-900 bg-transparent border-b ${
                isReadOnly ? 'border-transparent' : 'border-transparent focus:border-gray-300'
              } focus:outline-none`}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Online users */}
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((user) => (
                <div 
                  key={user.id} 
                  className="relative flex items-center justify-center w-8 h-8 text-sm text-white bg-blue-500 rounded-full"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img 
                      src={`http://localhost:5000/uploads/avatars/${user.avatar}`} 
                      alt={user.name} 
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <span>{user.name.charAt(0)}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="flex items-center justify-center w-8 h-8 text-xs text-gray-700 bg-gray-200 rounded-full">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowSharingModal(true)}
              className="flex items-center px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            
            <button 
              onClick={handleSave}
              className="flex items-center px-4 py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700"
              disabled={isSaving || isReadOnly}
            >
              {isSaving ? (
                <>
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {isReadOnly && (
          <div className="p-4 mb-4 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have view-only access to this document
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={handleContentChange}
            readOnly={isReadOnly}
            modules={{
              toolbar: isReadOnly ? false : [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            }}
            className="h-[70vh]"
          />
        </div>
      </main>
      
      {showSharingModal && (
        <SharingModal 
          documentId={documentId} 
          onClose={() => setShowSharingModal(false)} 
          isOwner={isOwner} // Pass isOwner to the modal
        />
      )}
    </div>
  );
}



