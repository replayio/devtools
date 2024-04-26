import { useRouter } from "next/router";

import { Button } from "replay-next/components/Button";
import Modal from "ui/components/shared/NewModal";

import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "./Dialog";

function LoginModal() {
  const router = useRouter();

  const loginAndReturn = () => {
    router.push({
      pathname: "/login",
      query: {
        returnTo: window.location.pathname + window.location.search,
      },
    });
  };

  return (
    <Modal>
      <Dialog style={{ animation: "linearFadeIn ease 200ms", width: 400 }}>
        <DialogLogo />
        <DialogTitle>Sign In Required</DialogTitle>
        <DialogDescription>You need to be signed in to leave a comment</DialogDescription>
        <DialogActions>
          <Button onClick={loginAndReturn}>Sign In</Button>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

export default LoginModal;
