import { useEffect, useRef, useState } from "react";
import socket from "../services/socket"; // Adjust your path

const useCandidateStream = (attemptId) => {
  const [stream, setStream] = useState(null);
  const pcRef = useRef(null);

  useEffect(() => {
    if (!attemptId) return;

    // 1. Initialize Peer Connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // 2. Handle Incoming Stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log(`🎥 Stream received for ${attemptId}`);
        setStream(event.streams[0]);
      }
    };

    // 3. Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice", {
          attemptId,
          candidate: event.candidate,
        });
      }
    };

    // 4. Join Room & Signal
    socket.emit("admin:join", { attemptId });

    const handleOffer = async (offer) => {
      // Ensure we are setting remote description for the correct PC
      if (pc.signalingState !== "stable") return; 
      try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { attemptId, answer });
      } catch (err) {
        console.error("WebRTC Offer Error:", err);
      }
    };

    const handleIce = (candidate) => {
      pc.addIceCandidate(candidate).catch((e) => console.error("ICE Error:", e));
    };

    // 5. Socket Listeners
    // We namespace listeners by attemptId to prevent crossover in grid view
    // Note: Ideally, your socket events should include attemptId to filter
    // For now, we assume global listeners, but in a grid, this can be tricky.
    // Ensure your server emits events specific to the room/attempt.
    
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:ice", handleIce);

    // 6. Cleanup
    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:ice", handleIce);
      
      // Stop all tracks to release camera/memory
      if(stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      pc.close();
    };
  }, [attemptId]);

  return stream;
};

export default useCandidateStream;