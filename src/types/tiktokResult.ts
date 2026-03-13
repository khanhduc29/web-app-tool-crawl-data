export type ScanType =
  | "users"
  | "relations"
  | "creator_by_region"
  | "video_comments"
  | "top_posts"


export type ScanResult<T> = {
  scan_type: ScanType | null;
  items: T[];
};