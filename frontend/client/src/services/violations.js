import socket from "./socket";

export const reportViolation = (attemptId, testId, type) => {
  socket.emit("candidate:violation", {
    attemptId,
    testId,
    type,
    timestamp: new Date(),
  });
};
