import express from "express";
import Question from "../models/Question.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * ===============================
 * CREATE QUESTION (Admin only)
 * ===============================
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { type, mcq, descriptive, coding } = req.body;

      /* ---------- Type-based validation ---------- */
      if (type === "mcq") {
        if (!mcq || !Array.isArray(mcq.options) || mcq.correctAnswer === undefined) {
          return res.status(400).json({
            message: "Invalid MCQ question format",
          });
        }
      }

      if (type === "descriptive") {
        if (!descriptive) {
          return res.status(400).json({
            message: "Descriptive question data missing",
          });
        }
      }

      if (type === "coding") {
        if (
          !coding ||
          !coding.problemStatement ||
          !Array.isArray(coding.hiddenTestCases) ||
          coding.hiddenTestCases.length === 0
        ) {
          return res.status(400).json({
            message:
              "Coding question must include problem statement and hidden test cases",
          });
        }
      }

      const question = await Question.create({
        ...req.body,
        createdBy: req.user.id,
      });

      res.status(201).json(question);
    } catch (err) {
      console.error("Create question error:", err);
      res.status(400).json({ message: "Failed to create question" });
    }
  }
);

/**
 * ===============================
 * GET ADMIN QUESTION BANK
 * ===============================
 */

router.get(
  "/:id",
   authenticate,
    authorize("admin"),
     async (req, res) => {
      try{
  const q = await Question.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });
  if (!q) return res.status(404).json({ message: "Question not found" });
  res.json(q);
}catch(err){
  console.error("Single question fetch error:", err);
  res.status(500).json({ message: "Failed to fetch question" });
}
});

router.get(
  "/",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const questions = await Question.find({
        createdBy: req.user.id,
      });

      res.json(questions);
    } catch (err) {
      console.error("Fetch questions error:", err);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  }
);

/**
 * ===============================
 * UPDATE QUESTION (Admin only)
 * ===============================
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const question = await Question.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
      });

      if (!question) {
        return res.status(404).json({
          message: "Question not found or access denied",
        });
      }

      const { type, mcq, descriptive, coding } = req.body;

      /* ---------- Type-based validation ---------- */
      if (type === "mcq") {
        if (!mcq || !Array.isArray(mcq.options) || mcq.correctAnswer === undefined) {
          return res.status(400).json({ message: "Invalid MCQ format" });
        }
      }

      if (type === "descriptive") {
        if (!descriptive) {
          return res.status(400).json({ message: "Descriptive data missing" });
        }
      }

      if (type === "coding") {
        if (
          !coding ||
          !coding.problemStatement ||
          !Array.isArray(coding.hiddenTestCases) ||
          coding.hiddenTestCases.length === 0
        ) {
          return res.status(400).json({
            message: "Coding question must include hidden test cases",
          });
        }
      }

      Object.assign(question, req.body);
      await question.save();

      res.json(question);
    } catch (err) {
      console.error("Update question error:", err);
      res.status(500).json({ message: "Failed to update question" });
    }
  }
);

/**
 * ===============================
 * DELETE QUESTION (Admin only)
 * ===============================
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const question = await Question.findOne({
        _id: req.params.id,
        createdBy: req.user.id,
      });

      if (!question) {
        return res.status(404).json({
          message: "Question not found or access denied",
        });
      }

      // ⚠️ Future safeguard:
      // Check if question is used in any test before deleting

      await question.deleteOne();

      res.json({ message: "Question deleted successfully" });
    } catch (err) {
      console.error("Delete question error:", err);
      res.status(500).json({ message: "Failed to delete question" });
    }
  }
);


export default router;

