import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/NewModal";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "./Dialog";
import { PrimaryButton } from "./Button";

function LoginModal() {
  const { loginAndReturn } = useAuth0();

  return (
    <Modal>
      <Dialog style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}>
        <DialogLogo />
        <DialogTitle>Free Trial Expired</DialogTitle>
        <DialogDescription>
          This replay is unavailable because it was recorded after your team's free trial expired.
        </DialogDescription>
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
