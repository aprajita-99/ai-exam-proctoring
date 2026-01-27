import { useEffect, useRef } from "react";
import { Card, Badge } from "../../../components/UI";
import useCandidateStream from "../../../hooks/useCandidateStream"; // Import the hook

const LiveCandidateCard = ({ candidate, onClick }) => {
  const videoRef = useRef(null);
  
  // ✅ The Card now initiates the connection itself
  const stream = useCandidateStream(candidate.attemptId);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const severity =
    candidate.integrityScore < 60
      ? "danger"
      : candidate.integrityScore < 80
      ? "warning"
      : "success";

  return (
    <Card
      className="p-4 cursor-pointer hover:border-blue-500 transition group"
      onClick={onClick}
    >
      {/* VIDEO */}
      <div className="relative mb-3 rounded-lg overflow-hidden bg-black h-40">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-2" />
            <span className="text-xs">Connecting...</span>
          </div>
        )}

        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
          LIVE
        </span>
      </div>

      {/* INFO */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-sm truncate w-32">{candidate.candidateName}</p>
          <p className="text-xs text-slate-400 truncate w-32">
            {candidate.candidateEmail}
          </p>
        </div>
        <Badge risk={severity}>{candidate.integrityScore}%</Badge>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
        <span>Violations: <span className="text-slate-200">{candidate.violationCount}</span></span>
        <span className="group-hover:text-blue-400 transition-colors">View Details →</span>
      </div>
    </Card>
  );
};

export default LiveCandidateCard;
