import express from "express";
import TestAttempt from "../models/TestAttempt.js";
import Question from "../models/Question.js";
import { runCpp } from "../services/codeRunner/runCpp.js";
import { evaluateCppCode } from "../services/codeRunner/evaluateCpp.js";

const router = express.Router();

/* ======================================================
   RUN CODE (Visible / Sample Test Cases ONLY)
   - Used by "Run Code" button
   - Does NOT store anything in DB
   - Does NOT affect attempt state
====================================================== */
router.post("/run", async (req, res) => {
  try {
    const { questionId, code, language } = req.body;

    /* ---------- Validate question ---------- */
    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(400).json({ message: "Invalid coding question" });
    }

    if (language !== "cpp") {
      return res.status(400).json({ message: "Only C++ supported for now" });
    }

    const sampleTestCases = question.coding.sampleTestCases || [];

    const results = [];

    for (let i = 0; i < sampleTestCases.length; i++) {
      const { input, output } = sampleTestCases[i];

      const runResult = await runCpp({
        code,
        input,
        timeLimitMs: question.coding.timeLimitMs,
      });

      const actual = (runResult.output || "").trim();
      const expected = (output || "").trim();

      results.push({
        testCase: i + 1,
        input,
        expectedOutput: expected,
        actualOutput: actual,
        passed: actual === expected,
      });
    }

    res.json({
      results,
    });
  } catch (err) {
    console.error("Run code error:", err);
    res.status(500).json({ message: "Failed to run code" });
  }
});

/* ======================================================
   SUBMIT CODE (Final Evaluation)
   - Uses HIDDEN test cases
   - Stores verdict in TestAttempt
   - Affects grading
====================================================== */
router.post("/submit", async (req, res) => {
  try {
    const { attemptId, questionId, code, language } = req.body;

    /* ---------- Validate attempt ---------- */
    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt || attempt.status !== "in_progress") {
      return res.status(400).json({ message: "Invalid attempt" });
    }

    /* ---------- Validate question ---------- */
    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(400).json({ message: "Invalid coding question" });
    }

    if (language !== "cpp") {
      return res.status(400).json({ message: "Only C++ supported for now" });
    }

    /* ---------- Evaluate against hidden test cases ---------- */
    const result = await evaluateCppCode({
      code,
      hiddenTestCases: question.coding.hiddenTestCases,
      timeLimitMs: question.coding.timeLimitMs,
    });

    /* ---------- Store / update answer ---------- */
    let answer = attempt.answers.find(
      (a) => a.question.toString() === questionId
    );

    if (!answer) {
      answer = { question: questionId };
      attempt.answers.push(answer);
    }

    answer.codingAnswer = {
      code,
      language,
      verdict: result.verdict,
      passedTestCases: result.passed,
      totalTestCases: result.total,
      executionTimeMs: result.executionTimeMs,
    };

    await attempt.save();

    /* ---------- Respond ---------- */
    res.json(answer.codingAnswer);
  } catch (err) {
    console.error("Code submit error:", err);
    res.status(500).json({ message: "Code evaluation failed" });
  }
});

export default router;


