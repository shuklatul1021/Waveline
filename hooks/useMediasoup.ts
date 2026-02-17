"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import type { types as mediasoupTypes } from "mediasoup-client";

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_MEDIASOUP_URL || "ws://localhost:3001";

export interface RemoteStream {
  peerId: string;
  peerName?: string;
  stream: MediaStream;
  kind: "audio" | "video";
  isScreenShare?: boolean;
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
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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
  const screenProducerRef = useRef<mediasoupTypes.Producer | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string>(roomId);
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasProducedRef = useRef(false);

  // Queue for "produced" response callbacks
  const producedCallbacksRef = useRef<Array<(id: string) => void>>([]);

  // Queue for existing producers to consume once recv transport is ready
  const pendingConsumesRef = useRef<
    Array<{
      producerId: string;
      rtpCapabilities: mediasoupTypes.RtpCapabilities;
    }>
  >([]);

  // Send message to signaling server
  const send = useCallback((type: string, data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Get local media stream with error recovery
  const getLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setError(null);
      return stream;
    } catch (err) {
      const mediaError = err as DOMException;
      if (mediaError.name === "NotAllowedError") {
        setError(
          "Camera/microphone access denied. Please allow permissions in your browser settings.",
        );
      } else if (mediaError.name === "NotFoundError") {
        setError("No camera or microphone found on this device.");
      } else if (mediaError.name === "NotReadableError") {
        setError("Camera/microphone is already in use by another application.");
      } else {
        setError("Failed to access camera/microphone.");
      }
      console.error("getUserMedia error:", err);

      // Fallback: try audio only if video failed
      if (video && audio) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          setLocalStream(audioOnly);
          localStreamRef.current = audioOnly;
          setError("Camera unavailable — joined with audio only.");
          return audioOnly;
        } catch {
          // Audio also failed
        }
      }
      return null;
    }
  }, []);

  // Produce a single track to the send transport
  const produceTrack = useCallback(
    async (track: MediaStreamTrack, appData?: Record<string, unknown>) => {
      if (!sendTransportRef.current) return null;
      try {
        const producer = await sendTransportRef.current.produce({
          track,
          appData: appData || {},
        });
        producersRef.current.set(producer.id, producer);
        producer.on("transportclose", () => {
          producersRef.current.delete(producer.id);
        });
        return producer;
      } catch (err) {
        console.error("Failed to produce track:", err);
        return null;
      }
    },
    [],
  );

  // Consume a remote producer
  const consume = useCallback(
    (producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities) => {
      if (!recvTransportRef.current) {
        // Queue if recv transport not ready
        pendingConsumesRef.current.push({ producerId, rtpCapabilities });
        return;
      }
      send("consume", {
        roomId: roomIdRef.current,
        producerId,
        rtpCapabilities,
      });
    },
    [send],
  );

  // Flush pending consume requests when recv transport becomes ready
  const flushPendingConsumes = useCallback(() => {
    const pending = pendingConsumesRef.current;
    pendingConsumesRef.current = [];
    for (const { producerId, rtpCapabilities } of pending) {
      send("consume", {
        roomId: roomIdRef.current,
        producerId,
        rtpCapabilities,
      });
    }
  }, [send]);

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

  // Internal: stop screen share
  const stopScreenShareInternal = useCallback(() => {
    if (screenProducerRef.current) {
      screenProducerRef.current.close();
      producersRef.current.delete(screenProducerRef.current.id);
      screenProducerRef.current = null;
    }
    setScreenStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setIsScreenSharing(false);
  }, []);

  // Handle signaling messages
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      let parsedType: string;
      let parsedData: Record<string, unknown>;
      try {
        const parsed = JSON.parse(event.data);
        parsedType = parsed.type;
        parsedData = parsed.data;
      } catch {
        console.error("Failed to parse signaling message");
        return;
      }

      switch (parsedType) {
        case "welcome":
          peerIdRef.current = parsedData.peerId as string;
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
          setWaitingPeers((prev) => [
            ...prev,
            {
              id: parsedData.peerId as string,
              name: parsedData.name as string,
            },
          ]);
          break;

        case "roomJoined": {
          const rtpCapabilities =
            parsedData.rtpCapabilities as mediasoupTypes.RtpCapabilities;
          const existingProducers = parsedData.existingProducers as
            | Array<{ producerId: string }>
            | undefined;
          const existingPeers = parsedData.peers as PeerInfo[] | undefined;
          const existingWaiting = parsedData.waitingPeers as
            | WaitingPeer[]
            | undefined;
          const hostStatus = parsedData.isHost as boolean;

          setIsWaiting(false);
          setAmIHost(hostStatus);

          // Load device
          try {
            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            deviceRef.current = device;
          } catch (err) {
            console.error("Failed to load Device:", err);
            setError(
              "Your browser does not support the required media features.",
            );
            return;
          }

          setPeers(existingPeers || []);
          setWaitingPeers(existingWaiting || []);
          setIsJoined(true);
          hasProducedRef.current = false;

          // Queue existing producers for consumption after recv transport is ready
          if (
            existingProducers &&
            existingProducers.length > 0 &&
            deviceRef.current
          ) {
            const caps = deviceRef.current.rtpCapabilities;
            for (const p of existingProducers) {
              pendingConsumesRef.current.push({
                producerId: p.producerId,
                rtpCapabilities: caps,
              });
            }
          }

          // Request both transports
          send("createTransport", {
            roomId: roomIdRef.current,
            direction: "send",
          });
          send("createTransport", {
            roomId: roomIdRef.current,
            direction: "recv",
          });
          break;
        }

        case "transportCreated": {
          const transportId = parsedData.id as string;
          const iceParameters =
            parsedData.iceParameters as mediasoupTypes.IceParameters;
          const iceCandidates =
            parsedData.iceCandidates as mediasoupTypes.IceCandidate[];
          const dtlsParameters =
            parsedData.dtlsParameters as mediasoupTypes.DtlsParameters;
          const direction = parsedData.direction as string;

          if (!deviceRef.current) return;

          const transportOptions = {
            id: transportId,
            iceParameters,
            iceCandidates,
            dtlsParameters,
          };

          if (direction === "send") {
            const transport =
              deviceRef.current.createSendTransport(transportOptions);
            sendTransportRef.current = transport;

            transport.on(
              "connect",
              ({ dtlsParameters: connectDtls }, callback, errback) => {
                try {
                  send("connectTransport", {
                    roomId: roomIdRef.current,
                    transportId,
                    dtlsParameters: connectDtls,
                  });
                  callback();
                } catch (err) {
                  errback(err as Error);
                }
              },
            );

            transport.on(
              "produce",
              (
                { kind, rtpParameters, appData: pAppData },
                callback,
                errback,
              ) => {
                try {
                  const callbackPromise = new Promise<string>((resolve) => {
                    producedCallbacksRef.current.push(resolve);
                  });

                  send("produce", {
                    roomId: roomIdRef.current,
                    transportId,
                    kind,
                    rtpParameters,
                    appData: pAppData,
                  });

                  callbackPromise.then((producerId) => {
                    callback({ id: producerId });
                  });
                } catch (err) {
                  errback(err as Error);
                }
              },
            );

            transport.on("connectionstatechange", (state) => {
              if (state === "failed" || state === "disconnected") {
                console.warn(`Send transport ${state}`);
              }
            });
          } else {
            const transport =
              deviceRef.current.createRecvTransport(transportOptions);
            recvTransportRef.current = transport;

            transport.on(
              "connect",
              ({ dtlsParameters: connectDtls }, callback, errback) => {
                try {
                  send("connectTransport", {
                    roomId: roomIdRef.current,
                    transportId,
                    dtlsParameters: connectDtls,
                  });
                  callback();
                } catch (err) {
                  errback(err as Error);
                }
              },
            );

            transport.on("connectionstatechange", (state) => {
              if (state === "failed" || state === "disconnected") {
                console.warn(`Recv transport ${state}`);
              }
            });

            // Recv transport ready — flush pending consumes
            flushPendingConsumes();
          }
          break;
        }

        case "produced": {
          const callback = producedCallbacksRef.current.shift();
          if (callback) {
            callback((parsedData as { producerId: string }).producerId);
          }
          break;
        }

        case "consumed": {
          const consumerId = parsedData.consumerId as string;
          const producerId = parsedData.producerId as string;
          const producerPeerId = parsedData.producerPeerId as string;
          const kind = parsedData.kind as "audio" | "video";
          const rtpParameters =
            parsedData.rtpParameters as mediasoupTypes.RtpParameters;
          const consumerAppData = parsedData.appData as
            | Record<string, unknown>
            | undefined;

          if (!recvTransportRef.current) return;

          try {
            const consumer = await recvTransportRef.current.consume({
              id: consumerId,
              producerId,
              kind,
              rtpParameters,
            });
            consumersRef.current.set(consumerId, consumer);

            consumer.on("transportclose", () => {
              consumersRef.current.delete(consumerId);
            });

            const isScreen = !!consumerAppData?.isScreenShare;
            const peerName = consumerAppData?.peerName as string | undefined;

            const stream = new MediaStream([consumer.track]);
            setRemoteStreams((prev) => [
              ...prev.filter(
                (s) =>
                  !(
                    s.peerId === producerPeerId &&
                    s.kind === kind &&
                    s.isScreenShare === isScreen
                  ),
              ),
              {
                peerId: producerPeerId,
                peerName,
                stream,
                kind,
                isScreenShare: isScreen,
              },
            ]);
          } catch (err) {
            console.error("Failed to consume:", err);
          }
          break;
        }

        case "newPeer":
          setPeers((prev) => {
            const newId = (parsedData as { peerId: string }).peerId;
            if (prev.some((p) => p.id === newId)) return prev;
            return [
              ...prev,
              {
                id: newId,
                name: (parsedData as { name: string }).name,
                isHost: (parsedData as { isHost?: boolean }).isHost,
              },
            ];
          });
          break;

        case "peerLeft": {
          const leftId = (parsedData as { peerId: string }).peerId;
          setPeers((prev) => prev.filter((p) => p.id !== leftId));
          setRemoteStreams((prev) => prev.filter((s) => s.peerId !== leftId));
          break;
        }

        case "hostChanged":
          setPeers((prev) =>
            prev.map((p) => ({
              ...p,
              isHost: p.id === (parsedData as { newHostId: string }).newHostId,
            })),
          );
          if (
            peerIdRef.current ===
            (parsedData as { newHostId: string }).newHostId
          ) {
            setAmIHost(true);
          }
          break;

        case "newProducer":
          if (deviceRef.current) {
            consume(
              (parsedData as { producerId: string }).producerId,
              deviceRef.current.rtpCapabilities,
            );
          }
          break;

        case "consumerClosed": {
          const closedId = (parsedData as { consumerId: string }).consumerId;
          const closedConsumer = consumersRef.current.get(closedId);
          if (closedConsumer) {
            closedConsumer.close();
            consumersRef.current.delete(closedId);
          }
          break;
        }

        case "error":
          console.error(
            "Server error:",
            (parsedData as { message: string }).message,
          );
          break;
      }
    },
    [autoJoin, consume, flushPendingConsumes, isHost, send, userName],
  );

  // Connect to signaling server
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(SIGNALING_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to signaling server");
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      setError("Failed to connect to the meeting server. Please try again.");
    };

    socket.onclose = (e) => {
      setIsConnected(false);
      if (e.code !== 1000 && e.code !== 1001) {
        // Abnormal close — schedule reconnect
        setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            // Re-create connection
            const newSocket = new WebSocket(SIGNALING_URL);
            socketRef.current = newSocket;
            newSocket.onopen = socket.onopen;
            newSocket.onmessage = socket.onmessage;
            newSocket.onerror = socket.onerror;
            newSocket.onclose = socket.onclose;
          }
        }, 3000);
      } else {
        setIsJoined(false);
        setIsWaiting(false);
      }
    };
  }, [handleMessage]);

  // Join room
  const joinRoom = useCallback(
    (asHost = isHost) => {
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

    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    localStreamRef.current = null;

    // Stop screen share
    stopScreenShareInternal();

    // Close producers, consumers, transports
    producersRef.current.forEach((p) => p.close());
    producersRef.current.clear();
    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    screenProducerRef.current = null;
    hasProducedRef.current = false;

    setIsJoined(false);
    setIsWaiting(false);
    setRemoteStreams([]);
    setPeers([]);
    setWaitingPeers([]);
  }, [send, stopScreenShareInternal]);

  // Toggle video with producer pause/resume
  const toggleVideo = useCallback(
    (enabled: boolean) => {
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      producersRef.current.forEach((producer) => {
        if (producer.kind === "video" && !producer.appData?.isScreenShare) {
          if (enabled) producer.resume();
          else producer.pause();
        }
      });
    },
    [localStream],
  );

  // Toggle audio with producer pause/resume
  const toggleAudio = useCallback(
    (enabled: boolean) => {
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      producersRef.current.forEach((producer) => {
        if (producer.kind === "audio" && !producer.appData?.isScreenShare) {
          if (enabled) producer.resume();
          else producer.pause();
        }
      });
    },
    [localStream],
  );

  // Start producing local media (called once after join + transport ready)
  const startProducing = useCallback(async () => {
    if (hasProducedRef.current) return;
    if (
      !localStreamRef.current ||
      !deviceRef.current ||
      !sendTransportRef.current
    )
      return;

    hasProducedRef.current = true;
    const stream = localStreamRef.current;

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      await produceTrack(videoTrack, { isScreenShare: false });
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      await produceTrack(audioTrack, { isScreenShare: false });
    }
  }, [produceTrack]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    if (!sendTransportRef.current || !deviceRef.current) {
      setError("Cannot share screen: not connected to meeting.");
      return false;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 15 },
        },
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        setError("Failed to get screen share track.");
        return false;
      }

      // Handle user stopping via browser UI
      screenTrack.onended = () => {
        stopScreenShareInternal();
      };

      const producer = await produceTrack(screenTrack, {
        isScreenShare: true,
      });
      if (producer) {
        screenProducerRef.current = producer;
        setScreenStream(displayStream);
        setIsScreenSharing(true);
        return true;
      }
      return false;
    } catch (err) {
      const domErr = err as DOMException;
      if (domErr.name === "NotAllowedError") {
        // User cancelled — not an error
        return false;
      }
      console.error("Screen share error:", err);
      setError("Failed to start screen sharing.");
      return false;
    }
  }, [produceTrack, stopScreenShareInternal]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    stopScreenShareInternal();
  }, [stopScreenShareInternal]);

  // Cleanup on unmount
  useEffect(() => {
    const producers = producersRef.current;
    const consumers = consumersRef.current;
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      producers.forEach((p) => p.close());
      consumers.forEach((c) => c.close());
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      socketRef.current?.close();
    };
  }, []);

  return {
    isConnected,
    isJoined,
    isWaiting,
    isRejected,
    isHost: amIHost,
    localStream,
    screenStream,
    isScreenSharing,
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
    startScreenShare,
    stopScreenShare,
    approveJoin,
    rejectJoin,
  };
}
