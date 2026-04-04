export const EVENT_TYPES = {
    USER_REGISTERED: "user.registered",
    USER_UPDATED: "user.updated",
    USER_DELETED: "user.deleted",
    USER_DEACTIVATED: "user.deactivated",
    USER_REACTIVATED: "user.reactivated",
    USER_SHOP_OWNER_ROLE_GRANTED: "user.shop_owner_role_granted",
    USER_SHOP_APPLICATION_APPROVED: "user.shop_application_approved",
    SHOP_STATUS_CHANGED: "shop.status_changed",
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
