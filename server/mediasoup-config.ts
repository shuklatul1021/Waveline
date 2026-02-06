import { types as mediasoupTypes } from 'mediasoup'

// MediaSoup configuration for the SFU server
export const config = {
    // Listen settings for the server
    listenIp: '0.0.0.0',
    listenPort: 3001,

    // MediaSoup worker settings
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: 'warn' as mediasoupTypes.WorkerLogLevel,
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
        ] as mediasoupTypes.WorkerLogTag[],
    },

    // Router media codecs
    router: {
        mediaCodecs: [
            {
                kind: 'audio' as const,
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: 'video' as const,
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as const,
                mimeType: 'video/VP9',
                clockRate: 90000,
                parameters: {
                    'profile-id': 2,
                    'x-google-start-bitrate': 1000,
                },
            },
            {
                kind: 'video' as const,
                mimeType: 'video/H264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000,
                },
            },
        ] as mediasoupTypes.RtpCodecCapability[],
    },

    // WebRTC transport settings
    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: '127.0.0.1', // Replace with public IP in production
            },
        ],
        maxIncomingBitrate: 1500000,
        initialAvailableOutgoingBitrate: 1000000,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    },
}

export type MediasoupConfig = typeof config
