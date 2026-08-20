export type Student = {
  id: string;
  fullName: string;
  photoUrl: string;
  foodPassCode: string;
};

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
