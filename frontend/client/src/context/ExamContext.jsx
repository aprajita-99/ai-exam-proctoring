import { createContext, useContext, useEffect, useState } from "react";

const ExamContext = createContext(null);

const getInitialExamState = () => {
  try {
    const stored = localStorage.getItem("examState");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const ExamProvider = ({ children }) => {
  const [examState, setExamState] = useState(() => {
    const saved = getInitialExamState();
    return (
      saved || {
        candidate: null,
        test: null,
        attemptId: null,
        status: "idle",
      }
    );
  });

  /* ===============================
     KEEP STORAGE IN SYNC
  =============================== */
  useEffect(() => {
    if (examState?.attemptId) {
      localStorage.setItem("examState", JSON.stringify(examState));
    }
  }, [examState]);

  return (
    <ExamContext.Provider value={{ examState, setExamState }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
