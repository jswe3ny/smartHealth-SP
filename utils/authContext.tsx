import { getApp } from "@react-native-firebase/app";
import {
  createUserWithEmailAndPassword,
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "@react-native-firebase/auth";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext<{
  accountSignIn: (email: string, password: string) => Promise<void>;
  accountSignUp: (email: string, password: string) => Promise<void>;

  accountSignOut: () => Promise<void>;
  currentUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
}>({
  accountSignIn: async () => {},
  accountSignOut: async () => {},
  accountSignUp: async () => {},
  currentUser: null,
  isLoading: false,
});

// Thi

export function AuthProvider({ children }: PropsWithChildren) {
  // ... state and useEffect remain the same
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const app = getApp();
  const auth = getAuth(app);

  // This effect listens for real-time authentication changes from Firebase
  useEffect(() => {
    // const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (user: FirebaseAuthTypes.User | null) => {
        console.log("user: " + user?.email);
        setCurrentUser(user);
        setIsLoading(false);
      }
    );
    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, [auth]);

  const accountSignIn = async (email: string, password: string) => {
    console.log("sign in attempt");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign-in error:", error);
      // Re-throw the error so the UI can catch it and display a message
      throw error;
    }
  };

  const accountSignUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign-up error:", error);
      // Re-throw for the UI
      throw error;
    }
  };

  const accountSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      // Re-throw for the UI
      throw error;
    }
  };

  const value = {
    currentUser,
    accountSignIn,
    accountSignUp,
    accountSignOut,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
