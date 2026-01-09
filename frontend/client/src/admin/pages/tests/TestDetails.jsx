import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTestById } from "../../services/testApi";
import { Card } from "../../../components/UI";
import { useNavigate} from "react-router-dom";

const TestDetails = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTestById(id).then((res) => setTest(res.data));
  }, [id]);

  if (!test) {
    return <div className="p-10 text-center">Loading test…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-black">{test.title}</h1>
        <p>Duration: {test.duration} minutes</p>
        <p>Active till: {new Date(test.activeTill).toLocaleString()}</p>
        <p>Test ID: {test.testId}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-2">Questions</h3>
        <ul className="list-disc pl-6 space-y-1">
          {test.questions.map((q) => (
            <li
              key={q._id}
              onClick={() => navigate(`/admin/questions/${q._id}`)}
              className="cursor-pointer text-blue-400 hover:underline"
            >
              {q.questionText}{" "}
              <span className="text-slate-400">
                ({q.type}, {q.marks} marks)
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-2">Allowed Candidates</h3>
        <ul className="space-y-1 text-sm">
          {test.allowedCandidates.map((c, i) => (
            <li key={i}>
              {c.email} —{" "}
              <span
                className={c.hasAttempted ? "text-red-400" : "text-green-400"}
              >
                {c.hasAttempted ? "Attempted" : "Not Attempted"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default TestDetails;
