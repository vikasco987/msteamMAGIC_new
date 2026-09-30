import { useUser, useAuth } from "@clerk/nextjs";
import { useContext, useMemo } from "react";
import { UnifiedUserContext } from "@/app/ClientLayout";

export function useUnifiedAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { userId: clerkUserId, getToken } = useAuth();
  const unifiedUser = useContext(UnifiedUserContext);

  const mockGetToken = useMemo(() => async () => {
    try {
      const res = await fetch("/api/auth/custom/token");
      if (res.ok) {
        const data = await res.json();
        return data.token;
      }
    } catch (e) {
      console.error("Failed to fetch custom token", e);
    }
    return null;
  }, []);

  return useMemo(() => {
    if (clerkUser) {
      return { user: clerkUser, userId: clerkUserId, isLoaded: clerkLoaded, getToken };
    }

    if (unifiedUser) {
      const customUserId = unifiedUser.clerkId || unifiedUser.id;
      return {
        isLoaded: true,
        userId: customUserId,
        getToken: mockGetToken,
        user: {
          id: customUserId,
          publicMetadata: { role: unifiedUser.role },
          firstName: unifiedUser.firstName || "Custom",
          lastName: unifiedUser.lastName || "User",
          emailAddresses: [{ emailAddress: unifiedUser.email || "" }],
          primaryEmailAddress: { emailAddress: unifiedUser.email || "" },
          fullName: `${unifiedUser.firstName || "Custom"} ${unifiedUser.lastName || "User"}`,
        }
      };
    }

    return { user: null, userId: null, isLoaded: clerkLoaded, getToken: mockGetToken };
  }, [clerkUser, clerkUserId, clerkLoaded, getToken, unifiedUser, mockGetToken]);
}

export { useUnifiedAuth as useAuth };
