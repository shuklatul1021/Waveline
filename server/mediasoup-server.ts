import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as mediasoup from "mediasoup";
import { types as mediasoupTypes } from "mediasoup";
import { config } from "./mediasoup-config";

// Types
interface Peer {
  id: string;
  name: string;
  socket: WebSocket;
  transports: Map<string, mediasoupTypes.WebRtcTransport>;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
  isHost: boolean;
}

interface WaitingPeer {
  id: string;
  name: string;
  socket: WebSocket;
}

interface Room {
  id: string;
  router: mediasoupTypes.Router;
  peers: Map<string, Peer>;
  waitingPeers: Map<string, WaitingPeer>;
  hostId: string | null;
}

// State
let worker: mediasoupTypes.Worker;
const rooms = new Map<string, Room>();

// Create mediasoup worker
async function createWorker(): Promise<mediasoupTypes.Worker> {
  const newWorker = await mediasoup.createWorker({
    rtcMinPort: config.worker.rtcMinPort,
    rtcMaxPort: config.worker.rtcMaxPort,
    logLevel: config.worker.logLevel,
    logTags: config.worker.logTags,
  });

  newWorker.on("died", () => {
    console.error("mediasoup worker died, exiting...");
    process.exit(1);
  });

  console.log("MediaSoup worker created");
  return newWorker;
}

// Get or create room
async function getOrCreateRoom(roomId: string): Promise<Room> {
  let room = rooms.get(roomId);
  if (!room) {
    const router = await worker.createRouter({
      mediaCodecs: config.router.mediaCodecs,
    });
    room = {
      id: roomId,
      router,
      peers: new Map(),
      waitingPeers: new Map(),
      hostId: null,
    };
    rooms.set(roomId, room);
    console.log(`Room ${roomId} created`);
  }
  return room;
}

// Create WebRTC transport
async function createWebRtcTransport(router: mediasoupTypes.Router) {
  const transport = await router.createWebRtcTransport({
    listenIps: config.webRtcTransport.listenIps,
    enableUdp: config.webRtcTransport.enableUdp,
    enableTcp: config.webRtcTransport.enableTcp,
    preferUdp: config.webRtcTransport.preferUdp,
    initialAvailableOutgoingBitrate:
      config.webRtcTransport.initialAvailableOutgoingBitrate,
  });

  if (config.webRtcTransport.maxIncomingBitrate) {
    await transport.setMaxIncomingBitrate(
      config.webRtcTransport.maxIncomingBitrate,
    );
  }

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };
}

// Send message to peer
function send(socket: WebSocket, type: string, data: unknown) {
  socket.send(JSON.stringify({ type, data }));
}

// Broadcast to all peers in room except sender
function broadcast(room: Room, senderId: string, type: string, data: unknown) {
  room.peers.forEach((peer, peerId) => {
    if (peerId !== senderId && peer.socket.readyState === WebSocket.OPEN) {
      send(peer.socket, type, data);
    }
  });
}

