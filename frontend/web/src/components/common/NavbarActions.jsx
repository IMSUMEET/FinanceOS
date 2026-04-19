import { Bell, Settings, ChevronDown } from "lucide-react";
import avatar from "../../assets/avatar.png";

function IconButton({ children }) {
  return (
    <button className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition-all duration-200 hover:bg-slate-100 hover:shadow-md active:scale-95">

      {/* subtle hover glow */}
      <span className="absolute inset-0 rounded-full bg-blue-500/0 transition group-hover:bg-blue-500/10" />

      <div className="relative z-10 text-slate-600 group-hover:text-blue-600 transition">
        {children}
      </div>
    </button>
  );
}

function NavbarActions() {
  return (
    <div className="flex items-center gap-3">

      {/* Notifications */}
      <IconButton>
        <Bell size={18} />
      </IconButton>

      {/* Settings */}
      <IconButton>
        <Settings size={18} />
      </IconButton>

      {/* Profile */}
      <div className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:bg-slate-50 cursor-pointer">

        <div className="relative">
          <img
            src={avatar}
            alt="profile"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
          />

          {/* online indicator */}
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
        </div>

        <div className="hidden md:block leading-tight">
          <p className="text-sm font-semibold text-slate-900">
            Abraham Smith
          </p>
          <p className="text-xs text-slate-500">User</p>
        </div>

        <ChevronDown
          size={16}
          className="text-slate-400 transition group-hover:text-slate-700"
        />
      </div>
    </div>
  );
}

export default NavbarActions;
