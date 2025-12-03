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

/**
 * Author/Organization profile structure
 * Must match the user document structure in Firebase
 * 
 * Required fields:
 * - firstName: Author's first name
 * - lastName: Author's last name
 * - bio: Short biography/description
 * - website: Organization website URL
 * - joined: Timestamp when author joined
 * 
 * Optional fields:
 * - imageLink: Profile photo URL
 */
export interface AuthorProfile {
  uid: string;
  firstName: string;
  lastname: string; // Note: lowercase to match Firebase schema
  bio: string;
  website: string;
  joined: Timestamp;
  imageLink?: string; // Optional profile photo
}
