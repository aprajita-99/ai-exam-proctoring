import TestAttempt from "../models/TestAttempt.js";

export default function initSockets(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /**
     * Admin joins a test room
     */
    socket.on("admin:join", ({ testId }) => {
      socket.join(testId);
      console.log(`Admin joined test room ${testId}`);
    });

    /**
     * Candidate joins test
     */
    socket.on("candidate:join", async ({ attemptId, testId }) => {
      socket.join(testId);

      await TestAttempt.findByIdAndUpdate(attemptId, {
        status: "joined",
      });

      io.to(testId).emit("candidate:update", {
        attemptId,
        status: "joined",
      });
    });

    /**
     * Candidate verified
     */
    socket.on("candidate:verified", async ({ attemptId, testId }) => {
      await TestAttempt.findByIdAndUpdate(attemptId, {
        status: "verified",
      });

      io.to(testId).emit("candidate:update", {
        attemptId,
        status: "verified",
      });
    });

    /**
     * Candidate started test
     */
    socket.on("candidate:start", async ({ attemptId, testId }) => {
      await TestAttempt.findByIdAndUpdate(attemptId, {
        status: "in_progress",
        startedAt: new Date(),
      });

      io.to(testId).emit("candidate:update", {
        attemptId,
        status: "in_progress",
      });
    });

    /**
     * Candidate heartbeat
     */
    socket.on("candidate:heartbeat", ({ attemptId, testId }) => {
      io.to(testId).emit("candidate:heartbeat", {
        attemptId,
        timestamp: new Date(),
      });
    });

    /**
     * Candidate submitted test
     */
    socket.on("candidate:submit", async ({ attemptId, testId }) => {
      await TestAttempt.findByIdAndUpdate(attemptId, {
        status: "submitted",
        submittedAt: new Date(),
      });

      io.to(testId).emit("candidate:update", {
        attemptId,
        status: "submitted",
      });
    });

    /**
     * Disconnect handling
     */
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
