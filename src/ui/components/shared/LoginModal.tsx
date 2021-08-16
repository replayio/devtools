import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/Modal";

import "./LoginModal.css";

function LoginModal() {
  const { loginWithRedirect } = useAuth0();

  const onClick: React.MouseEventHandler = e => {
    loginWithRedirect({
      redirectUri: window.location.origin,
      appState: { returnTo: window.location.href },
    });
  };

  return (
    <div className="login-modal">
      <Modal showClose={false}>
        <div className="px-8 py-4 space-y-6">
          <div className="place-content-center">
            <img className="w-16 h-16 mx-auto" src="/images/logo.svg" />
          </div>
          <div className="text-center space-y-2">
            <div className="font-bold text-2xl">Sign in required</div>
            <div className="text-xl">You need to be signed in to leave a comment</div>
          </div>
          <div className="flex items-center flex-col">
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
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
