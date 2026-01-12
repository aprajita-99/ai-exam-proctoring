import socket from "./socket";

export const reportViolation = (attemptId, testId, type, image = null) => {
  socket.emit("candidate:violation", {
    attemptId,
    testId,
    type,
    image,
    timestamp: new Date(),
  });
};
