import { AvatarImage } from "ui/components/Avatar";
import { useGetUserInfo } from "ui/hooks/users";
import { logout } from "ui/utils/auth";

export function Personal() {
  const { name, email, picture } = useGetUserInfo();

  return (
    <div className="space-y-12">
      <div className="flex flex-row items-center space-x-3">
        <AvatarImage src={picture} className="avatar w-12 rounded-full" />
        <div>
          <div className="text-base">{name}</div>
          <div className="text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => logout()}
          className="max-w-max items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
