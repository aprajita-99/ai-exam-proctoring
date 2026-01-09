import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTestById } from "../../services/testApi";
import { Card, Button } from "../../../components/UI";

const TestMonitoring = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("not_started");

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await getTestById(id);
        setTest(res.data);
      } catch (err) {
        console.error("Failed to load test", err);
        navigate("/admin/monitoring");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id, navigate]);

  const isActiveTest = useMemo(() => {
    if (!test) return false;
    return new Date(test.activeTill) > new Date();
  }, [test]);

  /* ===============================
     CANDIDATE GROUPING
  =============================== */
  const { notStarted, submitted } = useMemo(() => {
    if (!test) return { notStarted: [], submitted: [] };

    const ns = [];
    const sub = [];

    test.allowedCandidates.forEach((c) => {
      if (c.hasAttempted) sub.push(c);
      else ns.push(c);
    });

    return { notStarted: ns, submitted: sub };
  }, [test]);

  // Placeholder — will be replaced by TestAttempt data
  const activeCandidates = [];

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400">
        Loading test monitoring…
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">{test.title}</h1>
          <p className="text-sm text-slate-400">
            Test ID: {test.testId}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate("/admin/monitoring")}
        >
          ← Back
        </Button>
      </div>

      {/* TEST META */}
      <Card className="p-4 flex gap-6 text-sm text-slate-400">
        <span>Duration: {test.duration} min</span>
        <span>
          {isActiveTest ? "Active till" : "Ended at"}:{" "}
          {new Date(test.activeTill).toLocaleString()}
        </span>
        <span>
          Total Candidates: {test.allowedCandidates.length}
        </span>
      </Card>

      {/* TABS */}
      <Card className="p-4 flex gap-4">
        <Button
          variant={tab === "not_started" ? "primary" : "ghost"}
          onClick={() => setTab("not_started")}
        >
          {isActiveTest ? "Not Started" : "Unattempted"} (
          {notStarted.length})
        </Button>

        {isActiveTest && (
          <Button
            variant={tab === "active" ? "primary" : "ghost"}
            onClick={() => setTab("active")}
          >
            Active ({activeCandidates.length})
          </Button>
        )}

        <Button
          variant={tab === "submitted" ? "primary" : "ghost"}
          onClick={() => setTab("submitted")}
        >
          Submitted ({submitted.length})
        </Button>
      </Card>

      {/* CANDIDATE LIST */}
      <div className="grid grid-cols-2 gap-6">
        {/* NOT STARTED / UNATTEMPTED */}
        {tab === "not_started" &&
          notStarted.map((c, i) => (
            <Card
              key={i}
              className="p-5 hover:border-slate-600 transition"
            >
              <p className="font-semibold">{c.email}</p>
              <p className="text-sm text-slate-400 mt-1">
                Status:{" "}
                {isActiveTest ? "Not Started" : "Unattempted"}
              </p>
            </Card>
          ))}

        {/* ACTIVE (PLACEHOLDER) */}
        {tab === "active" &&
          activeCandidates.map((c) => (
            <Card key={c.attemptId} className="p-5">
              <p className="font-semibold">{c.email}</p>
              <p className="text-sm text-blue-400">
                In Progress
              </p>
            </Card>
          ))}

        {/* SUBMITTED */}
        {tab === "submitted" &&
          submitted.map((c, i) => (
            <Card
              key={i}
              className="p-5 cursor-pointer hover:border-blue-500 transition"
              onClick={() =>
                navigate(
                  `/admin/monitoring/attempts/${test._id}/${c.email}`
                )
              }
            >
              <p className="font-semibold">{c.email}</p>
              <p className="text-sm text-green-400 mt-1">
                Submitted
              </p>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default TestMonitoring;
