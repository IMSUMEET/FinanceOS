type ParticipantTagProps = {
  name: string;
  isRegisteredUser: boolean;
};

export default function ParticipantTag({
  name,
  isRegisteredUser,
}: ParticipantTagProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-theme bg-surface px-3 py-1.5 text-sm font-semibold text-primary-theme">
      <span>{name}</span>
      {!isRegisteredUser ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
          !
        </span>
      ) : null}
    </div>
  );
}
