import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions } from "../../services/questionApi";
import { createTest } from "../../services/testApi";
import { Button, Card, Input } from "../../../components/UI";
import { toast } from "react-toastify";
import { Globe, Lock } from "lucide-react";

const CreateTest = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    duration: 60,
    activeTill: "",
    supportedLanguages: ["cpp", "python", "java"],
    isPublic: false,
    allowedCandidates: [{ email: "", passcode: "" }],
  });

  useEffect(() => {
    getQuestions()
      .then((res) => setQuestions(res.data))
      .catch(() => toast.error("Failed to load questions"));
  }, []);

  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!form.title || !form.activeTill || selectedQuestions.length === 0) {
      toast.error("Please fill title, date, and select questions");
      return;
    }

    if (form.supportedLanguages.length === 0) {
      toast.error("Please select at least one supported language");
      return;
    }

    // 2. Candidate Validation
    // Filter out completely empty rows
    const validCandidates = form.allowedCandidates.filter(c => c.email && c.passcode);

    // If Private, we REQUIRE at least one candidate
    if (!form.isPublic && validCandidates.length === 0) {
        toast.error("Private tests require at least one allowed candidate.");
        return;
    }

    // Check passcode length for any entered candidate (Public or Private)
    const hasInvalidPasscode = validCandidates.some((c) => c.passcode.length < 4);
    if (hasInvalidPasscode) {
        toast.error("Passcode must be at least 4 characters");
        return;
    }

    setLoading(true);
    try {
      await createTest({
        title: form.title,
        duration: form.duration,
        activeTill: form.activeTill,
        supportedLanguages: form.supportedLanguages,
        questions: selectedQuestions,
        allowedCandidates: validCandidates, // Send filtered list
        isPublic: form.isPublic,
      });

      toast.success("Test created successfully");
      navigate("/admin/tests");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || q.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Card className="p-8 space-y-6">
        <h1 className="text-2xl font-black">Create Test</h1>

        {/* TITLE */}
        <Input
          label="Test Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* SETTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <Input
                    label="Duration (minutes)"
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                 />
                 <Input
                    label="Active Till"
                    type="datetime-local"
                    value={form.activeTill}
                    onChange={(e) => setForm({ ...form, activeTill: e.target.value })}
                    className="datetime-dark"
                 />
            </div>

            {/* PUBLIC TOGGLE CARD */}
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${form.isPublic ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900 border-slate-700'}`}>
                <div className="flex justify-between items-start mb-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        {form.isPublic ? <Globe size={16} className="text-blue-400"/> : <Lock size={16} className="text-slate-400"/>}
                        Access Mode
                    </label>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={form.isPublic} 
                            onChange={(e) => setForm({...form, isPublic: e.target.checked})} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                <h3 className={`font-bold transition-colors ${form.isPublic ? 'text-blue-400' : 'text-white'}`}>
                    {form.isPublic ? "Public Registration" : "Private Invite Only"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    {form.isPublic 
                        ? "A registration link will be generated. You can also add specific candidates below." 
                        : "Only candidates you explicitly add below will be able to access the test."}
                </p>
            </div>
        </div>

        {/* SUPPORTED LANGUAGES */}
        <div>
          <label className="block text-slate-400 text-sm font-bold mb-2">
            Supported Languages
          </label>
          <div className="flex gap-6 bg-slate-900 p-3 rounded border border-slate-700">
            {["cpp", "python", "java"].map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.supportedLanguages.includes(lang)}
                  onChange={(e) => {
                    const { checked } = e.target;
                    setForm((prev) => {
                      const newLangs = checked
                        ? [...prev.supportedLanguages, lang]
                        : prev.supportedLanguages.filter((l) => l !== lang);
                      return { ...prev, supportedLanguages: newLangs };
                    });
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white text-sm font-medium">
                  {lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* QUESTION SELECTION */}
        <div>
          <h3 className="font-bold mb-3">Select Questions</h3>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="descriptive">Descriptive</option>
              <option value="coding">Coding</option>
            </select>
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-800 rounded p-4 space-y-2 custom-scrollbar bg-slate-900/50">
            {filteredQuestions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center">No questions match your search</p>
            ) : (
              filteredQuestions.map((q) => (
                <label key={q._id} className="flex items-start gap-3 text-sm cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q._id)}
                    onChange={(e) => {
                      setSelectedQuestions((prev) =>
                        e.target.checked ? [...prev, q._id] : prev.filter((id) => id !== q._id)
                      );
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white line-clamp-2">{q.questionText}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{q.type.toUpperCase()} • {q.marks} marks</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Selected {selectedQuestions.length} question(s)</p>
        </div>

        {/* ALLOWED CANDIDATES (Always Active) */}
        <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Allowed Candidates</h3>
            {form.isPublic && <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">Optional in Public Mode</span>}
          </div>

          {form.allowedCandidates.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 mb-2">
              <Input
                placeholder="Email"
                value={c.email}
                onChange={(e) => {
                  const arr = [...form.allowedCandidates];
                  arr[i].email = e.target.value;
                  setForm({ ...form, allowedCandidates: arr });
                }}
              />
              <Input
                placeholder="Passcode"
                value={c.passcode}
                onChange={(e) => {
                  const arr = [...form.allowedCandidates];
                  arr[i].passcode = e.target.value;
                  setForm({ ...form, allowedCandidates: arr });
                }}
              />
            </div>
          ))}

          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => setForm({
                ...form,
                allowedCandidates: [...form.allowedCandidates, { email: "", passcode: "" }]
            })}
          >
            + Add Row
          </Button>
        </div>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Test"}
        </Button>
      </Card>
    </div>
  );
};

export default CreateTest;