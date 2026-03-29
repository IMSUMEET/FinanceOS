import type { Expense, Group, Participant, Settlement } from "../types";

export const mockParticipants: Participant[] = [
  {
    id: "p1",
    name: "You",
    isRegisteredUser: true,
    inviteStatus: "accepted",
  },
  {
    id: "p2",
    name: "Aman",
    isRegisteredUser: true,
    inviteStatus: "accepted",
  },
  {
    id: "p3",
    name: "Riya",
    isRegisteredUser: true,
    inviteStatus: "accepted",
  },
  {
    id: "p4",
    name: "Sam",
    isRegisteredUser: false,
    inviteStatus: "not_invited",
  },
];

export const mockGroups: Group[] = [
  {
    id: "g1",
    name: "Roommates",
    participantIds: ["p1", "p2", "p3", "p4"],
  },
  {
    id: "g2",
    name: "Seattle Foodies",
    participantIds: ["p1", "p2", "p3"],
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "e1",
    title: "Pizza Party",
    amount: 48.2,
    paidByParticipantId: "p1",
    groupId: "g2",
    participantIds: ["p1", "p2", "p3"],
    createdAt: "2026-03-08T10:00:00Z",
    splits: [
      { participantId: "p1", amount: 16.07 },
      { participantId: "p2", amount: 16.07 },
      { participantId: "p3", amount: 16.06 },
    ],
  },
  {
    id: "e2",
    title: "Groceries",
    amount: 96,
    paidByParticipantId: "p2",
    groupId: "g1",
    participantIds: ["p1", "p2", "p3", "p4"],
    createdAt: "2026-03-06T18:30:00Z",
    splits: [
      { participantId: "p1", amount: 24 },
      { participantId: "p2", amount: 24 },
      { participantId: "p3", amount: 24 },
      { participantId: "p4", amount: 24 },
    ],
  },
  {
    id: "e3",
    title: "Top Golf",
    amount: 84,
    paidByParticipantId: "p1",
    participantIds: ["p1", "p4"],
    createdAt: "2026-03-09T18:00:00Z",
    splits: [
      { participantId: "p1", amount: 42 },
      { participantId: "p4", amount: 42 },
    ],
  },
];

export const mockSettlements: Settlement[] = [
  {
    id: "s1",
    fromParticipantId: "p3",
    toParticipantId: "p1",
    amount: 16.06,
    groupId: "g2",
    createdAt: "2026-03-08T21:00:00Z",
  },
];
