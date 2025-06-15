const router = require('express').Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const express = require('express');
const User = require('../models/User');
const mongoose = require('mongoose'); // Add this import

// Create document
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title) return res.status(400).json({ msg: 'Title is required' });

    const document = new Document({
      title,
      content,
      owner: req.user.id,
      collaborators: [{ user: req.user.id, role: 'editor' }],
    });

    await document.save();
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's documents
router.get('/my-docs', auth, async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    }).populate('owner', 'name email avatar');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });

    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this document' });
    }

    await document.deleteOne();
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});







// PUT /api/documents/:id  – edit & auto‑save
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    // Find the document first
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    // ✅ Permission check
    const isOwner      = doc.owner.toString() === userId;
    const isEditorColl = doc.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );
    if (!isOwner && !isEditorColl)
      return res.status(403).json({ msg: 'No edit permission' });

    // Do the updates
    if (title !== undefined)   doc.title   = title;
    if (content !== undefined) doc.content = content;

    await doc.save();
    res.json({ msg: 'Saved', updatedAt: doc.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'Save failed' });
  }
});


// IMPORTANT: Define /shared BEFORE /:id
router.get('/shared', auth, async (req, res) => {
  try {
    console.log(`Fetching shared documents for user: ${req.user.id}`);
    
    const documents = await Document.find({
      'collaborators.user': req.user.id
    })
    .populate('owner', 'name email avatar')
    .lean();

    console.log(`Found ${documents.length} documents`);
    
    const sharedDocuments = documents.map(doc => {
      const collaboration = doc.collaborators.find(collab => {
        return collab.user.toString() === req.user.id.toString();
      });
      
      if (!collaboration) return null;
      
      return {
        _id: doc._id,
        title: doc.title,
        content: doc.content,
        createdAt: doc.createdat,
        updatedAt: doc.updatedat,
        owner: doc.owner || {
          name: 'Unknown Owner',
          email: '',
          avatar: ''
        },
        userRole: collaboration.role
      };
    }).filter(doc => doc !== null);

    res.json(sharedDocuments);
  } catch (err) {
    console.error('Error in /shared endpoint:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message
    });
  }
});

// Define the single document route AFTER /shared
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`Fetching document: ${req.params.id}`);
    console.log(`Authenticated user: ${req.user.id}`);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid ID format');
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!document) {
      console.error('Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access permissions
    const hasAccess = document.owner._id.equals(req.user.id) ||
      document.collaborators.some(collab => 
        collab.user._id.equals(req.user.id)
      );

    if (!hasAccess) {
      console.error('Access denied for user:', req.user.id);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine user role
    let userRole = 'viewer';
    if (document.owner._id.equals(req.user.id)) {
      userRole = 'owner';
    } else {
      const collaboration = document.collaborators.find(collab => 
        collab.user._id.equals(req.user.id)
      );
      userRole = collaboration ? collaboration.role : 'viewer';
    }

    console.log(`Document access granted. User role: ${userRole}`);
    
    res.json({
      ...document.toObject(),
      userRole
    });
  } catch (err) {
    console.error('Document fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share document with a user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    
    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the owner can share this document' });
    }
    
    const { email, role } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Check if already shared
    const isAlreadyShared = document.collaborators.some(
      collab => collab.user.toString() === user._id.toString()
    );
    
    if (isAlreadyShared) {
      return res.status(400).json({ msg: 'Document already shared with this user' });
    }
    
    // Add collaborator
    document.collaborators.push({ user: user._id, role });
    await document.save();
    
    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update collaborator role
router.put('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    
    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the owner can modify permissions' });
    }
    
    const { role } = req.body;
    const collaborator = document.collaborators.find(
      collab => collab.user.toString() === req.params.userId
    );
    
    if (!collaborator) return res.status(404).json({ msg: 'Collaborator not found' });
    
    collaborator.role = role;
    await document.save();
    
    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Remove collaborator
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    
    // Check if user is owner
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the owner can remove collaborators' });
    }
    
    document.collaborators = document.collaborators.filter(
      collab => collab.user.toString() !== req.params.userId
    );
    
    await document.save();
    
    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get collaborators for a document
router.get('/:id/collaborators', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('collaborators.user', 'name email avatar');
    
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    
    // Check if user has access
    const hasAccess = document.owner.toString() === req.user.id || 
      document.collaborators.some(collab => collab.user._id.toString() === req.user.id);
    
    if (!hasAccess) return res.status(403).json({ msg: 'Access denied' });
    
    res.json(document.collaborators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;