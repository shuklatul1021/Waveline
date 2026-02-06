import { NextRequest, NextResponse } from "next/server";
import { meetingQueries, participantQueries } from "@/lib/db";


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { name, email } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const meeting = await meetingQueries.findByInviteCode(code);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "ended") {
      return NextResponse.json({ error: "Meeting has ended" }, { status: 400 });
    }
    if (meeting.participants.length >= meeting.maxParticipants) {
      return NextResponse.json({ error: "Meeting is full" }, { status: 400 });
    }

    const participant = await participantQueries.create({
      name,
      email,
      meetingId: meeting.id,
      isHost: false,
    });

    if (meeting.status === "waiting") {
      await meetingQueries.update(meeting.id, {
        status: "active",
        startedAt: new Date(),
      });
    }

    return NextResponse.json(
      {
        participant,
        meeting: {
          id: meeting.id,
          title: meeting.title,
          type: meeting.type,
          status: "active",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error joining meeting:", error);
    return NextResponse.json(
      { error: "Failed to join meeting" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const meeting = await meetingQueries.findByInviteCodePreview(code);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      type: meeting.type,
      status: meeting.status,
      maxParticipants: meeting.maxParticipants,
      _count: { participants: Number(meeting.participantCount) },
    });
  } catch (error) {
    console.error("Error fetching meeting info:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting info" },
      { status: 500 },
    );
  }
}
