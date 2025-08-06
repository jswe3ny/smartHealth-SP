import { useAuth } from "@/utils/authContext"; // Your auth context hook
import firestore from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

export const useUserInfo = () => {
  const { currentUser, isLoading } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // check that user is signed in
    if (!currentUser) {
      return;
    }

    // basic firestore connection
    const userId = currentUser.uid;
    const fetchUserInfo = async () => {
      const userInfo = await firestore().collection("user").doc(userId).get();
      console.log("user: ", userInfo.data());
      console.log("userId: ", userId);
    };

    fetchUserInfo();
  }, [currentUser]);

  return { currentUser };
};
