import { useLocation } from "react-router-dom";
import NavbarActions from "../common/NavbarActions";
import ProfileMenu from "../common/ProfileMenu";
import ThemeToggle from "../common/ThemeToggle";

function Topbar() {
  const { pathname } = useLocation();
  const isMinimal = pathname === "/house-sale" || pathname === "/upload";

  return (
    <header className="relative z-30 shrink-0 px-4 pt-4 pb-2 md:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-end gap-3">
        {isMinimal ? null : (
          <>
            <ThemeToggle />
            <NavbarActions />
            <ProfileMenu />
          </>
        )}
      </div>
    </header>
  );
}

export default Topbar;
