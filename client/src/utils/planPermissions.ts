import type { Trip } from '@/types/trip';
import type { User } from '@/context/AuthContext';

/**
 * Checks if the current user can edit a specific plan
 * @param plan - The plan to check permissions for
 * @param user - The current logged-in user
 * @returns true if the user can edit the plan, false otherwise
 */
export const canEditPlan = (plan: Trip, user: User | null): boolean => {
  if (!user || !plan) {
    return false;
  }

  return plan.author === user.userId;
};

/**
 * Checks if the current user is the author of a plan
 * @param plan - The plan to check
 * @param user - The current logged-in user
 * @returns true if the user is the author, false otherwise
 */
export const isPlanAuthor = (plan: Trip, user: User | null): boolean => {
  if (!user || !plan) {
    return false;
  }

  return plan.author === user.userId;
};

/**
 * Gets the appropriate edit mode for a plan based on user permissions
 * @param requestedEditMode - The originally requested edit mode
 * @param plan - The plan to check permissions for
 * @param user - The current logged-in user
 * @returns The actual edit mode (true if user can edit, false otherwise)
 */
export const getActualEditMode = (
  requestedEditMode: boolean,
  plan: Trip,
  user: User | null,
): boolean => {
  if (!requestedEditMode) {
    return false; // If not requesting edit mode, return false
  }

  return canEditPlan(plan, user);
};
