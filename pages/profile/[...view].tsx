import { useRouter } from "next/router";
import React, { FC, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import Account from "ui/components/Account";
import useAuth0 from "ui/utils/useAuth0";

const ProfilePage: FC<PropsFromRedux> = ({ setModal }) => {
  const { isAuthenticated } = useAuth0();
  const { query, replace } = useRouter();

  const [modal] = Array.isArray(query.view) ? query.view : [query.view];

  useEffect(() => {
    if (isAuthenticated && modal === "settings") {
      setModal("settings", { view: "preferences" });
      replace("/");
    }
  }, [isAuthenticated, modal, setModal, replace]);

  return <Account />;
};

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ProfilePage);
