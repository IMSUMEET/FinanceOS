import avatarBoy from "../../assets/avatar-boy.png";

function AvatarCard() {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/70 px-3 py-2 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
      <div className="relative">
        <div className="h-14 w-14 overflow-hidden rounded-[16px] bg-gradient-to-br from-orange-100 to-amber-100">
          <img src={avatarBoy} alt="Finance assistant" className="h-full w-full object-cover" />
        </div>
        <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
      </div>

      <div className="hidden sm:block leading-tight">
        <p className="text-sm font-bold text-slate-900">Finance Buddy</p>
        <p className="text-xs text-slate-500">Ready to analyze</p>
      </div>
    </div>
  );
}

export default AvatarCard;
