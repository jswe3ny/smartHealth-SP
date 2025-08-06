import { useAuth } from "@/utils/authContext";
import { Slot, useRouter } from "expo-router";

export default function RootLayout() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  return <Slot />;
}
