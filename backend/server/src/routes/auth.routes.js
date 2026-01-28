import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import validateEmail from "../utils/validateEmail.js";
import {
  sendAdminWelcomeEmail,
  sendCandidateWelcomeEmail,
  sendOTPEmail,
} from "../utils/sendEmail.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res
        .status(400)
        .json({ message: "All fields including OTP are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Verify OTP
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "admin") {
        return res
          .status(409)
          .json({ message: "User already registered as admin" });
      }

      return res.status(409).json({
        message:
          "This email is already registered as a candidate. Please use a different email to register as admin.",
      });
    }

    const admin = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: "admin",
      authProvider: "local",
      emailVerified: true,
    });

    // Cleanup OTP
    await Otp.deleteOne({ email });

    sendAdminWelcomeEmail(email, name).catch(console.error);

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ===============================
   ADMIN LOGIN
=============================== */
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin || admin.authProvider !== "local") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===============================
   SEND OTP (ADMIN)
=============================== */
router.post("/send-otp-admin", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    await Otp.findOneAndUpdate(
      { email },
      { otp, email },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ===============================
   SEND OTP (CANDIDATE)
=============================== */
router.post("/send-otp-candidate", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    await Otp.findOneAndUpdate(
      { email },
      { otp, email },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send error:", err);
    res.status(500).json({ message: "Failed to send OTP" }); // Don't expose internal errors in production, but generic message is fine
  }
});

router.post("/candidate/register", async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res
        .status(400)
        .json({ message: "All fields including OTP are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Verify OTP
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "candidate") {
        return res
          .status(409)
          .json({ message: "User already registered as candidate" });
      }

      return res.status(409).json({
        message:
          "This email is already registered as an admin. Please use a different email to register as candidate.",
      });
    }

    const candidate = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: "candidate",
      authProvider: "local",
      emailVerified: true,
    });

    // Cleanup OTP
    await Otp.deleteOne({ email });

    sendCandidateWelcomeEmail(email, name).catch(console.error);

    const token = jwt.sign(
      { id: candidate._id, role: candidate.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Candidate registered successfully",
      token,
      user: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
      },
    });
  } catch (err) {
    console.error("Candidate register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ===============================
   CANDIDATE LOGIN
=============================== */
router.post("/candidate/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const candidate = await User.findOne({ email, role: "candidate" });
    if (!candidate || candidate.authProvider !== "local") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: candidate._id, role: candidate.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        idCardImage: candidate.idCardImage,
      },
    });
  } catch (err) {
    console.error("Candidate login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===============================
   ID CARD UPLOAD
=============================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/id_cards/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
});

router.post(
  "/upload-id-card",
  authenticate,
  upload.single("idCard"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "id_cards",
      });

      // Delete local file
      fs.unlinkSync(req.file.path);

      const userId = req.user.id;
      const idCardUrl = result.secure_url;

      // Update with { new: true } to return the updated doc, though not strictly needed here
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { idCardImage: idCardUrl },
        { new: true },
      );

      res.status(200).json({
        message: "ID Card uploaded successfully",
        filePath: idCardUrl,
        user: updatedUser,
      });
    } catch (err) {
      console.error("ID Card upload error:", err);
      // Try to delete file if it exists and upload failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Upload failed: " + err.message });
    }
  },
);

/* ===============================
   GET CURRENT USER (PROFILE)
=============================== */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      idCardImage: user.idCardImage,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

export default router;
