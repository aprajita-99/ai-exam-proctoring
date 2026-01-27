import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Button, Input } from "../../components/UI";
import api from "../../services/api";
import { toast } from "react-toastify";
import { Copy, CheckCircle, Globe } from "lucide-react";

const TestRegistration = () => {
  const { id } = useParams(); // Should match route path /register/:id
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle, loading, success
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.name || !formData.email) {
        toast.error("Please fill all fields");
        return;
    }

    setStatus("loading");
    try {
      // Use the public route we created
      const res = await api.post(`/tests/register/${id}`, formData);
      setResult(res.data);
      setStatus("success");
      toast.success("Registered successfully!");
    } catch (err) {
      setStatus("idle");
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  if (status === "success" && result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-green-500/30 bg-green-500/5 animate-in zoom-in-95 duration-300">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
            <CheckCircle size={32} />
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-white">Registration Complete</h1>
            <p className="text-slate-400 mt-2">
              You are set for <strong>{result.testTitle}</strong>
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-left space-y-4 shadow-xl">
            <div>
              <label className="text-xs uppercase font-bold text-slate-500">Registered Email</label>
              <p className="font-mono text-white text-lg">{result.email}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <label className="text-xs uppercase font-bold text-blue-400 mb-1 block">Your Exam Passcode</label>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-700">
                <p className="font-mono text-3xl font-black text-white tracking-widest">
                  {result.passcode}
                </p>
                <Button 
                   size="sm" 
                   variant="secondary" 
                   onClick={() => {
                     navigator.clipboard.writeText(result.passcode);
                     toast.success("Copied to clipboard!");
                   }}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                *Save this passcode securely. You cannot recover it later.
              </p>
            </div>
          </div>

          <Link to="/">
            <Button fullWidth size="lg">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 border-slate-800">
        <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe size={24} />
            </div>
          <h1 className="text-2xl font-black text-white">Candidate Registration</h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your details to generate your unique access passcode for the exam.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="John Doe"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@university.edu"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Button 
            fullWidth 
            size="lg" 
            type="submit" 
            disabled={status === "loading"}
            className="mt-4"
          >
            {status === "loading" ? "Generating Passcode..." : "Register & Get Passcode"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-white transition">
                Already have a passcode? Login here
            </Link>
        </div>
      </Card>
    </div>
  );
};

export default TestRegistration;