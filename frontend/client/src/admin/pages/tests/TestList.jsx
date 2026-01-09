import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests } from "../../services/testApi";
import { Card, Button } from "../../../components/UI";

const TestList = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState({ live: [], expired: [] });
  const [tab, setTab] = useState("live");

  useEffect(() => {
    getMyTests().then((res) => setTests(res.data));
  }, []);

  const list = tests[tab];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">My Tests</h1>
        <Button onClick={() => navigate("/admin/tests/create")}>
          + Create Test
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          variant={tab === "live" ? "primary" : "ghost"}
          onClick={() => setTab("live")}
        >
          Live Tests
        </Button>
        <Button
          variant={tab === "expired" ? "primary" : "ghost"}
          onClick={() => setTab("expired")}
        >
          Past Tests
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          No tests found
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {list.map((t) => (
            <Card
              key={t._id}
              className="p-6 hover:border-blue-500 cursor-pointer"
              onClick={() => {
    console.log("CLICKED");
    navigate(`/admin/tests/${t._id}`);
  }}
            >
              <h3 className="font-bold text-lg">{t.title}</h3>
              <p className="text-sm text-slate-400">
                Duration: {t.duration} min
              </p>
              <p className="text-sm text-slate-400">
                Active till: {new Date(t.activeTill).toLocaleString()}
              </p>
              <p className="text-xs mt-2">
                Questions: {t.questions.length}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestList;