// Handle WebSocket messages
async function handleMessage(
  socket: WebSocket,
  message: string,
  peerId: string,
) {
  try {
    const { type, data } = JSON.parse(message);

    switch (type) {
      case "joinRoom": {
        const { roomId, name, isHost } = data;
        const room = await getOrCreateRoom(roomId);

        // If this is the host joining (first person or explicitly set as host)
        if (isHost || room.peers.size === 0) {
          const peer: Peer = {
            id: peerId,
            name,
            socket,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
            isHost: true,
          };
          room.peers.set(peerId, peer);
          room.hostId = peerId;

          send(socket, "roomJoined", {
            roomId,
            peerId,
            isHost: true,
            rtpCapabilities: room.router.rtpCapabilities,
            existingProducers: [],
            peers: [],
            waitingPeers: Array.from(room.waitingPeers.values()).map((p) => ({
              id: p.id,
              name: p.name,
            })),
          });

          console.log(`Host ${peerId} (${name}) joined room ${roomId}`);
        } else {
          // Non-host: add to waiting room and request permission
          const waitingPeer: WaitingPeer = { id: peerId, name, socket };
          room.waitingPeers.set(peerId, waitingPeer);

          send(socket, "waitingForApproval", { roomId, peerId });

          // Notify host of the permission request
          const host = room.hostId ? room.peers.get(room.hostId) : null;
          if (host && host.socket.readyState === WebSocket.OPEN) {
            send(host.socket, "permissionRequest", { peerId, name });
          }

          console.log(
            `Peer ${peerId} (${name}) waiting for approval in room ${roomId}`,
          );
        }
        break;
      }

      case "approveJoin": {
        const { roomId, requestPeerId } = data;
        const room = rooms.get(roomId);
        const hostPeer = room?.peers.get(peerId);

        if (!room || !hostPeer || !hostPeer.isHost) {
          send(socket, "error", { message: "Not authorized" });
          return;
        }

        const waitingPeer = room.waitingPeers.get(requestPeerId);
        if (!waitingPeer) {
          send(socket, "error", { message: "Peer not found in waiting room" });
          return;
        }

        // Remove from waiting and add to peers
        room.waitingPeers.delete(requestPeerId);

        const peer: Peer = {
          id: requestPeerId,
          name: waitingPeer.name,
          socket: waitingPeer.socket,
          transports: new Map(),
          producers: new Map(),
          consumers: new Map(),
          isHost: false,
        };
        room.peers.set(requestPeerId, peer);

        // Get existing peers' producers for consuming
        const existingProducers: {
          peerId: string;
          producerId: string;
          kind: string;
        }[] = [];
        room.peers.forEach((p, pId) => {
          if (pId !== requestPeerId) {
            p.producers.forEach((producer) => {
              existingProducers.push({
                peerId: pId,
                producerId: producer.id,
                kind: producer.kind,
              });
            });
          }
        });

        // Notify the approved peer
        send(waitingPeer.socket, "roomJoined", {
          roomId,
          peerId: requestPeerId,
          isHost: false,
          rtpCapabilities: room.router.rtpCapabilities,
          existingProducers,
          peers: Array.from(room.peers.values())
            .filter((p) => p.id !== requestPeerId)
            .map((p) => ({ id: p.id, name: p.name, isHost: p.isHost })),
          waitingPeers: [],
        });

        // Broadcast to all peers about new peer
        broadcast(room, requestPeerId, "newPeer", {
          peerId: requestPeerId,
          name: waitingPeer.name,
          isHost: false,
        });

        console.log(
          `Peer ${requestPeerId} (${waitingPeer.name}) approved to join room ${roomId}`,
        );
        break;
      }

      case "rejectJoin": {
        const { roomId, requestPeerId } = data;
        const room = rooms.get(roomId);
        const hostPeer = room?.peers.get(peerId);

        if (!room || !hostPeer || !hostPeer.isHost) {
          send(socket, "error", { message: "Not authorized" });
          return;
        }

        const waitingPeer = room.waitingPeers.get(requestPeerId);
        if (!waitingPeer) return;

        room.waitingPeers.delete(requestPeerId);
        send(waitingPeer.socket, "joinRejected", { roomId });

        console.log(`Peer ${requestPeerId} rejected from room ${roomId}`);
        break;
      }

      case "createTransport": {
        const { roomId, direction } = data;
        const room = rooms.get(roomId);
        const peer = room?.peers.get(peerId);
        if (!room || !peer) return;

        const { transport, params } = await createWebRtcTransport(room.router);
        peer.transports.set(transport.id, transport);

        send(socket, "transportCreated", { direction, ...params });
        break;
      }

      case "connectTransport": {
        const { roomId, transportId, dtlsParameters } = data;
        const room = rooms.get(roomId);
        const peer = room?.peers.get(peerId);
        const transport = peer?.transports.get(transportId);
        if (!transport) return;

        await transport.connect({ dtlsParameters });
        send(socket, "transportConnected", { transportId });
        break;
      }

      case "produce": {
        const { roomId, transportId, kind, rtpParameters } = data;
        const room = rooms.get(roomId);
        const peer = room?.peers.get(peerId);
        const transport = peer?.transports.get(transportId);
        if (!room || !peer || !transport) return;

        const producer = await transport.produce({ kind, rtpParameters });
        peer.producers.set(producer.id, producer);

        producer.on("transportclose", () => {
          producer.close();
          peer.producers.delete(producer.id);
        });

        send(socket, "produced", { producerId: producer.id });
        broadcast(room, peerId, "newProducer", {
          peerId,
          producerId: producer.id,
          kind,
        });
        break;
      }

      case "consume": {
        const { roomId, producerId, rtpCapabilities } = data;
        const room = rooms.get(roomId);
        const peer = room?.peers.get(peerId);
        if (!room || !peer) return;

        // Find the producer
        let producer: mediasoupTypes.Producer | undefined;
        let producerPeerId: string | undefined;
        room.peers.forEach((p, pId) => {
          const found = p.producers.get(producerId);
          if (found) {
            producer = found;
            producerPeerId = pId;
          }
        });
        if (!producer || !producerPeerId) return;

        // Check if can consume
        if (!room.router.canConsume({ producerId, rtpCapabilities })) {
          console.error("Cannot consume", producerId);
          return;
        }

        // Find receive transport
        let recvTransport: mediasoupTypes.WebRtcTransport | undefined;
        peer.transports.forEach((t) => {
          if (t.appData.direction === "recv" || !recvTransport) {
            recvTransport = t;
          }
        });
        if (!recvTransport) return;

        const consumer = await recvTransport.consume({
          producerId,
          rtpCapabilities,
          paused: false,
        });
        peer.consumers.set(consumer.id, consumer);

        consumer.on("transportclose", () => {
          consumer.close();
          peer.consumers.delete(consumer.id);
        });

        consumer.on("producerclose", () => {
          send(socket, "consumerClosed", { consumerId: consumer.id });
          consumer.close();
          peer.consumers.delete(consumer.id);
        });

        send(socket, "consumed", {
          consumerId: consumer.id,
          producerId,
          producerPeerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
        break;
      }

      case "leaveRoom": {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (!room) return;

        cleanupPeer(room, peerId);
        break;
      }
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
}

// Cleanup peer resources
function cleanupPeer(room: Room, peerId: string) {
  // Check if peer is in waiting room
  if (room.waitingPeers.has(peerId)) {
    room.waitingPeers.delete(peerId);
    console.log(`Waiting peer ${peerId} left room ${room.id}`);
    return;
  }

  const peer = room.peers.get(peerId);
  if (!peer) return;

  const wasHost = peer.isHost;

  peer.consumers.forEach((consumer) => consumer.close());
  peer.producers.forEach((producer) => producer.close());
  peer.transports.forEach((transport) => transport.close());
  room.peers.delete(peerId);

  broadcast(room, peerId, "peerLeft", { peerId });
  console.log(`Peer ${peerId} left room ${room.id}`);

  // If host left, promote another peer or close room
  if (wasHost && room.peers.size > 0) {
    const newHost = room.peers.values().next().value;
    if (newHost) {
      newHost.isHost = true;
      room.hostId = newHost.id;
      broadcast(room, "", "hostChanged", {
        newHostId: newHost.id,
        newHostName: newHost.name,
      });
      console.log(`New host: ${newHost.name} (${newHost.id})`);
    }
  }

  // Clean up empty rooms
  if (room.peers.size === 0 && room.waitingPeers.size === 0) {
    room.router.close();
    rooms.delete(room.id);
    console.log(`Room ${room.id} closed`);
  }
}

// Main
async function main() {
  worker = await createWorker();

  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    const peerId = `peer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log(`New connection: ${peerId}`);

    send(socket, "welcome", { peerId });

    socket.on("message", (message) => {
      handleMessage(socket, message.toString(), peerId);
    });

    socket.on("close", () => {
      // Find and cleanup peer from all rooms (including waiting room)
      rooms.forEach((room) => {
        if (room.peers.has(peerId) || room.waitingPeers.has(peerId)) {
          cleanupPeer(room, peerId);
        }
      });
    });
  });

  server.listen(config.listenPort, () => {
    console.log(
      `MediaSoup signaling server running on port ${config.listenPort}`,
    );
  });
}

main().catch(console.error);
