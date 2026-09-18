export const ROLES = ["ADVERTISER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const CREATIVE_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;
export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];
