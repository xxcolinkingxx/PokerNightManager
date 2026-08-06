import { NextResponse } from "next/server";

import { submitRsvp } from "@/lib/invites/invite-store";
import { rsvpSchema } from "@/lib/invites/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid RSVP" }, {
      status: 400,
    });
  }

  try {
    const invite = await submitRsvp(id, parsed.data);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    return NextResponse.json(invite);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't submit your RSVP" },
      { status: 500 },
    );
  }
}
