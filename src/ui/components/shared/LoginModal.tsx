import React from "react";
import Modal from "ui/components/shared/NewModal";
import useAuth0 from "ui/utils/useAuth0";

import { PrimaryButton } from "./Button";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "./Dialog";

function LoginModal() {
  const { loginAndReturn } = useAuth0();

  return (
    <Modal>
      <Dialog style={{ animation: "linearFadeIn ease 200ms", width: 400 }}>
        <DialogLogo />
        <DialogTitle>Sign In Required</DialogTitle>
        <DialogDescription>You need to be signed in to leave a comment</DialogDescription>
        <DialogActions>
          <PrimaryButton color="blue" onClick={loginAndReturn}>
            Sign In
          </PrimaryButton>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

export default LoginModal;
