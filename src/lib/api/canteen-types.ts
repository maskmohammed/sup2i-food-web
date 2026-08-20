// Student est géré côté Administration — voir students-types.ts (source
// de vérité unique, réexportée ici pour ne pas casser les imports
// existants depuis canteen-types).
export type { Student } from "./students-types";
import type { Student } from "./students-types";

export type MealType = "LUNCH" | "DINNER";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  LUNCH: "Déjeuner",
  DINNER: "Dîner",
};

export type MealUsage = {
  id: string;
  studentId: string;
  mealType: MealType;
  /** YYYY-MM-DD */
  date: string;
  distributedAt: string;
  distributedBy: string;
};

export type FoodPassLookupResult = {
  student: Student;
  subscriptionActive: boolean;
  alreadyUsedToday: Partial<Record<MealType, boolean>>;
};
