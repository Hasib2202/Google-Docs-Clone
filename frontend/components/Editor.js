import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

export default function Editor({ id }) {
  const [value, setValue] = useState('');
  const timerRef = useRef(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Load document content
  useEffect(() => {
    if (!id) return;
    axios.get(`${backendURL}/api/documents/${id}`, { withCredentials: true })
      .then(res => setValue(res.data.content || ''))
      .catch(err => console.error('Error loading document:', err));
  }, [id, backendURL]);

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!id) return;
    timerRef.current = setInterval(() => {
      axios.put(`${backendURL}/api/documents/${id}`, { content: value }, { withCredentials: true })
        .catch(err => console.error('Auto-save failed:', err));
    }, 3000);

    return () => clearInterval(timerRef.current);
  }, [id, value, backendURL]);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <ReactQuill value={value} onChange={setValue} theme="snow" />
    </div>
  );
}
