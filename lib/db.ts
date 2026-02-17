import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  Meeting as PrismaMeeting,
  Participant as PrismaParticipant,
} from "@/lib/generated/prisma/client";

// Singleton Prisma Client
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export types for backward compatibility
export type Meeting = PrismaMeeting;
export type Participant = PrismaParticipant;

export interface MeetingWithParticipants extends Meeting {
  participants: Participant[];
  participantCount?: number;
}

// Meeting queries
export const meetingQueries = {
  findMany: async (): Promise<MeetingWithParticipants[]> => {
    const meetings = await prisma.meeting.findMany({
      include: {
        participants: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return meetings.map((m: (typeof meetings)[number]) => ({
      ...m,
      participantCount: m._count.participants,
    }));
  },

  findByHostId: async (hostId: string): Promise<MeetingWithParticipants[]> => {
    const meetings = await prisma.meeting.findMany({
      where: { hostId },
      include: {
        participants: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return meetings.map((m: (typeof meetings)[number]) => ({
      ...m,
      participantCount: m._count.participants,
    }));
  },

  getStatsByHostId: async (hostId: string) => {
    const [total, active, completed, scheduled, totalParticipants] =
      await Promise.all([
        prisma.meeting.count({ where: { hostId } }),
        prisma.meeting.count({ where: { hostId, status: "active" } }),
        prisma.meeting.count({ where: { hostId, status: "ended" } }),
        prisma.meeting.count({
          where: { hostId, scheduledAt: { not: null }, status: "waiting" },
        }),
        prisma.participant.count({
          where: { meeting: { hostId } },
        }),
      ]);

    // Calculate total duration from ended meetings
    const endedMeetings = await prisma.meeting.findMany({
      where: {
        hostId,
        status: "ended",
        startedAt: { not: null },
        endedAt: { not: null },
      },
      select: { startedAt: true, endedAt: true },
    });

    const totalDurationMs = endedMeetings.reduce((acc, m) => {
      if (m.startedAt && m.endedAt) {
        return acc + (m.endedAt.getTime() - m.startedAt.getTime());
      }
      return acc;
    }, 0);

    const totalMinutes = Math.round(totalDurationMs / 60000);

    return {
      total,
      active,
      completed,
      scheduled,
      totalParticipants,
      totalMinutes,
      avgDuration: completed > 0 ? Math.round(totalMinutes / completed) : 0,
    };
  },

  findById: async (id: string): Promise<MeetingWithParticipants | null> => {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { participants: true },
    });
    return meeting ?? null;
  },

  findByInviteCode: async (
    code: string,
  ): Promise<MeetingWithParticipants | null> => {
    const meeting = await prisma.meeting.findUnique({
      where: { inviteCode: code },
      include: { participants: true },
    });
    return meeting ?? null;
  },

  findByInviteCodePreview: async (code: string) => {
    const meeting = await prisma.meeting.findUnique({
      where: { inviteCode: code },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        maxParticipants: true,
        _count: { select: { participants: true } },
      },
    });
    if (!meeting) return null;
    return {
      ...meeting,
      participantCount: meeting._count.participants,
    };
  },

  create: async (data: {
    title: string;
    description?: string | null;
    type?: string;
    maxParticipants?: number;
    enableRecording?: boolean;
    scheduledAt?: Date | null;
    hostId: string;
  }): Promise<Meeting> => {
    return prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: data.type ?? "video",
        maxParticipants: data.maxParticipants ?? 10,
        status: "waiting",
        hostId: data.hostId,
        enableRecording: data.enableRecording ?? true,
        scheduledAt: data.scheduledAt ?? null,
      },
    });
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      status: string;
      startedAt: Date;
      endedAt: Date;
    }>,
  ): Promise<Meeting | null> => {
    try {
      return await prisma.meeting.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await prisma.meeting.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};

// Participant queries
export const participantQueries = {
  create: async (data: {
    name: string;
    email?: string | null;
    isHost: boolean;
    meetingId: string;
  }): Promise<Participant> => {
    return prisma.participant.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        isHost: data.isHost,
        meetingId: data.meetingId,
      },
    });
  },

  findByMeetingId: async (meetingId: string): Promise<Participant[]> => {
    return prisma.participant.findMany({
      where: { meetingId },
    });
  },
};

export default prisma;
