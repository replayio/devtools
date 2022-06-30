import { useRouter } from "next/router";
import { useEffect } from "react";
import { setModal } from "ui/actions/app";
import { useAppDispatch } from "ui/setup/hooks";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";

export function SettingsHandler() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const {
      query: { settings },
    } = router;

    if (settings) {
      dispatch(setModal("workspace-settings", settings ? { view: settings as string } : null));
    }
  }, [dispatch, router]);

  return null;
}
