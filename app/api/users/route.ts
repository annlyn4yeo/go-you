import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: body.email,
    },
  });

  return NextResponse.json(user);
}
