// app/api/register/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const organizationName = String(body.organizationName || "").trim();

  if (!name || !email || !password || !organizationName) {
    return NextResponse.json(
      { message: "Name, email, password, and organization name are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "A user with this email already exists." },
      { status: 409 }
    );
  }

  const baseSlug = createSlug(organizationName);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: organizationName,
              slug,
            },
          },
        },
      },
    },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      organization: user.memberships[0].organization,
    },
    { status: 201 }
  );
}