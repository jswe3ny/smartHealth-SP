import { useAuth } from "@/utils/authContext";
import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  useEffect(() => {
    if (!currentUser && !isLoading) {
      router.replace("/");
    }
  }, [currentUser, isLoading, router]);

  return <Slot />;
}
