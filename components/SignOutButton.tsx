"use client";

import { signOut } from "next-auth/react";

// Drop the offline copy of Train first, so the next person on this phone never sees it.
// A blocked Cache API (storage disabled, some private modes) must never stop the log out itself.
async function logOut() {
  try {
    for (const key of await caches.keys()) await (await caches.open(key)).delete("/app");
  } catch {}
  await signOut({ callbackUrl: "/" });
}

export default function SignOutButton() {
  return (
    <button type="button" onClick={logOut} className="btn w-full">
      Log out
    </button>
  );
}
