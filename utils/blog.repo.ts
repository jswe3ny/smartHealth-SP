import { AuthorProfile, BlogPost } from "@/utils/types/blog.types";
import { getAuth } from "@react-native-firebase/auth";
import { Timestamp } from "@react-native-firebase/firestore";
import {
  add,
  getCollection,
  getDocWithId,
  listenCollection,
  QueryOptions,
} from "./firestore-helpers";

const POSTS_COLLECTION = "posts";
const USERS_COLLECTION = "user";

// --- FEED LOGIC ---

export const subscribeToMainFeed = (onUpdate: (posts: BlogPost[]) => void) => {
  const options: QueryOptions = {
    orderBy: [{ field: "timestamp", dir: "desc" }],
    limit: 20,
  };

  return listenCollection<BlogPost>(POSTS_COLLECTION, options, (docs) => {
    const posts = docs.map((docWrapper) => ({
      ...docWrapper.data, // The content (title, content, etc.)
      postId: docWrapper.id,
    }));

    onUpdate(posts);
  });
};

// --- POST DETAILS LOGIC ---
export const getPostDetails = async (
  postId: string
): Promise<BlogPost | null> => {
  const path = `${POSTS_COLLECTION}/${postId}`;

  const doc = await getDocWithId<BlogPost>(path);

  if (!doc) return null;
  return { ...doc.data, postId: doc.id };
};

// --- AUTHOR PROFILE LOGIC ---

/**
 * Fetches an author's profile data.
 */
export const getAuthorProfile = async (
  authorId: string
): Promise<AuthorProfile | null> => {
  const path = `${USERS_COLLECTION}/${authorId}`;

  const doc = await getDocWithId<AuthorProfile>(path);

  if (!doc) return null;
  return { ...doc.data, uid: doc.id };
};

export const getPostsByAuthor = async (
  authorId: string
): Promise<BlogPost[]> => {
  const options: QueryOptions = {
    where: [{ field: "authorId", op: "==", value: authorId }],
    orderBy: [{ field: "timestamp", dir: "desc" }],
  };

  const docs = await getCollection<BlogPost>(POSTS_COLLECTION, options);

  return docs.map((doc) => ({ ...doc.data, postId: doc.id }));
};

// --- CREATION LOGIC ---

export const createPost = async (
  title: string,
  content: string,
  isVerified: boolean
) => {
  const currentUser = getAuth().currentUser;
  if (!currentUser) throw new Error("Must be logged in");

  // Enforce verification rule
  if (!isVerified) {
    throw new Error("Only verified organizations can post.");
  }

  const newPost: Omit<BlogPost, "postId"> = {
    authorId: currentUser.uid,
    authorName: currentUser.displayName || "Unknown Org",
    isVerifiedOrg: isVerified,
    title,
    content,
    // Create a simple summary from the first 100 characters
    summary: content.length > 100 ? content.substring(0, 100) + "..." : content,
    timestamp: Timestamp.now(),
  };

  // Uses the `add` helper directly
  return add(POSTS_COLLECTION, newPost);
};
