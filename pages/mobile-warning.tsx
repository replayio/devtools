import ReplayLogo from "ui/components/shared/ReplayLogo";

export default function MobileWarningPage() {
  const onClick = () => {
    document.cookie = "mobile-warning-dismissed=true";
    location.replace("/");
    return false;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ReplayLogo color="gray" size="sm" />
      <div className="text-xl font-bold">Replay is designed for desktop displays.</div>
      <a className="font-bold underline" href="/" onClick={onClick}>
        Take me there anyway →
      </a>
    </div>
  );
}
