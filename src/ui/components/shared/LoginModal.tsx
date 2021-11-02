import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/Modal";

// import "./LoginModal.css";

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
        <div className="px-6 py-3 space-y-5">
          <div className="place-content-center">
            <img className="w-12 h-12 mx-auto" src="/images/logo.svg" />
          </div>
          <div className="text-center space-y-1.5">
            <div className="font-bold text-xl">Sign in required</div>
            <div className="text-lg">You need to be signed in to leave a comment</div>
          </div>
          <div className="flex items-center flex-col">
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
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
