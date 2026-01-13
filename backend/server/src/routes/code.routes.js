import express from "express";
import TestAttempt from "../models/TestAttempt.js";
import Question from "../models/Question.js";
import { runCpp } from "../services/codeRunner/runCpp.js";
import { evaluateCppCode } from "../services/codeRunner/evaluateCpp.js";
import { runPython } from "../services/codeRunner/runPython.js";
import { evaluatePythonCode } from "../services/codeRunner/evaluatePython.js";
import { runJava } from "../services/codeRunner/runJava.js";
import { evaluateJavaCode } from "../services/codeRunner/evaluateJava.js";

const router = express.Router();

router.post("/run", async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(400).json({ message: "Invalid coding question" });
    }
    const sampleTestCases = question.coding.sampleTestCases || [];
    const results = [];

    const executeRun = async (lang, c, inp, time) => {
      switch (lang) {
        case "cpp":
          return runCpp({ code: c, input: inp, timeLimitMs: time });
        case "python":
          return runPython({ code: c, input: inp, timeLimitMs: time });
        case "java":
          return runJava({ code: c, input: inp, timeLimitMs: time });
        default:
          throw new Error("Unsupported language");
      }
    };

    for (let i = 0; i < sampleTestCases.length; i++) {
      const { input, output } = sampleTestCases[i];

      const runResult = await executeRun(
        language,
        code,
        input,
        question.coding.timeLimitMs
      );

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

router.post("/submit", async (req, res) => {
  try {
    const { attemptId, questionId, code, language } = req.body;

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt || attempt.status !== "in_progress") {
      return res.status(400).json({ message: "Invalid attempt" });
    }

    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(400).json({ message: "Invalid coding question" });
    }

    const executeEval = async (lang, c, tests, time) => {
      switch (lang) {
        case "cpp":
          return evaluateCppCode({
            code: c,
            hiddenTestCases: tests,
            timeLimitMs: time,
          });
        case "python":
          return evaluatePythonCode({
            code: c,
            hiddenTestCases: tests,
            timeLimitMs: time,
          });
        case "java":
          return evaluateJavaCode({
            code: c,
            hiddenTestCases: tests,
            timeLimitMs: time,
          });
        default:
          throw new Error("Unsupported language");
      }
    };

    let result;
    if (
      !question.coding.hiddenTestCases ||
      question.coding.hiddenTestCases.length === 0
    ) {
      result = {
        verdict: "Accepted",
        passed: 0,
        total: 0,
        executionTimeMs: 0,
      };
    } else {
      result = await executeEval(
        language,
        code,
        question.coding.hiddenTestCases,
        question.coding.timeLimitMs
      );
    }

    let answer = attempt.answers.find(
      (a) => a.question.toString() === questionId
    );

    if (!answer) {
      answer = {
        question: questionId,
        codingAnswer: {},
      };
      attempt.answers.push(answer);
    }

    answer.codingAnswer = {
      code,
      language,
      verdict: result.verdict,
      passedTestCases: result.passed ?? 0,
      totalTestCases: result.total ?? question.coding.hiddenTestCases.length,
      executionTimeMs: result.executionTimeMs ?? 0,
      errorMessage: result.error ?? null,
    };

    await attempt.save();

    res.json({
      verdict: answer.codingAnswer.verdict,
      passedTestCases: answer.codingAnswer.passedTestCases,
      totalTestCases: answer.codingAnswer.totalTestCases,
      executionTimeMs: answer.codingAnswer.executionTimeMs,
      errorMessage: answer.codingAnswer.errorMessage,
    });
  } catch (err) {
    console.error("Code submit error:", err);
    res.status(500).json({ message: "Code evaluation failed" });
  }
});

export default router;
