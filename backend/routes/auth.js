const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const authMiddleware = require('../middleware/auth.js'); // adjust path as needed

// Set storage engine
const storage = multer.diskStorage({
  destination: "./uploads/avatars/",
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter for image only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Images only!");
  }
};

const upload = multer({ storage, fileFilter });

// Update Register route
router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const avatar = req.file ? req.file.filename : "";

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      avatar,
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/update-profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.user.id;  // now will be defined because middleware ran

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (name) user.name = name;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) user.avatar = req.file.filename;

    await user.save();

    res.json({
      msg: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Optional: Token expiry
    });

    // Set cookie + return token in body
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "Lax", // or 'None' if cross-site
        secure: false, // Set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
      .json({
        token, // ✅ Return JWT token
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get logged in user
router.get("/user", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No auth token" });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verified.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ msg: "Logged out" });
});

module.exports = router;
