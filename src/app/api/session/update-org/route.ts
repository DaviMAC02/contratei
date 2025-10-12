import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // Verify user has access to this org
    const membership = await prisma.orgMember.findFirst({
      where: {
        userId: session.user.id,
        orgId: orgId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Note: NextAuth doesn't support updating JWT directly from API routes
    // We need to use the update method on the client side
    return NextResponse.json({ success: true, orgId });
  } catch (error) {
    console.error("Error updating org in session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
