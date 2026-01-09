import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests } from "../../services/testApi";
import { Card } from "../../../components/UI";

const ActiveTests = () => {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await getMyTests();
        // Backend already separates live & expired
        setTests(res.data.live || []);
      } catch (err) {
        console.error("Failed to load active tests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400">
        Loading active tests…
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <Card className="p-12 text-center text-slate-400">
        No active tests right now
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {tests.map((test) => {
        const totalCandidates = test.allowedCandidates.length;

        const attempted = test.allowedCandidates.filter(
          (c) => c.hasAttempted
        ).length;

        const notStarted = totalCandidates - attempted;

        // Active count will come from TestAttempt later
        const active = 0;

        return (
          <Card
            key={test._id}
            className="p-6 cursor-pointer hover:border-blue-500 transition"
            onClick={() =>
              navigate(`/admin/monitoring/tests/${test._id}`)
            }
          >
            {/* HEADER */}
            <div className="mb-4">
              <h3 className="text-lg font-bold">{test.title}</h3>
              <p className="text-xs text-slate-400">
                Test ID: {test.testId}
              </p>
            </div>

            {/* META */}
            <div className="text-sm text-slate-400 space-y-1">
              <p>Duration: {test.duration} min</p>
              <p>
                Active till:{" "}
                {new Date(test.activeTill).toLocaleString()}
              </p>
            </div>

            {/* CANDIDATE STATS */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900 rounded p-2">
                <p className="text-xs text-slate-400">
                  Not Started
                </p>
                <p className="text-lg font-bold text-slate-200">
                  {notStarted}
                </p>
              </div>

              <div className="bg-slate-900 rounded p-2">
                <p className="text-xs text-slate-400">
                  Active
                </p>
                <p className="text-lg font-bold text-blue-400">
                  {active}
                </p>
              </div>

              <div className="bg-slate-900 rounded p-2">
                <p className="text-xs text-slate-400">
                  Submitted
                </p>
                <p className="text-lg font-bold text-green-400">
                  {attempted}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ActiveTests;
