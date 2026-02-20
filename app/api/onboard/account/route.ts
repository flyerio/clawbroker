import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  // Check if user already exists by clerk_user_id
  const { data: existingUser } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (existingUser) {
    return NextResponse.json({ appUserId: existingUser.app_user_id });
  }

  // Check if email already exists (e.g. from CoBroker parent app)
  const { data: byEmail } = await supabase
    .from("user_identity_map")
    .select("app_user_id")
    .eq("email", email)
    .single();

  if (byEmail) {
    // Email exists with a different clerk_user_id — link it
    await supabase
      .from("user_identity_map")
      .update({ clerk_user_id: userId, updated_at: new Date().toISOString() })
      .eq("app_user_id", byEmail.app_user_id);

    return NextResponse.json({ appUserId: byEmail.app_user_id });
  }

  // Create new user
  const appUserId = crypto.randomUUID();
  const { error: insertErr } = await supabase
    .from("user_identity_map")
    .insert({
      app_user_id: appUserId,
      clerk_user_id: userId,
      email,
      user_type: "standard",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertErr) {
    console.error("user_identity_map insert error:", insertErr);
    return NextResponse.json(
      { error: "Failed to create user record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ appUserId });
}
