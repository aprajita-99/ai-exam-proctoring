import { useEffect } from "react";
import { reportViolation } from "../services/violations";

const useProctoring = (attemptId, testId) => {
  useEffect(() => {
    if (!attemptId || !testId) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportViolation(attemptId, testId, "fullscreen_exit");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        reportViolation(attemptId, testId, "tab_switch");
      }
    };

    const onBlur = () => {
      reportViolation(attemptId, testId, "window_blur");
    };

    const onCopy = (e) => {
      e.preventDefault();
      reportViolation(attemptId, testId, "copy_attempt");
    };

    const onPaste = (e) => {
      e.preventDefault();
      reportViolation(attemptId, testId, "paste_attempt");
    };

    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      
      const end = performance.now();
      if (end - start > 100) {
        reportViolation(attemptId, testId, "devtools_detected");
      }
    }, 2000);

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [attemptId, testId]);
};

export default useProctoring;
