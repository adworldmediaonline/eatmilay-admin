"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { defaultRoles, adminAc } from "better-auth/plugins/admin/access";

const roles = {
  ...defaultRoles,
  super_admin: adminAc,
};

// Client: same-origin (proxied) for first-party cookies. SSR/build: full backend URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005";
const baseURL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : `${apiUrl}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    emailOTPClient(),
    adminClient({ roles }),
  ],
});
