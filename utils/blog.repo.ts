import { AuthorProfile, BlogPost } from "@/utils/types/blog.types";
import {
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
      ...docWrapper.data,
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

/**
 * Fetches all posts by a specific author.
 */
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
