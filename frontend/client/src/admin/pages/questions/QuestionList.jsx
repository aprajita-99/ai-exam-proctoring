import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, deleteQuestion } from "../../services/questionApi";
import { Button, Card } from "../../../components/UI";

const PAGE_SIZE = 5;

const QuestionList = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  /* ===============================
     FILTER + PAGINATION STATE
  =============================== */
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  /* ===============================
     FETCH QUESTIONS
  =============================== */
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

  /* ===============================
     DELETE QUESTION
  =============================== */
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this question?\nThis action cannot be undone."
    );
    if (!confirm) return;

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
     FILTERED QUESTIONS
  =============================== */
  const filteredQuestions = useMemo(() => {
    return typeFilter === "all"
      ? questions
      : questions.filter((q) => q.type === typeFilter);
  }, [questions, typeFilter]);

  /* ===============================
     PAGINATION LOGIC
  =============================== */
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // reset page on filter change
  }, [typeFilter]);

  /* ===============================
     UI STATES
  =============================== */
  if (loading) {
    return <div className="text-sm text-slate-400">Loading question bank…</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Question Bank</h1>

        <Button onClick={() => navigate("/admin/questions/create")}>
          + Create Question
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-sm px-3 py-2 rounded-md"
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="descriptive">Descriptive</option>
          <option value="coding">Coding</option>
        </select>

        <span className="text-xs text-slate-400">
          Showing {filteredQuestions.length} questions
        </span>
      </div>

      {/* EMPTY STATE */}
      {filteredQuestions.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <p className="font-bold mb-2 text-lg">No questions found</p>
          <p className="text-sm">
            Try changing filters or create a new question.
          </p>
        </Card>
      ) : (
        <>
          {/* TABLE */}
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="text-left px-6 py-4">Question</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-center px-6 py-4">Marks</th>
                  <th className="text-left px-6 py-4">Created</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedQuestions.map((q) => {
                  const typeStyles = {
                    mcq: "border-l-blue-500 text-blue-400 bg-blue-500/10",
                    descriptive:
                      "border-l-purple-500 text-purple-400 bg-purple-500/10",
                    coding: "border-l-red-500 text-red-400 bg-red-500/10",
                  };

                  return (
                    <tr
                      key={q._id}
                      className="border-b border-slate-900 hover:bg-slate-900/40 transition"
                    >
                      <td className="px-6 py-5 max-w-xl">
                        <p
                          className="font-semibold text-blue-400 hover:underline cursor-pointer line-clamp-2"
                          onClick={() => navigate(`/admin/questions/${q._id}`)}
                        >
                          {q.questionText}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border-l-4 ${
                            typeStyles[q.type]
                          }`}
                        >
                          {q.type}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center font-bold">
                        {q.marks}
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-5 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/admin/questions/${q._id}/edit`)
                          }
                        >
                          ✏️ Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400"
                          disabled={deletingId === q._id}
                          onClick={() => handleDelete(q._id)}
                        >
                          {deletingId === q._id ? "…" : "🗑 Delete"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {/* PREVIOUS */}
              <Button
                size="sm"
                variant="ghost"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="disabled:opacity-40"
              >
                ← Prev
              </Button>

              {/* PAGE DOTS */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  const isActive = page === currentPage;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-2.5 h-2.5 rounded-full transition
              ${
                isActive
                  ? "bg-blue-500 scale-125"
                  : "bg-slate-600 hover:bg-slate-400"
              }`}
                      aria-label={`Go to page ${page}`}
                    />
                  );
                })}
              </div>

              {/* NEXT */}
              <Button
                size="sm"
                variant="ghost"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionList;
