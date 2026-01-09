import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Textarea, Input } from "../components/UI";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ratingOptions = [
  { value: 5, label: "Excellent" },
  { value: 4, label: "Good" },
  { value: 3, label: "Average" },
  { value: 2, label: "Below Average" },
  { value: 1, label: "Poor" },
];

const SubmissionSuccess = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [rating, setRating] = useState(null);
  const [headline, setHeadline] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("candidate_user");
    if (stored) {
      setCandidate(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please pick a rating before submitting");
      return;
    }

    setSubmitting(true);
    const feedbackPayload = {
      rating,
      headline: headline.trim(),
      comments: comments.trim(),
      candidate: candidate?.email || "anonymous",
      submittedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "candidate_feedback",
        JSON.stringify(feedbackPayload)
      );
      toast.success("Thanks for sharing your feedback!");
      setRating(null);
      setHeadline("");
      setComments("");
    } catch (err) {
      toast.error("Could not save feedback locally.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-8 bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-black">
              ✓
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                Submission Received
              </p>
              <h1 className="text-3xl font-black text-white mt-1">
                Thank you for completing your test!
              </h1>
              <p className="text-slate-400 mt-2">
                We would love to hear how your experience went.
              </p>
              {candidate && (
                <p className="text-sm text-slate-500 mt-1">
                  Sharing as{" "}
                  <span className="text-white font-semibold">
                    {candidate.name || "Candidate"}
                  </span>{" "}
                  ({candidate.email})
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-3">
                Overall rating
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ratingOptions.map((option) => {
                  const isActive = rating === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      fullWidth
                      variant={isActive ? "primary" : "secondary"}
                      className={`h-12 font-bold ${
                        isActive ? "ring-2 ring-slate-200" : ""
                      }`}
                      onClick={() => setRating(option.value)}
                    >
                      <span className="text-lg">{option.value}</span>
                      <span className="text-xs uppercase tracking-wider">
                        {option.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Input
              label="One-line summary"
              placeholder="e.g. Smooth flow and clear instructions"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />

            <Textarea
              label="Any details you would like to share?"
              placeholder="Tell us what worked well and what could be better."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              className="h-12 font-black uppercase tracking-widest"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 p-8 bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-300 text-2xl font-black">
              💬
            </div>
            <h2 className="text-2xl font-black text-white">
              We appreciate you
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Your notes help us make every future test smoother and more
              secure. If you hit issues, mention your test ID so we can
              investigate quickly.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              className="h-11 font-semibold"
              onClick={() => navigate("/candidatedash")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="ghost"
              fullWidth
              className="h-11 font-semibold border border-slate-800"
              onClick={() => navigate("/join")}
            >
              Join Another Test
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
