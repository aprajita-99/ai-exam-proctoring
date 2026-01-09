import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { Card, Button } from "../../../components/UI";
import { toast } from "react-toastify";

const QuestionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data } = await api.get(`/questions/${id}`);
        setQuestion(data);
      } catch {
        toast.error("Failed to load question");
        navigate("/admin/questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-10 text-slate-400 text-center">
        Loading question…
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Question Details</h1>
        <Button
          variant="secondary"
          onClick={() =>
            navigate(`/admin/questions/${question._id}/edit`)
          }
        >
          ✏️ Edit Question
        </Button>
      </div>

      {/* META */}
      <Card className="p-6 space-y-3">
        <p className="text-lg font-semibold">
          {question.questionText}
        </p>

        <div className="flex gap-4 text-sm text-slate-400">
          <span>Type: {question.type.toUpperCase()}</span>
          <span>Marks: {question.marks}</span>
          <span>
            Created:{" "}
            {new Date(question.createdAt).toLocaleString()}
          </span>
        </div>
      </Card>

      {/* TYPE-SPECIFIC DETAILS */}

      {/* MCQ */}
      {question.type === "mcq" && (
        <Card className="p-6 space-y-3">
          <h3 className="font-bold">Options</h3>

          {question.mcq.options.map((opt, i) => (
            <div
              key={i}
              className={`p-3 rounded border ${
                question.mcq.correctAnswer === i
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-800"
              }`}
            >
              {opt}
            </div>
          ))}
        </Card>
      )}

      {/* DESCRIPTIVE */}
      {question.type === "descriptive" && (
        <Card className="p-6">
          <h3 className="font-bold mb-2">Sample Answer</h3>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {question.descriptive?.sampleAnswer || "—"}
          </p>
        </Card>
      )}

      {/* CODING */}
      {question.type === "coding" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <h3 className="font-bold">Problem Statement</h3>
            <p className="whitespace-pre-wrap text-sm">
              {question.coding.problemStatement}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-bold">Constraints</h3>
            <p className="whitespace-pre-wrap text-sm">
              {question.coding.constraints || "—"}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-bold">Input Format</h3>
            <p className="whitespace-pre-wrap text-sm">
              {question.coding.inputFormat || "—"}
            </p>

            <h3 className="font-bold mt-4">Output Format</h3>
            <p className="whitespace-pre-wrap text-sm">
              {question.coding.outputFormat || "—"}
            </p>
          </Card>

          {/* SAMPLE TEST CASES */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold">
              Sample Test Cases (Visible)
            </h3>

            {question.coding.sampleTestCases.map((tc, i) => (
              <div
                key={i}
                className="border border-slate-800 rounded p-4 space-y-2"
              >
                <div>
                  <p className="text-xs text-slate-400">Input</p>
                  <pre className="text-sm bg-slate-900 p-2 rounded">
                    {tc.input}
                  </pre>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Output</p>
                  <pre className="text-sm bg-slate-900 p-2 rounded">
                    {tc.output}
                  </pre>
                </div>

                {tc.explanation && (
                  <div>
                    <p className="text-xs text-slate-400">
                      Explanation
                    </p>
                    <p className="text-sm">
                      {tc.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </Card>

          <Card className="p-6 text-sm text-slate-400">
            <p>
              Time Limit: {question.coding.timeLimitMs} ms
            </p>
            <p>
              Memory Limit: {question.coding.memoryLimitMb} MB
            </p>
            <p>
              Supported Languages:{" "}
              {question.coding.supportedLanguages.join(", ")}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QuestionDetails;
