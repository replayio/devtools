import { AvatarImage } from "ui/components/Avatar";
import { useGetUserInfo } from "ui/hooks/users";
import { logout } from "ui/utils/auth";

export function Personal() {
  const { name, email, picture } = useGetUserInfo();

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-4 border-b border-border py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-row items-center gap-3">
          <AvatarImage src={picture} className="avatar h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{name}</span> ({email})
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
