import Logo from "../common/Logo";
import NavbarActions from "../common/NavbarActions";

function Navbar() {
  return (
    <header className="px-4 md:px-6 xl:px-8 pt-5 pb-4">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex items-center justify-between rounded-[28px] border border-white/60 bg-white/55 px-5 py-4 backdrop-blur-xl shadow-[0_20px_40px_rgba(37,99,235,0.08)] md:px-7">
          <Logo />
          <NavbarActions />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
