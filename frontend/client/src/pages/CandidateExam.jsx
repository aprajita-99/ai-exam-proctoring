import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Badge } from "../components/UI";
import { useExam } from "../context/ExamContext";
import useProctoring from "../hooks/useProctoring";
import useFaceDetection from "../hooks/useFaceDetection.jsx";
import candidateApi from "../services/candidateApi.js";
import socket from "../services/socket";
import Editor from "@monaco-editor/react";
import { toast } from "react-toastify";
import { exitFullscreen } from "../utils/fullscreen";
import { Maximize, AlertTriangle } from "lucide-react";

const DEFAULT_BOILERPLATES = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  python: `import sys\n\ndef solve():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`,
};

const CandidateExam = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { examState, setExamState } = useExam();
  
  // Exam Data
  const test = examState.test;
  const questions = test?.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentQuestion = questions[currentIdx];

  // UI/Logic State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [runOutput, setRunOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Status State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Refs
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const autoSaveFailedRef = useRef(false);
  const pcRef = useRef(null);

  /* ================= SAFETY GUARD ================= */
  useEffect(() => {
    if (!attemptId || !test) {
      toast.error("Invalid exam session. Please rejoin.");
      navigate("/");
    }
  }, [attemptId, test, navigate]);

  /* ================= CENTRALIZED TERMINATION ================= */
  const terminateExamSession = useCallback(async (reason) => {
    if (isTerminated) return; // Prevent double termination

    setIsTerminated(true);
    setTerminationReason(reason);

    // Stop Camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try { await exitFullscreen(); } catch (e) {}

    localStorage.removeItem("examState");
    setExamState((prev) => ({ ...prev, status: "terminated" }));
    socket.emit("candidate:self_terminate", { attemptId, reason });
  }, [attemptId, setExamState, isTerminated]);

  /* ================= AUTO SAVE ================= */
  useEffect(() => {
    if (!attemptId || examState.status !== "in_progress" || autoSaveFailedRef.current) return;

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      candidateApi.post(`/attempts/save/${attemptId}`, {
        answers: Object.entries(answers).map(([q, a]) => ({ question: q, ...a })),
      }).catch((err) => {
        const msg = err.response?.data?.message;
        if (msg === "Invalid attempt" || msg === "Test is not in progress") {
          autoSaveFailedRef.current = true;
        }
      });
    }, 2000);

    return () => clearTimeout(autoSaveTimeoutRef.current);
  }, [answers, attemptId, examState.status]);

  /* ================= PROCTORING & FACE DETECTION ================= */
  useProctoring(attemptId, test?.testId, videoRef, isSubmitted, setIsFullscreen, terminateExamSession);
  useFaceDetection(videoRef, attemptId, test?.testId, examState?.referenceImage);

  /* ================= SOCKET & WEBRTC SETUP (CONSOLIDATED) ================= */
  useEffect(() => {
    if (!attemptId || !test) return;

    console.log("Initializing Socket & WebRTC...");

    // 1. Join Room
    socket.emit("candidate:join", { attemptId, testId: test.testId });

    // 2. Setup WebRTC
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("webrtc:ice", { attemptId, candidate: event.candidate });
    };

    const createAndSendOffer = async () => {
      if (!pcRef.current) return;
      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("webrtc:offer", { attemptId, offer });
      } catch (e) { console.error("WebRTC Error:", e); }
    };

    // 3. Get Media
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        createAndSendOffer();
      } catch (err) {
        toast.error("Camera access failed. Please allow permissions.");
      }
    };
    startCamera();

    // 4. Socket Listeners
    const handleAnswer = async (answer) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(answer);
    };

    const handleIce = async (candidate) => {
      if (pcRef.current) {
        try { await pcRef.current.addIceCandidate(candidate); } catch (e) {}
      }
    };

    const handleAdminReady = () => createAndSendOffer();

    const handleWarn = ({ message }) => {
      new Audio("/assets/sounds/warning.mp3").play().catch(() => {});
      toast.warn(message, { autoClose: 8000, theme: "colored" });
    };

    const handleRemoteTermination = ({ reason }) => {
      terminateExamSession(reason || "Terminated by Proctor");
    };

    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice", handleIce);
    socket.on("admin:ready", handleAdminReady);
    socket.on("candidate:warn", handleWarn);
    socket.on("candidate:terminated", handleRemoteTermination);

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
      
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice", handleIce);
      socket.off("admin:ready", handleAdminReady);
      socket.off("candidate:warn", handleWarn);
      socket.off("candidate:terminated", handleRemoteTermination);
    };
  }, [attemptId, test, terminateExamSession]);

  /* ================= INITIAL FULLSCREEN CHECK ================= */
  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  /* ================= TIMER LOGIC ================= */
  useEffect(() => {
    if (!test || !examState.startedAt) return;
    const end = new Date(examState.startedAt).getTime() + (test.duration * 60 * 1000);
    setTimeLeft(Math.floor((end - Date.now()) / 1000));
  }, [test, examState.startedAt]);

  useEffect(() => {
    if (timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  /* ================= LOGIC: CODE EXECUTION ================= */
  const runCode = async () => {
    try {
      setIsRunning(true);
      setRunOutput("");
      const res = await candidateApi.post("/code/run", {
        questionId: currentQuestion._id,
        code,
        language,
      });
      const formatted = res.data.results.map(r => 
        `Testcase ${r.testCase}: ${r.passed ? "✅ Passed" : "❌ Failed"}\nExpected: ${r.expectedOutput}\nActual: ${r.actualOutput}\n`
      ).join("\n");
      setRunOutput(formatted);
    } catch (err) {
      setRunOutput(err.response?.data?.message || "Execution error");
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    try {
      setIsSubmittingCode(true);
      const res = await candidateApi.post("/code/submit", {
        attemptId,
        questionId: currentQuestion._id,
        code,
        language,
      });
      const result = res.data;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion._id]: {
          ...prev[currentQuestion._id],
          codingAnswer: {
            code, language, verdict: result.verdict,
            passedTestCases: result.passedTestCases,
            totalTestCases: result.totalTestCases,
            executionTimeMs: result.executionTimeMs,
          },
        },
      }));
      toast.success(result.verdict === "Accepted" ? "All Passed!" : `Result: ${result.verdict}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  /* ================= LOGIC: ANSWER HANDLING ================= */
  const handleAnswerChange = (value) => {
    const q = questions[currentIdx];
    setAnswers((prev) => ({
      ...prev,
      [q._id]: {
        ...prev[q._id],
        ...(q.type === "mcq" && { mcqAnswer: value }),
        ...(q.type === "descriptive" && { descriptiveAnswer: value }),
        ...(q.type === "coding" && {
          codingAnswer: { ...(prev[q._id]?.codingAnswer || {}), code: value, language },
        }),
      },
    }));
  };

  const handleSubmit = async (auto = false) => {
    setIsSubmitted(true);
    try {
      await candidateApi.post(`/attempts/submit/${attemptId}`, {
        answers: Object.entries(answers).map(([q, a]) => ({ question: q, answer: a })),
      });
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      await exitFullscreen();
      socket.emit("candidate:submit", { attemptId, testId: test.testId });
      localStorage.removeItem("examState");
      setExamState((prev) => ({ ...prev, status: "submitted" }));
      toast.success(auto ? "Time up. Submitted." : "Exam submitted.");
      navigate("/thank-you");
    } catch (err) {
      setIsSubmitted(false);
      toast.error("Failed to submit exam");
    }
  };

  /* ================= EFFECT: SYNC EDITOR WITH QUESTIONS ================= */
  useEffect(() => {
    if (currentQuestion?.type !== "coding") return;
    const saved = answers[currentQuestion._id]?.codingAnswer;
    const lang = saved?.language || language;
    const val = saved?.code ?? currentQuestion.coding?.boilerplateCode?.[lang] ?? DEFAULT_BOILERPLATES[lang] ?? "";
    setLanguage(lang);
    setCode(val);
  }, [currentIdx, currentQuestion]);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen()
      .then(() => setIsFullscreen(true))
      .catch(() => toast.error("Fullscreen permission denied"));
  };

  const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  if (!test) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Exam...</div>;

  /* ================= TERMINATED VIEW ================= */
  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-10 max-w-lg w-full shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
             <AlertTriangle className="text-red-500 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white">Exam Terminated</h1>
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
            <p className="text-sm text-red-300 uppercase font-bold mb-1">Reason</p>
            <p className="text-lg text-white">{terminationReason}</p>
          </div>
          <Button className="w-full" onClick={() => navigate("/thank-you")}>Go to Feedback Page</Button>
        </div>
      </div>
    );
  }

  /* ================= MAIN RENDER ================= */
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden relative">
      
      {/* 1. FULLSCREEN OVERLAY */}
      {!isFullscreen && !isSubmitted && !isTerminated && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
          <div className="bg-red-500/10 p-6 rounded-full mb-6 animate-pulse">
            <Maximize size={48} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Fullscreen Required</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Access blocked. You must be in fullscreen mode to continue. Staying in this mode is a violation.
          </p>
          <Button size="lg" onClick={requestFullscreen} className="shadow-lg shadow-red-500/20">
            Return to Exam
          </Button>
        </div>
      )}

      {/* 2. MOBILE BLOCKER */}
      <div className="lg:hidden fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
         <AlertTriangle size={48} className="text-amber-500 mb-4" />
         <h2 className="text-xl font-bold">Desktop Only</h2>
         <p className="text-slate-400 mt-2">This exam requires a desktop environment.</p>
      </div>
      
      {/* 3. TOP BAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Badge risk="active" className="text-[9px] px-2">LIVE</Badge>
          <span className="font-bold">{test.title}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? "text-red-500 animate-pulse" : "text-white"}`}>
            {formatTime(timeLeft || 0)}
          </span>
          <Button variant="danger" size="sm" onClick={() => handleSubmit(false)}>Finish</Button>
        </div>
      </header>

      {/* 4. CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Question Header */}
            <div className="flex justify-between text-xs uppercase text-slate-500 font-black">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="bg-slate-900 px-3 py-1 rounded border border-slate-800">{currentQuestion.type}</span>
            </div>
            <h2 className="text-2xl font-bold">{currentQuestion.questionText}</h2>

            {/* MCQ Render */}
            {currentQuestion.type === "mcq" && currentQuestion.mcq.options.map((opt, i) => (
              <label key={i} className={`flex items-center p-4 border rounded-xl cursor-pointer ${
                answers[currentQuestion._id]?.mcqAnswer === i ? "border-white bg-slate-900" : "border-slate-800"
              }`}>
                <input type="radio" checked={answers[currentQuestion._id]?.mcqAnswer === i} onChange={() => handleAnswerChange(i)} />
                <span className="ml-4">{opt}</span>
              </label>
            ))}

            {/* Descriptive Render */}
            {currentQuestion.type === "descriptive" && (
              <textarea
                className="w-full h-72 bg-slate-900 border border-slate-800 rounded-xl p-5"
                value={answers[currentQuestion._id]?.descriptiveAnswer || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
            )}

            {/* Coding Render */}
            {currentQuestion.type === "coding" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <select
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setLanguage(newLang);
                      const saved = answers[currentQuestion._id]?.codingAnswer;
                      const val = (saved?.language === newLang && saved?.code) 
                        ? saved.code 
                        : currentQuestion.coding?.boilerplateCode?.[newLang] || DEFAULT_BOILERPLATES[newLang] || "";
                      setCode(val);
                      setAnswers((prev) => ({
                         ...prev, 
                         [currentQuestion._id]: { ...prev[currentQuestion._id], codingAnswer: { ...(prev[currentQuestion._id]?.codingAnswer || {}), code: val, language: newLang } } 
                      }));
                    }}
                    className="bg-slate-900 border border-slate-700 px-3 py-2 rounded"
                  >
                    {(test.supportedLanguages?.length ? test.supportedLanguages : ["cpp", "python", "java"]).map((lang) => (
                      <option key={lang} value={lang}>{lang === "cpp" ? "C++" : lang.toUpperCase()}</option>
                    ))}
                  </select>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm" disabled={isRunning} onClick={runCode}>
                      {isRunning ? "Running..." : "Run Code"}
                    </Button>
                    <Button variant="primary" size="sm" disabled={isSubmittingCode} onClick={submitCode}>
                      {isSubmittingCode ? "Submitting..." : "Submit Code"}
                    </Button>
                  </div>
                </div>

                <Editor
                  height="420px"
                  language={language === "cpp" ? "cpp" : language}
                  value={code}
                  theme="vs-dark"
                  onChange={(val) => { setCode(val || ""); handleAnswerChange(val || ""); }}
                  options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
                />

                <div className="bg-black text-green-400 p-4 rounded-xl text-sm font-mono min-h-[120px]">
                  {runOutput || "Output will appear here..."}
                </div>

                {answers[currentQuestion._id]?.codingAnswer && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Verdict</span>
                      <span className={`font-bold ${answers[currentQuestion._id].codingAnswer.verdict === "Accepted" ? "text-green-400" : "text-red-400"}`}>
                        {answers[currentQuestion._id].codingAnswer.verdict}
                      </span>
                    </div>
                    {/* Additional Coding Stats (Time, Test Cases) */}
                    <div className="flex justify-between">
                        <span className="text-slate-400">Hidden Test Cases</span>
                        <span className="font-mono">{answers[currentQuestion._id].codingAnswer.passedTestCases} / {answers[currentQuestion._id].codingAnswer.totalTestCases}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8">
              <Button variant="secondary" disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)}>Previous</Button>
              <Button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(currentIdx + 1)}>Next</Button>
            </div>
          </div>
        </main>

        {/* 5. SIDEBAR */}
        <aside className="hidden lg:flex w-96 border-l border-slate-900 p-6 flex-col gap-6">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase mb-3">Proctor Feed</h3>
            <video ref={videoRef} autoPlay muted playsInline className="rounded-xl opacity-70" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase mb-3">Question Map</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-10 rounded-lg font-bold ${currentIdx === i ? "bg-white text-black" : answers[questions[i]._id] ? "bg-slate-800" : "bg-slate-900 text-slate-500"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CandidateExam;