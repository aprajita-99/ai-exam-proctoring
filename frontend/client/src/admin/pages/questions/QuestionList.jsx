import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, deleteQuestion } from "../../services/questionApi";
import { Button } from "../../../components/UI"; // Assuming Card is no longer needed for the table wrapper
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  FileText, 
  Code2, 
  CheckSquare, 
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

const PAGE_SIZE = 5;

const QuestionList = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  /* ===============================
      FILTER + SEARCH + PAGINATION
  =============================== */
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestions();
      setQuestions(res.data);
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      setDeletingId(id);
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  };

  /* ===============================
      COMPUTED DATA
  =============================== */
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesType = typeFilter === "all" || q.type === typeFilter;
      const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [questions, typeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery]);

  /* ===============================
      HELPER: TYPE BADGE
  =============================== */
  const getTypeBadge = (type) => {
    const config = {
      mcq: { 
        icon: <CheckSquare size={14} />, 
        label: "MCQ", 
        classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" 
      },
      descriptive: { 
        icon: <FileText size={14} />, 
        label: "Descriptive", 
        classes: "bg-purple-500/10 text-purple-400 border-purple-500/20" 
      },
      coding: { 
        icon: <Code2 size={14} />, 
        label: "Coding", 
        classes: "bg-orange-500/10 text-orange-400 border-orange-500/20" 
      },
    };

    const style = config[type] || config.mcq;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${style.classes}`}>
        {style.icon}
        {style.label}
      </span>
    );
  };

  /* ===============================
      RENDER
  =============================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Syncing question bank...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your assessment library</p>
        </div>
        <Button onClick={() => navigate("/admin/questions/create")} className="shadow-lg shadow-blue-500/20">
          <Plus size={18} className="mr-2" />
          Create Question
        </Button>
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sm pl-9 pr-8 py-2.5 rounded-lg appearance-none cursor-pointer hover:border-slate-700 transition-colors text-slate-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="descriptive">Descriptive</option>
              <option value="coding">Coding</option>
            </select>
          </div>
        </div>
      </div>

      {/* QUESTION LIST */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
          <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-300">No questions found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider text-left">
                <th className="px-4 pb-2">Question Details</th>
                <th className="px-4 pb-2 w-32 text-center">Type</th>
                <th className="px-4 pb-2 w-24 text-center">Marks</th>
                <th className="px-4 pb-2 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuestions.map((q) => (
                <tr 
                  key={q._id} 
                  className="group bg-slate-900 hover:bg-slate-800/80 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-slate-900/50 rounded-xl"
                >
                  {/* Question Text */}
                  <td className="p-4 first:rounded-l-xl border-y border-l border-slate-800/50 group-hover:border-slate-700/50">
                    <div className="flex flex-col">
                      <span 
                        onClick={() => navigate(`/admin/questions/${q._id}`)}
                        className="font-medium text-slate-200 hover:text-blue-400 cursor-pointer transition-colors line-clamp-2"
                      >
                        {q.questionText}
                      </span>
                      <span className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                        <span>Created {new Date(q.createdAt).toLocaleDateString()}</span>
                        {/* Optional: Add difficulty dot here if you have that data */}
                      </span>
                    </div>
                  </td>

                  {/* Type Badge */}
                  <td className="p-4 border-y border-slate-800/50 group-hover:border-slate-700/50 text-center">
                    {getTypeBadge(q.type)}
                  </td>

                  {/* Marks */}
                  <td className="p-4 border-y border-slate-800/50 group-hover:border-slate-700/50 text-center">
                    <span className="font-mono text-sm font-semibold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {q.marks} pts
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 last:rounded-r-xl border-y border-r border-slate-800/50 group-hover:border-slate-700/50 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/admin/questions/${q._id}/edit`)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        disabled={deletingId === q._id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Question"
                      >
                        {deletingId === q._id ? (
                          <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-6">
          <p className="text-sm text-slate-500">
            Page <span className="text-slate-300 font-medium">{currentPage}</span> of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1"
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;