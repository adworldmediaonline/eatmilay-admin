"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { defaultRoles, adminAc } from "better-auth/plugins/admin/access";

const roles = {
  ...defaultRoles,
  super_admin: adminAc,
};

// Use same-origin /api/auth (proxied to backend) for cross-domain cookie support
export const authClient = createAuthClient({
  baseURL: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    emailOTPClient(),
    adminClient({ roles }),
  ],
});
