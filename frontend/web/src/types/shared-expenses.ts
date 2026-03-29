export type Participant = {
  id: string;
  name: string;
  email?: string;
  isRegisteredUser: boolean;
  inviteStatus?: "not_invited" | "pending" | "accepted";
};

export type ExpenseSplit = {
  participantId: string;
  amount: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidByParticipantId: string;
  participantIds: string[];
  groupId?: string;
  createdAt: string;
  splits: ExpenseSplit[];
  note?: string;
};

export type Group = {
  id: string;
  name: string;
  participantIds: string[];
};

export type Settlement = {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  groupId?: string;
  createdAt: string;
};
