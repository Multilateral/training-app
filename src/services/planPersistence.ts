import AsyncStorage from '@react-native-async-storage/async-storage';

export const DELETED_PLANS_KEY = '@deleted_plan_ids';

/**
 * Get all plan IDs marked as deleted by the user.
 */
export async function getDeletedPlanIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Mark a plan ID as permanently deleted so it never resurrects from static data.
 */
export async function markPlanAsDeleted(planId: string): Promise<void> {
  try {
    const existing = await getDeletedPlanIds();
    if (!existing.includes(planId)) {
      const updated = [...existing, planId];
      await AsyncStorage.setItem(DELETED_PLANS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[planPersistence] Error marking plan as deleted:', err);
  }
}

/**
 * Restore a plan ID if needed.
 */
export async function restorePlan(planId: string): Promise<void> {
  try {
    const existing = await getDeletedPlanIds();
    const updated = existing.filter((id) => id !== planId);
    await AsyncStorage.setItem(DELETED_PLANS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[planPersistence] Error restoring plan:', err);
  }
}
