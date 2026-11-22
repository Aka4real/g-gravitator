import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  getAuthenticatedAdmin,
  hashPassword,
  setAdminSessionCookie,
  verifyPassword,
} from "@/lib/auth/admin-auth";
import {
  appendAuditLog,
  consumeAdminInvite,
  createAdminUser,
  getAdminUserByEmail,
  listAdminUsers,
  updateAdminLastLogin,
} from "@/lib/db/repository";

export async function GET() {
  const [user, users] = await Promise.all([
    getAuthenticatedAdmin(),
    listAdminUsers(),
  ]);
  const hasAdmins = users.length > 0;
  const signupKeySet = Boolean(process.env.ADMIN_SIGNUP_KEY?.trim());
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    hasAdmins,
    requiresInviteCode: hasAdmins || signupKeySet,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "login" | "signup" | "logout";
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      inviteCode?: string;
    };

    if (body.action === "logout") {
      await clearAdminSessionCookie();
      return NextResponse.json({ ok: true, authenticated: false });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (body.action === "signup") {
      const name = (body.name || "").trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Full name must be at least 2 characters." },
          { status: 400 }
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Enter a valid email address." },
          { status: 400 }
        );
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 }
        );
      }
      if (body.confirmPassword !== password) {
        return NextResponse.json(
          { error: "Passwords do not match." },
          { status: 400 }
        );
      }

      const existing = await getAdminUserByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: "An admin account with this email already exists." },
          { status: 409 }
        );
      }

      const allUsers = await listAdminUsers();
      const signupKey = process.env.ADMIN_SIGNUP_KEY?.trim();
      const mustVerifyCode = allUsers.length > 0 || Boolean(signupKey);

      if (mustVerifyCode) {
        const providedCode = (body.inviteCode || "").trim();
        const matchesEnvKey = Boolean(signupKey && providedCode === signupKey);
        const consumedInvite = !matchesEnvKey
          ? await consumeAdminInvite(providedCode, email)
          : false;
        if (!matchesEnvKey && !consumedInvite) {
          return NextResponse.json(
            {
              error:
                "A valid admin invite code is required to register an additional operator account.",
            },
            { status: 403 }
          );
        }
      }

      const role = allUsers.length === 0 ? "SUPER_ADMIN" : "ADMIN";
      const created = await createAdminUser({
        email,
        name,
        password_hash: hashPassword(password),
        role,
      });

      const sessionUser = {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
      };
      await setAdminSessionCookie(sessionUser);
      await appendAuditLog({
        actor_type: "admin",
        actor_label: created.email,
        action: "admin_signup",
        entity_type: "admin_users",
        entity_id: created.id,
        summary: `Registered ${created.role} account (${created.email})`,
        status: "ok",
      });

      return NextResponse.json(
        { ok: true, authenticated: true, user: sessionUser },
        { status: 201 }
      );
    }

    // Default: login
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await getAdminUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await updateAdminLastLogin(user.id);
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    await setAdminSessionCookie(sessionUser);
    await appendAuditLog({
      actor_type: "admin",
      actor_label: user.email,
      action: "admin_login",
      entity_type: "admin_users",
      entity_id: user.id,
      summary: `Signed in (${user.email})`,
      status: "ok",
    });

    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: sessionUser,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication request failed." },
      { status: 500 }
    );
  }
}
