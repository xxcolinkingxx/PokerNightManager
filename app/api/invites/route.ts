import { NextResponse } from "next/server";

import { createInvite } from "@/lib/invites/invite-store";
import { createInviteSchema } from "@/lib/invites/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid invite" }, {
      status: 400,
    });
  }

  try {
    const invite = await createInvite(parsed.data);
    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't create the invite" },
      { status: 500 },
    );
  }
}
