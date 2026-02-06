"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import type { types as mediasoupTypes } from "mediasoup-client";

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_MEDIASOUP_URL || "ws://localhost:3001";

interface RemoteStream {
  peerId: string;
  peerName?: string;
  stream: MediaStream;
  kind: "audio" | "video";
}

interface PeerInfo {
  id: string;
  name: string;
  isHost?: boolean;
}

interface WaitingPeer {
  id: string;
  name: string;
}

interface UseMediasoupOptions {
  roomId: string;
  userName: string;
  isHost?: boolean;
  autoJoin?: boolean;
}

export function useMediasoup({
  roomId,
  userName,
  isHost = false,
  autoJoin = false,
}: UseMediasoupOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [waitingPeers, setWaitingPeers] = useState<WaitingPeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [amIHost, setAmIHost] = useState(isHost);

  const socketRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<mediasoupTypes.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupTypes.Transport | null>(null);
  const producersRef = useRef<Map<string, mediasoupTypes.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupTypes.Consumer>>(new Map());
  const peerIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string>(roomId);

  // Send message to signaling server
  const send = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Get local media stream
  const getLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio
          ? { echoCancellation: true, noiseSuppression: true }
          : false,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      setError("Failed to access camera/microphone");
      console.error("getUserMedia error:", err);
      return null;
    }
  }, []);

  // Create send transport and produce
  const produce = useCallback(
    async (
      stream: MediaStream,
      _rtpCapabilities: mediasoupTypes.RtpCapabilities,
    ) => {
      if (!deviceRef.current || !sendTransportRef.current) return;

      // Produce video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const producer = await sendTransportRef.current.produce({
          track: videoTrack,
        });
        producersRef.current.set(producer.id, producer);
      }

      // Produce audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const producer = await sendTransportRef.current.produce({
          track: audioTrack,
        });
        producersRef.current.set(producer.id, producer);
      }
    },
    [],
  );

  // Consume a remote producer
  const consume = useCallback(
    async (
      producerId: string,
      rtpCapabilities: mediasoupTypes.RtpCapabilities,
    ) => {
      send("consume", {
        roomId: roomIdRef.current,
        producerId,
        rtpCapabilities,
      });
    },
    [send],
  );

  // Approve a waiting peer (host only)
  const approveJoin = useCallback(
    (requestPeerId: string) => {
      send("approveJoin", { roomId: roomIdRef.current, requestPeerId });
      setWaitingPeers((prev) => prev.filter((p) => p.id !== requestPeerId));
    },
    [send],
  );

  // Reject a waiting peer (host only)
  const rejectJoin = useCallback(
    (requestPeerId: string) => {
      send("rejectJoin", { roomId: roomIdRef.current, requestPeerId });
      setWaitingPeers((prev) => prev.filter((p) => p.id !== requestPeerId));
    },
    [send],
  );

  // Handle signaling messages
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const { type, data } = JSON.parse(event.data);

      switch (type) {
        case "welcome":
          peerIdRef.current = data.peerId;
          setIsConnected(true);
          if (autoJoin) {
            send("joinRoom", {
              roomId: roomIdRef.current,
              name: userName,
              isHost,
            });
          }
          break;

        case "waitingForApproval":
          setIsWaiting(true);
          break;

        case "joinRejected":
          setIsWaiting(false);
          setIsRejected(true);
          break;

        case "permissionRequest":
          // Host receives this when someone wants to join
          setWaitingPeers((prev) => [
            ...prev,
            { id: data.peerId, name: data.name },
          ]);
          break;

        case "roomJoined": {
          const {
            rtpCapabilities,
            existingProducers,
            peers: existingPeers,
            waitingPeers: existingWaiting,
            isHost: hostStatus,
          } = data;

          setIsWaiting(false);
          setAmIHost(hostStatus);

          // Load device with router capabilities
          const device = new Device();
          await device.load({ routerRtpCapabilities: rtpCapabilities });
          deviceRef.current = device;

          setPeers(existingPeers || []);
          setWaitingPeers(existingWaiting || []);
          setIsJoined(true);

          // Create transports
          send("createTransport", {
            roomId: roomIdRef.current,
            direction: "send",
          });
          send("createTransport", {
            roomId: roomIdRef.current,
            direction: "recv",
          });

          // Consume existing producers after transports are ready
          setTimeout(() => {
            existingProducers?.forEach((p: { producerId: string }) => {
              if (deviceRef.current) {
                consume(p.producerId, device.rtpCapabilities);
              }
            });
          }, 1000);
          break;
        }

        case "transportCreated": {
          const {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            direction,
          } = data;
          if (!deviceRef.current) return;

          const transportOptions = {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
          };

          if (direction === "send") {
            const transport =
              deviceRef.current.createSendTransport(transportOptions);
            sendTransportRef.current = transport;

            transport.on("connect", ({ dtlsParameters }, callback) => {
              send("connectTransport", {
                roomId: roomIdRef.current,
                transportId: id,
                dtlsParameters,
              });
              callback();
            });

            transport.on("produce", ({ kind, rtpParameters }, callback) => {
              send("produce", {
                roomId: roomIdRef.current,
                transportId: id,
                kind,
                rtpParameters,
              });
              // Wait for produced response
              const handler = (e: MessageEvent) => {
                const msg = JSON.parse(e.data);
                if (msg.type === "produced") {
                  callback({ id: msg.data.producerId });
                  socketRef.current?.removeEventListener("message", handler);
                }
              };
              socketRef.current?.addEventListener("message", handler);
            });

            // Start producing if we have local stream
            if (localStream && deviceRef.current) {
              produce(localStream, deviceRef.current.rtpCapabilities);
            }
          } else {
            const transport =
              deviceRef.current.createRecvTransport(transportOptions);
            recvTransportRef.current = transport;

            transport.on("connect", ({ dtlsParameters }, callback) => {
              send("connectTransport", {
                roomId: roomIdRef.current,
                transportId: id,
                dtlsParameters,
              });
              callback();
            });
          }
          break;
        }

        case "consumed": {
          const {
            consumerId,
            producerId,
            producerPeerId,
            kind,
            rtpParameters,
          } = data;
          if (!recvTransportRef.current) return;

          const consumer = await recvTransportRef.current.consume({
            id: consumerId,
            producerId,
            kind,
            rtpParameters,
          });
          consumersRef.current.set(consumerId, consumer);

          const stream = new MediaStream([consumer.track]);
          setRemoteStreams((prev) => [
            ...prev.filter(
              (s) => !(s.peerId === producerPeerId && s.kind === kind),
            ),
            { peerId: producerPeerId, stream, kind },
          ]);
          break;
        }

        case "newPeer":
          setPeers((prev) => [
            ...prev,
            { id: data.peerId, name: data.name, isHost: data.isHost },
          ]);
          break;

        case "peerLeft":
          setPeers((prev) => prev.filter((p) => p.id !== data.peerId));
          setRemoteStreams((prev) =>
            prev.filter((s) => s.peerId !== data.peerId),
          );
          break;

        case "hostChanged":
          // Update host status
          setPeers((prev) =>
            prev.map((p) => ({
              ...p,
              isHost: p.id === data.newHostId,
            })),
          );
          if (peerIdRef.current === data.newHostId) {
            setAmIHost(true);
          }
          break;

        case "newProducer":
          if (deviceRef.current) {
            consume(data.producerId, deviceRef.current.rtpCapabilities);
          }
          break;

        case "consumerClosed":
          consumersRef.current.get(data.consumerId)?.close();
          consumersRef.current.delete(data.consumerId);
          break;
      }
    },
    [autoJoin, consume, isHost, localStream, produce, send, userName],
  );

  // Connect to signaling server
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(SIGNALING_URL);
    socketRef.current = socket;

    socket.onopen = () => console.log("Connected to signaling server");
    socket.onmessage = handleMessage;
    socket.onerror = () => setError("WebSocket error");
    socket.onclose = () => {
      setIsConnected(false);
      setIsJoined(false);
      setIsWaiting(false);
    };
  }, [handleMessage]);

  // Join room
  const joinRoom = useCallback(
    async (asHost = isHost) => {
      if (!isConnected) {
        connect();
        return;
      }
      send("joinRoom", {
        roomId: roomIdRef.current,
        name: userName,
        isHost: asHost,
      });
    },
    [connect, isConnected, isHost, send, userName],
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    send("leaveRoom", { roomId: roomIdRef.current });
    producersRef.current.forEach((p) => p.close());
    consumersRef.current.forEach((c) => c.close());
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    setIsJoined(false);
    setIsWaiting(false);
    setRemoteStreams([]);
    setPeers([]);
    setWaitingPeers([]);
  }, [send]);

  // Toggle video
  const toggleVideo = useCallback(
    (enabled: boolean) => {
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    },
    [localStream],
  );

  // Toggle audio
  const toggleAudio = useCallback(
    (enabled: boolean) => {
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    },
    [localStream],
  );

  // Start producing (call after joining)
  const startProducing = useCallback(async () => {
    if (localStream && deviceRef.current && sendTransportRef.current) {
      await produce(localStream, deviceRef.current.rtpCapabilities);
    }
  }, [localStream, produce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
      socketRef.current?.close();
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [leaveRoom, localStream]);

  return {
    isConnected,
    isJoined,
    isWaiting,
    isRejected,
    isHost: amIHost,
    localStream,
    remoteStreams,
    peers,
    waitingPeers,
    error,
    connect,
    joinRoom,
    leaveRoom,
    getLocalStream,
    startProducing,
    toggleVideo,
    toggleAudio,
    approveJoin,
    rejectJoin,
  };
}
