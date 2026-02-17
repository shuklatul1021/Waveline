import { NextRequest, NextResponse } from "next/server";
import { meetingQueries, participantQueries } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetings = await meetingQueries.findByHostId(session.user.id);
    return NextResponse.json(
      meetings.map((m) => ({
        ...m,
        _count: { participants: m.participantCount || m.participants.length },
      })),
    );
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      maxParticipants,
      enableRecording,
      scheduledAt,
      hostName,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const meeting = await meetingQueries.create({
      title,
      description,
      type: type || "video",
      maxParticipants: maxParticipants || 10,
      enableRecording: enableRecording ?? true,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      hostId: session.user.id,
    });

    const hostParticipant = await participantQueries.create({
      name: hostName || session.user.name || "Host",
      email: session.user.email,
      isHost: true,
      meetingId: meeting.id,
    });

    const inviteUrl = `/join/${meeting.inviteCode}`;

    return NextResponse.json(
      {
        ...meeting,
        participants: [hostParticipant],
        inviteUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 },
    );
  }
}
