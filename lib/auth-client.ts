"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { defaultRoles, adminAc } from "better-auth/plugins/admin/access";

const roles = {
  ...defaultRoles,
  super_admin: adminAc,
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005";

export const authClient = createAuthClient({
  baseURL: `${apiUrl}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    emailOTPClient(),
    adminClient({ roles }),
  ],
});
