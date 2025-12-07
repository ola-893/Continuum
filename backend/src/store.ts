// backend/src/store.ts

interface Store {
    activityLog: Record<string, any[]>;
    spendCaps: Record<string, number>;
}

export const store: Store = {
    activityLog: {},
    spendCaps: {},
};
