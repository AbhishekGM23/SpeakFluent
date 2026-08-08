"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { io, Socket } from "socket.io-client";

type AppState = "HOME" | "SEARCHING" | "MATCHED";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("HOME");
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Connect to production backend
    socketRef.current = io("https://speakfluent.onrender.com");

    socketRef.current.on("match_found", async (data: { roomId: string, initiator: boolean }) => {
      console.log("Matched!", data);
      setAppState("MATCHED");
      await setupWebRTC(data.initiator);
    });

    socketRef.current.on("partner_left", () => {
      console.log("Partner left");
      cleanupCall();
      setAppState("HOME");
    });

    // WebRTC Signaling listeners
    socketRef.current.on("webrtc_offer", async (offer) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socketRef.current?.emit("webrtc_answer", answer);
    });

    socketRef.current.on("webrtc_answer", async (answer) => {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socketRef.current.on("webrtc_ice_candidate", async (candidate) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });

    return () => {
      cleanupCall();
      socketRef.current?.disconnect();
    };
  }, []);

  const setupWebRTC = async (isInitiator: boolean) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc_ice_candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc_offer", offer);
    }
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsMuted(false);
  };

  const startSearch = async () => {
    try {
      // Trigger the ad popup when they click "Find Partner"
      window.open("https://affectionatestorage.com/b/3HVI0.PC3spSvFbgmrVxJLZBDb0-3FMIzjA/wnO/DkgY1VLUTwc/zQM/DIA/4JOMDQku", "_blank");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setAppState("SEARCHING");
      socketRef.current?.emit("find_partner");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use this feature.");
    }
  };

  const cancelSearch = () => {
    cleanupCall();
    setAppState("HOME");
    socketRef.current?.emit("cancel_search");
  };

  const endCall = () => {
    cleanupCall();
    setAppState("HOME");
    socketRef.current?.emit("leave_chat");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {appState === "HOME" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center w-full max-w-md"
          >
            <div className="flex items-center gap-3 font-display font-bold text-3xl mb-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              SpeakFluent
            </div>

            <h1 className="text-4xl font-display font-bold text-center text-white mb-4">
              Talk to strangers. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Voice only.
              </span>
            </h1>
            <p className="text-zinc-400 text-center mb-10">
              Instantly connect with random people around the world to practice English or just chat. No login required.
            </p>

            <button
              onClick={startSearch}
              className="w-full h-14 rounded-full font-bold text-lg flex items-center justify-center transition-all bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
            >
              Find Partner
            </button>
          </motion.div>
        )}

        {appState === "SEARCHING" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 border-2 border-primary rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 border-2 border-primary rounded-full"
              />
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-white mb-2">Finding a partner...</h2>
            <p className="text-zinc-400 mb-10">Waiting for someone to connect.</p>
            
            <button
              onClick={cancelSearch}
              className="px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {appState === "MATCHED" && (
          <motion.div
            key="matched"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-2xl"
          >
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
              
              <div className="text-emerald-400 font-bold mb-8 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Connected
              </div>

              <div className="w-full flex justify-between items-center mb-16 px-4 md:px-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <h3 className="text-white font-bold text-lg">You</h3>
                </div>
                
                {/* Voice visualization */}
                <div className="flex-1 flex justify-center items-center gap-1 mx-4 h-12">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: Math.max(8, Math.random() * 48) }}
                      transition={{ duration: 0.1, repeat: Infinity, repeatType: "mirror" }}
                      className="w-1.5 bg-primary rounded-full"
                    />
                  ))}
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <h3 className="text-white font-bold text-lg">Stranger</h3>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleMute}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition text-white ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <button 
                  onClick={endCall}
                  className="px-8 h-16 rounded-full bg-red-500 flex items-center justify-center gap-2 hover:bg-red-600 transition text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <X className="w-6 h-6" />
                  End Call
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}
