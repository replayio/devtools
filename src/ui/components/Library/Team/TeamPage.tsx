import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { setModal } from "ui/actions/app";
import { useAppDispatch } from "ui/setup/hooks";
import { useGetTeamRouteParams } from "ui/utils/library";
import { TeamContext, MY_LIBRARY_TEAM, TeamContextRoot, MyLibraryContainer } from "./TeamContext";
import { ViewPage } from "./View/ViewPage";

export function TeamPage() {
  const dispatch = useAppDispatch();
  const { teamId } = useGetTeamRouteParams();
  const router = useRouter();

  // Check for ?settings="router" query parameter.
  useEffect(() => {
    const {
      query: { settings },
    } = router;

    if (settings) {
      dispatch(setModal("workspace-settings", settings ? { view: settings as string } : null));
    }
  }, [dispatch, router]);

  if (teamId === MY_LIBRARY_TEAM.id) {
    return (
      <MyLibraryContainer>
        <TeamContent />
      </MyLibraryContainer>
    );
  }

  return (
    <TeamContextRoot>
      <TeamContent />
    </TeamContextRoot>
  );
}

function TeamContent() {
  const { team } = useContext(TeamContext);
  return <ViewPage defaultView={team?.isTest ? "runs" : "recordings"} />;
}
