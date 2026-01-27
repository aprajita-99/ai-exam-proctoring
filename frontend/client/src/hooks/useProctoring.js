import { useEffect, useRef } from "react";
import { reportViolation } from "../services/violations";
import { captureSnapshot } from "../utils/camera";
import { verifyFace } from "../services/candidateApi";
import { toast } from "react-toastify";

// 🔴 CONFIGURATION
const MAX_VIOLATIONS_ALLOWED = 3; // Auto-terminate after 5 strikes

const useProctoring = (
  attemptId,
  testId,
  videoRef,
  isSubmitted,
  setFullscreenStatus, // New Callback: To lock/unlock UI
  onAutoTerminate    // New Callback: To kill exam
) => {
  const violationCountRef = useRef(0);

  useEffect(() => {
    if (!attemptId || !testId || isSubmitted) return;

    const handleViolation = (type) => {
      // 1. Increment Count
      violationCountRef.current += 1;
      const currentCount = violationCountRef.current;

      console.log(`Violation: ${type} | Count: ${currentCount}`);

      // 2. Report to Backend (Always do this)
      const image = videoRef?.current ? captureSnapshot(videoRef.current) : null;
      reportViolation(attemptId, testId, type, image);

      // 3. AUTO-TERMINATION CHECK
      if (currentCount > MAX_VIOLATIONS_ALLOWED) {
        onAutoTerminate(`System detected ${currentCount} violations. Limit exceeded.`);
        return; // Stop processing further warnings
      }

      let warningMsg = "";
      let shouldToast = true;

      switch (type) {
        case "tab_switch":
          warningMsg = `Tab switching detected! (${currentCount}/${MAX_VIOLATIONS_ALLOWED})`;
          break;
        case "fullscreen_exit":
          warningMsg = `Fullscreen exited! Return immediately. (${currentCount}/${MAX_VIOLATIONS_ALLOWED})`;
          break;
        case "window_blur":
          shouldToast = false; 
          break;
        case "copy_attempt":
        case "paste_attempt":
          warningMsg = "Copy/Paste is disabled.";
          break;
        case "devtools_detected":
          warningMsg = "Developer tools detected! Severe violation.";
          break;
        case "face_mismatch":
          warningMsg = "Face verification failed! Please look at the screen.";
          break;
        default:
          warningMsg = "Proctoring violation detected!";
      }

      if (shouldToast) {
        toast.warning(warningMsg, {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      }
    };


    const onFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setFullscreenStatus(isFull);

      if (!isFull) {
        handleViolation("fullscreen_exit");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch");
      }
    };

    const onBlur = () => {
      handleViolation("window_blur");
    };

    const onCopy = (e) => {
      e.preventDefault();
      handleViolation("copy_attempt");
    };

    const onPaste = (e) => {
      e.preventDefault();
      handleViolation("paste_attempt");
    };

    const devToolsInterval = setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        handleViolation("devtools_detected");
      }
    }, 2000);

    const faceCheckInterval = setInterval(async () => {
      if (videoRef.current) {
        const image = captureSnapshot(videoRef.current);
        if (image) {
          try {
            const res = await verifyFace(attemptId, image);
            if (res.data && res.data.match === false) {
              handleViolation("face_mismatch");
            }
          } catch (err) {
            console.error("Face check error", err);
          }
        }
      }
    }, 15000);

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);

    return () => {
      clearInterval(devToolsInterval);
      clearInterval(faceCheckInterval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [attemptId, testId, isSubmitted, videoRef, setFullscreenStatus, onAutoTerminate]);
};

export default useProctoring;