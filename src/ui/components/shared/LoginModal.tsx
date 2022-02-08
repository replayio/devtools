import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/Modal";

function LoginModal() {
  const { loginWithRedirect } = useAuth0();

  const onClick: React.MouseEventHandler = e => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname + window.location.search },
    });
  };

  return (
    <div className="login-modal">
      <Modal showClose={false}>
        <div className="space-y-5 px-6 py-3">
          <div className="place-content-center">
            <img className="mx-auto h-12 w-12" src="/images/logo.svg" />
          </div>
          <div className="space-y-1.5 text-center">
            <div className="text-xl font-bold">Sign in required</div>
            <div className="text-lg">You need to be signed in to leave a comment</div>
          </div>
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-lg font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LoginModal;
