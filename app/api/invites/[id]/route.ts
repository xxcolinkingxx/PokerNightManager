import { NextResponse } from "next/server";

import { getInvite } from "@/lib/invites/invite-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const invite = await getInvite(id);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    return NextResponse.json(invite);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't load the invite" },
      { status: 500 },
    );
  }
}
