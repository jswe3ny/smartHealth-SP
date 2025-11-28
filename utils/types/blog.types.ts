import { Timestamp } from "@react-native-firebase/firestore";

// The structure of a single blog post document
export interface BlogPost {
  postId: string;
  authorId: string;
  authorName: string; // Denormalized for easy display
  authorAvatar?: string;
  isVerifiedOrg: boolean;
  title: string;
  content: string; // The full text
  summary?: string; // A short preview for the feed
  timestamp: Timestamp;
  imageUrl?: string; // Optional header image
}

// The structure of an Organization/Author profile
// (You might extend your existing User profile or keep this separate)
export interface AuthorProfile {
  uid: string;
  firstName: string;
  lastName: string;
  website: string;
  bio: string;
  joined: Timestamp;
  imageLink?: string;
}
