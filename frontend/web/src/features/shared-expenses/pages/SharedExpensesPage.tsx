import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import SectionCard from "../../../shared/ui/SectionCard";
import StatCard from "../../../shared/ui/StatCard";
import ParticipantTag from "../components/ParticipantTag";
import {
  createExpense,
  createGroup,
  createParticipant,
  getGroups,
  getParticipants,
  getUngroupedExpenses,
} from "../services";

export default function SharedExpensesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [selectedParticipantIdsForGroup, setSelectedParticipantIdsForGroup] =
    useState<string[]>([]);
  const [newGroupParticipantName, setNewGroupParticipantName] = useState("");

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedExpenseParticipantIds, setSelectedExpenseParticipantIds] =
    useState<string[]>([]);
  const [paidByParticipantId, setPaidByParticipantId] = useState("");
  const [newExpenseParticipantName, setNewExpenseParticipantName] =
    useState("");

  const {
    data: groups = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: getParticipants,
  });

  const { data: ungroupedExpenses = [] } = useQuery({
    queryKey: ["ungrouped-expenses"],
    queryFn: getUngroupedExpenses,
  });

  // Robust current-user detection
  const youParticipant = useMemo(() => {
    return (
      participants.find(
        (participant) =>
          participant.name.trim().toLowerCase() === "you" &&
          participant.isRegisteredUser,
      ) ??
      participants.find(
        (participant) => participant.name.trim().toLowerCase() === "you",
      ) ??
      participants.find((participant) => participant.isRegisteredUser) ??
      null
    );
  }, [participants]);

  const selectableParticipantsForExpense = useMemo(() => {
    if (!youParticipant) return participants;
    return participants.filter(
      (participant) => participant.id !== youParticipant.id,
    );
  }, [participants, youParticipant]);

  const selectedExpenseParticipants = useMemo(() => {
    return participants.filter((participant) =>
      selectedExpenseParticipantIds.includes(participant.id),
    );
  }, [participants, selectedExpenseParticipantIds]);

  const createParticipantMutation = useMutation({
    mutationFn: createParticipant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: async (newGroup) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      setGroupName("");
      setSelectedParticipantIdsForGroup(
        youParticipant ? [youParticipant.id] : [],
      );
      setNewGroupParticipantName("");
      setIsCreateGroupOpen(false);
      navigate(`/shared-expenses/groups/${newGroup.id}`);
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ungrouped-expenses"] });
      if (selectedGroupId) {
        await queryClient.invalidateQueries({
          queryKey: ["group-expenses", selectedGroupId],
        });
      }

      setExpenseTitle("");
      setExpenseAmount("");
      setSelectedGroupId("");
      setSelectedExpenseParticipantIds(
        youParticipant ? [youParticipant.id] : [],
      );
      setPaidByParticipantId(youParticipant?.id ?? "");
      setNewExpenseParticipantName("");
      setIsAddExpenseOpen(false);
    },
  });

  // Always include You in create-group modal
  useEffect(() => {
    if (!isCreateGroupOpen || !youParticipant) return;

    setSelectedParticipantIdsForGroup((prev) =>
      prev.includes(youParticipant.id) ? prev : [youParticipant.id, ...prev],
    );
  }, [isCreateGroupOpen, youParticipant]);

  // Always include You in add-expense modal
  useEffect(() => {
    if (!isAddExpenseOpen || !youParticipant) return;

    setSelectedExpenseParticipantIds((prev) =>
      prev.includes(youParticipant.id) ? prev : [youParticipant.id, ...prev],
    );

    setPaidByParticipantId((prev) => prev || youParticipant.id);
  }, [isAddExpenseOpen, youParticipant]);

  // When group changes, sync participants to that group + You
  useEffect(() => {
    if (!isAddExpenseOpen) return;
    if (!youParticipant) return;

    if (!selectedGroupId) {
      setSelectedExpenseParticipantIds([youParticipant.id]);
      setPaidByParticipantId(youParticipant.id);
      return;
    }

    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const nextParticipantIds = Array.from(
      new Set([youParticipant.id, ...group.participantIds]),
    );

    setSelectedExpenseParticipantIds(nextParticipantIds);

    if (!nextParticipantIds.includes(paidByParticipantId)) {
      setPaidByParticipantId(youParticipant.id);
    }
  }, [
    selectedGroupId,
    groups,
    isAddExpenseOpen,
    youParticipant,
    paidByParticipantId,
  ]);

  function toggleGroupParticipant(participantId: string) {
    if (participantId === youParticipant?.id) return;

    setSelectedParticipantIdsForGroup((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  }

  function toggleExpenseParticipant(participantId: string) {
    if (participantId === youParticipant?.id) return;

    setSelectedExpenseParticipantIds((prev) => {
      const next = prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId];

      // Keep You always included
      const ensured = youParticipant
        ? next.includes(youParticipant.id)
          ? next
          : [youParticipant.id, ...next]
        : next;

      if (!ensured.includes(paidByParticipantId)) {
        setPaidByParticipantId(youParticipant?.id ?? "");
      }

      return ensured;
    });
  }

  async function handleAddNewGroupParticipant() {
    const trimmed = newGroupParticipantName.trim();
    if (!trimmed) return;

    const created = await createParticipantMutation.mutateAsync({
      name: trimmed,
      isRegisteredUser: false,
    });

    setSelectedParticipantIdsForGroup((prev) => [...prev, created.id]);
    setNewGroupParticipantName("");
  }

  async function handleAddNewExpenseParticipant() {
    const trimmed = newExpenseParticipantName.trim();
    if (!trimmed) return;

    const created = await createParticipantMutation.mutateAsync({
      name: trimmed,
      isRegisteredUser: false,
    });

    setSelectedExpenseParticipantIds((prev) => {
      const next = [...prev, created.id];
      return youParticipant && !next.includes(youParticipant.id)
        ? [youParticipant.id, ...next]
        : next;
    });

    setNewExpenseParticipantName("");
  }

  function handleCreateGroup() {
    if (!groupName.trim()) return;
    if (selectedParticipantIdsForGroup.length < 2) return;

    createGroupMutation.mutate({
      name: groupName.trim(),
      participantIds: selectedParticipantIdsForGroup,
    });
  }

  function handleCreateExpense() {
    if (!expenseTitle.trim() || !expenseAmount || !paidByParticipantId) return;
    if (selectedExpenseParticipantIds.length < 2) return;

    const numericAmount = Number(expenseAmount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return;

    const participantCount = selectedExpenseParticipantIds.length;
    const baseSplit = Number((numericAmount / participantCount).toFixed(2));

    const splits = selectedExpenseParticipantIds.map(
      (participantId, index) => ({
        participantId,
        amount:
          index === participantCount - 1
            ? Number(
                (numericAmount - baseSplit * (participantCount - 1)).toFixed(2),
              )
            : baseSplit,
      }),
    );

    createExpenseMutation.mutate({
      title: expenseTitle.trim(),
      amount: numericAmount,
      paidByParticipantId,
      participantIds: selectedExpenseParticipantIds,
      groupId: selectedGroupId || undefined,
      splits,
    });
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Module"
          title="Shared Expenses 🍕"
          description="Track group expenses, balances, and settlements in a way that feels cleaner and friendlier than Splitwise."
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsCreateGroupOpen(true)}
              >
                Create Group
              </Button>
              <Button onClick={() => setIsAddExpenseOpen(true)}>
                Add Expense
              </Button>
            </>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="You are owed"
            value="$482"
            hint="Across 6 open expenses"
            icon="🫶"
            tone="accent"
          />
          <StatCard
            label="You owe"
            value="$96"
            hint="Across 2 groups"
            icon="💸"
            tone="blue"
          />
          <StatCard
            label="Active groups"
            value={String(groups.length)}
            hint="Tracked shared spaces"
            icon="👥"
            tone="teal"
          />
          <StatCard
            label="One-time expenses"
            value={String(ungroupedExpenses.length)}
            hint="No group required"
            icon="🎯"
            tone="amber"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <SectionCard
            title="Recent groups"
            subtitle="Your most active shared spaces"
            action={<Badge tone="accent">Live</Badge>}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-theme bg-surface p-4"
                  >
                    <div className="h-5 w-32 rounded bg-surface-muted" />
                    <div className="mt-3 h-4 w-20 rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon="⚠️"
                title="Could not load groups"
                description="Something went wrong while loading your shared groups."
              />
            ) : groups.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No groups yet"
                description="Create your first group to start tracking shared expenses."
                action={
                  <Button onClick={() => setIsCreateGroupOpen(true)}>
                    Create Group
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      navigate(`/shared-expenses/groups/${group.id}`)
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-theme bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div>
                      <p className="font-bold text-primary-theme">
                        {group.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-theme">
                        {group.participantIds.length} people
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-secondary-theme">
                      View group →
                    </p>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Quick actions"
            subtitle="Fast entry for common tasks"
          >
            <div className="grid gap-3">
              <Button fullWidth onClick={() => setIsAddExpenseOpen(true)}>
                Add a shared expense
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setIsCreateGroupOpen(true)}
              >
                Create a group
              </Button>
              <Button fullWidth variant="ghost">
                Invite participants
              </Button>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="One-time expense feed"
          subtitle="Expenses that are not tied to a group"
        >
          {ungroupedExpenses.length === 0 ? (
            <EmptyState
              icon="⛳"
              title="No one-time expenses yet"
              description="Things like Top Golf, one-off dinners, or a quick Uber split can live here without needing a group."
              action={
                <Button onClick={() => setIsAddExpenseOpen(true)}>
                  Add one-time expense
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {ungroupedExpenses.map((expense) => {
                const payer = participants.find(
                  (participant) =>
                    participant.id === expense.paidByParticipantId,
                );

                return (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-theme bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-primary-theme">
                          {expense.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-theme">
                          Paid by {payer?.name ?? "Unknown"} ·{" "}
                          {new Date(expense.createdAt).toLocaleDateString()}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {expense.participantIds.map((participantId) => {
                            const participant = participants.find(
                              (p) => p.id === participantId,
                            );
                            if (!participant) return null;

                            return (
                              <ParticipantTag
                                key={participant.id}
                                name={participant.name}
                                isRegisteredUser={participant.isRegisteredUser}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-lg font-black text-primary-theme">
                        ${expense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-theme bg-surface-strong p-6 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-theme">
                  Create group
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-primary-theme">
                  New shared group
                </h2>
                <p className="mt-2 text-secondary-theme">
                  You are always included. Add anyone else you want to split
                  with.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="rounded-2xl border border-theme bg-surface px-4 py-2 text-sm font-semibold text-secondary-theme"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary-theme">
                  Group name
                </label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Cloud, Goa Trip, Roommates..."
                  className="w-full rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-primary-theme">
                  Existing participants
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {participants.map((participant) => {
                    const checked = selectedParticipantIdsForGroup.includes(
                      participant.id,
                    );
                    const isYou = participant.id === youParticipant?.id;

                    return (
                      <button
                        key={participant.id}
                        type="button"
                        onClick={() => toggleGroupParticipant(participant.id)}
                        disabled={isYou}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                          checked
                            ? "border-transparent bg-accent-soft text-accent"
                            : "border-theme bg-surface text-primary-theme hover:bg-surface-muted",
                          isYou ? "cursor-default opacity-80" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {participant.name}
                          </span>
                          {!participant.isRegisteredUser ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                              !
                            </span>
                          ) : null}
                        </div>
                        <span>{checked ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-primary-theme">
                  Add new participant
                </label>
                <div className="flex gap-3">
                  <input
                    value={newGroupParticipantName}
                    onChange={(e) => setNewGroupParticipantName(e.target.value)}
                    placeholder="Yash"
                    className="flex-1 rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleAddNewGroupParticipant}
                    disabled={
                      createParticipantMutation.isPending ||
                      !newGroupParticipantName.trim()
                    }
                  >
                    Add Person
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedParticipantIdsForGroup.map((participantId) => {
                  const participant = participants.find(
                    (p) => p.id === participantId,
                  );
                  if (!participant) return null;

                  return (
                    <ParticipantTag
                      key={participant.id}
                      name={participant.name}
                      isRegisteredUser={participant.isRegisteredUser}
                    />
                  );
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateGroupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={
                    createGroupMutation.isPending ||
                    !groupName.trim() ||
                    selectedParticipantIdsForGroup.length < 2
                  }
                >
                  {createGroupMutation.isPending
                    ? "Creating..."
                    : "Create Group"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAddExpenseOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-theme bg-surface-strong p-6 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-theme">
                  Add expense
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-primary-theme">
                  New shared expense
                </h2>
                <p className="mt-2 text-secondary-theme">
                  You are always part of the expense. A group is optional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="rounded-2xl border border-theme bg-surface px-4 py-2 text-sm font-semibold text-secondary-theme"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary-theme">
                  Expense title
                </label>
                <input
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Top Golf, dinner, Uber..."
                  className="w-full rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-primary-theme">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="84"
                    className="w-full rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-primary-theme">
                    Optional group
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                  >
                    <option value="">No group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-primary-theme">
                  Participants
                </label>

                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedExpenseParticipants.map((participant) => (
                    <ParticipantTag
                      key={participant.id}
                      name={participant.name}
                      isRegisteredUser={participant.isRegisteredUser}
                    />
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {selectableParticipantsForExpense.map((participant) => {
                    const checked = selectedExpenseParticipantIds.includes(
                      participant.id,
                    );

                    return (
                      <button
                        key={participant.id}
                        type="button"
                        onClick={() => toggleExpenseParticipant(participant.id)}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                          checked
                            ? "border-transparent bg-accent-soft text-accent"
                            : "border-theme bg-surface text-primary-theme hover:bg-surface-muted",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {participant.name}
                          </span>
                          {!participant.isRegisteredUser ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                              !
                            </span>
                          ) : null}
                        </div>
                        <span>{checked ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-3">
                  <input
                    value={newExpenseParticipantName}
                    onChange={(e) =>
                      setNewExpenseParticipantName(e.target.value)
                    }
                    placeholder="Add person by name"
                    className="flex-1 rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleAddNewExpenseParticipant}
                    disabled={
                      createParticipantMutation.isPending ||
                      !newExpenseParticipantName.trim()
                    }
                  >
                    Add Person
                  </Button>
                </div>

                <p className="mt-2 text-sm text-muted-theme">
                  You are included automatically. People not on FinanceOS show a
                  red warning until invited.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-primary-theme">
                  Paid by
                </label>
                <select
                  value={paidByParticipantId}
                  onChange={(e) => setPaidByParticipantId(e.target.value)}
                  className="w-full rounded-2xl border border-theme bg-surface px-4 py-3 outline-none"
                >
                  <option value="">Select payer</option>
                  {selectedExpenseParticipants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-theme bg-surface p-4 text-sm text-secondary-theme">
                Split style for now:{" "}
                <span className="font-bold text-primary-theme">
                  equal split
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsAddExpenseOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  disabled={
                    createExpenseMutation.isPending ||
                    !expenseTitle.trim() ||
                    !expenseAmount ||
                    selectedExpenseParticipantIds.length < 2 ||
                    !paidByParticipantId
                  }
                >
                  {createExpenseMutation.isPending
                    ? "Adding..."
                    : "Add Expense"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
