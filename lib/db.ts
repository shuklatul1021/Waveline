import { Pool, QueryResult, QueryResultRow } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to generate cuid-like IDs
export function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

// Database query helper
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

// Types
export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  maxParticipants: number;
  status: string;
  hostId: string;
  inviteCode: string;
  enableRecording: boolean;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  isHost: boolean;
  joinedAt: Date;
  leftAt: Date | null;
  meetingId: string;
}

export interface MeetingWithParticipants extends Meeting {
  participants: Participant[];
  participantCount?: number;
}

// Meeting queries
export const meetingQueries = {
  findMany: async (): Promise<MeetingWithParticipants[]> => {
    const result = await query<Meeting>(`
            SELECT m.*, 
                   (SELECT COUNT(*) FROM participants p WHERE p."meetingId" = m.id) as "participantCount"
            FROM meetings m 
            ORDER BY m."createdAt" DESC
        `);

    // Get participants for each meeting
    const meetings: MeetingWithParticipants[] = [];
    for (const meeting of result.rows) {
      const participants = await query<Participant>(
        'SELECT * FROM participants WHERE "meetingId" = $1',
        [meeting.id],
      );
      meetings.push({
        ...meeting,
        participants: participants.rows,
      });
    }
    return meetings;
  },

  findById: async (id: string): Promise<MeetingWithParticipants | null> => {
    const result = await query<Meeting>(
      "SELECT * FROM meetings WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0) return null;

    const participants = await query<Participant>(
      'SELECT * FROM participants WHERE "meetingId" = $1',
      [id],
    );
    return {
      ...result.rows[0],
      participants: participants.rows,
    };
  },

  findByInviteCode: async (
    code: string,
  ): Promise<MeetingWithParticipants | null> => {
    const result = await query<Meeting>(
      'SELECT * FROM meetings WHERE "inviteCode" = $1',
      [code],
    );
    if (result.rows.length === 0) return null;

    const participants = await query<Participant>(
      'SELECT * FROM participants WHERE "meetingId" = $1',
      [result.rows[0].id],
    );
    return {
      ...result.rows[0],
      participants: participants.rows,
    };
  },

  findByInviteCodePreview: async (code: string) => {
    const result = await query<Meeting & { participantCount: number }>(
      `
            SELECT m.id, m.title, m.type, m.status, m."maxParticipants",
                   (SELECT COUNT(*) FROM participants p WHERE p."meetingId" = m.id) as "participantCount"
            FROM meetings m
            WHERE m."inviteCode" = $1
        `,
      [code],
    );
    return result.rows[0] || null;
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
    const id = generateId();
    const inviteCode = generateId();
    const now = new Date();

    const result = await query<Meeting>(
      `
            INSERT INTO meetings (
                id, title, description, type, "maxParticipants", status, 
                "hostId", "inviteCode", "enableRecording", "scheduledAt", 
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `,
      [
        id,
        data.title,
        data.description || null,
        data.type || "video",
        data.maxParticipants || 10,
        "waiting",
        data.hostId,
        inviteCode,
        data.enableRecording ?? true,
        data.scheduledAt || null,
        now,
        now,
      ],
    );

    return result.rows[0];
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
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.startedAt !== undefined) {
      setClauses.push(`"startedAt" = $${paramIndex++}`);
      values.push(data.startedAt);
    }
    if (data.endedAt !== undefined) {
      setClauses.push(`"endedAt" = $${paramIndex++}`);
      values.push(data.endedAt);
    }

    values.push(id);
    const result = await query<Meeting>(
      `UPDATE meetings SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await query("DELETE FROM meetings WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
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
    const id = generateId();

    const result = await query<Participant>(
      `
            INSERT INTO participants (id, name, email, "isHost", "meetingId", "joinedAt")
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *
        `,
      [id, data.name, data.email || null, data.isHost, data.meetingId],
    );

    return result.rows[0];
  },

  findByMeetingId: async (meetingId: string): Promise<Participant[]> => {
    const result = await query<Participant>(
      'SELECT * FROM participants WHERE "meetingId" = $1',
      [meetingId],
    );
    return result.rows;
  },
};

export default pool;
