import { useState } from "react";
import { Button, Card } from "../../../components/UI";
import socket from "../../../services/socket";
import { toast } from "react-toastify";
import { AlertTriangle, XCircle, CheckCircle, ShieldAlert } from "lucide-react";

const AdminActions = ({ attemptId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State to control the modal
  const [actionType, setActionType] = useState(null); // 'warn' | 'terminate' | null
  const [inputValue, setInputValue] = useState("");

  const openAction = (type) => {
    setActionType(type);
    if (type === "warn") {
      setInputValue("Please focus on your screen. Continued violation will lead to termination.");
    } else {
      setInputValue("Multiple malpractice violations detected.");
    }
  };

  const closeAction = () => {
    setActionType(null);
    setInputValue("");
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a reason.");
      return;
    }

    if (actionType === "warn") {
      socket.emit("admin:warn", { attemptId, message: inputValue });
      toast.success("Warning sent to candidate");
    } 
    else if (actionType === "terminate") {
      setIsProcessing(true);
      socket.emit("admin:terminate", { attemptId, reason: inputValue });
      
      // Disable button briefly to prevent double clicks
      setTimeout(() => {
        setIsProcessing(false);
        toast.info("Termination command sent");
      }, 1000);
    }

    closeAction();
  };

  return (
    <>
      <Card className="p-6 space-y-3 border-red-900/30 bg-red-500/5">
        <h3 className="font-bold text-red-400 flex items-center gap-2">
          <ShieldAlert size={20} />
          Enforcement Actions
        </h3>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => openAction("warn")}
            className="border-amber-500 text-amber-500 hover:bg-amber-500/10 flex-1"
          >
            ⚠️ Warn Candidate
          </Button>
          <Button 
            variant="danger" 
            onClick={() => openAction("terminate")}
            disabled={isProcessing}
            className="flex-1"
          >
            ⛔ Terminate Attempt
          </Button>
        </div>
      </Card>

      {/* MODAL OVERLAY */}
      {actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className={`p-4 border-b ${
              actionType === "terminate" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${
                actionType === "terminate" ? "text-red-400" : "text-amber-400"
              }`}>
                {actionType === "terminate" ? (
                  <><XCircle size={20} /> Terminate Exam Session</>
                ) : (
                  <><AlertTriangle size={20} /> Send Warning</>
                )}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm">
                {actionType === "terminate" 
                  ? "This action is irreversible. The candidate's exam will be submitted immediately with a status of 'Terminated'."
                  : "This message will be displayed as a high-priority toast notification on the candidate's screen."
                }
              </p>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  {actionType === "terminate" ? "Reason for Termination" : "Warning Message"}
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500 min-h-[100px]"
                  placeholder="Enter message..."
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeAction}>
                Cancel
              </Button>
              <Button 
                variant={actionType === "terminate" ? "danger" : "primary"}
                onClick={handleSubmit}
                className="flex items-center gap-2"
              >
                {actionType === "terminate" ? "Confirm Termination" : "Send Warning"}
                <CheckCircle size={16} />
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AdminActions;
