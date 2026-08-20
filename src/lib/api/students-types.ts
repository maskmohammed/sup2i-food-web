export type Student = {
  id: string;
  fullName: string;
  photoUrl: string;
  foodPassCode: string;
  subscriptionActive: boolean;
  createdAt: string;
};

export type CreateStudentInput = {
  fullName: string;
  foodPassCode: string;
};
