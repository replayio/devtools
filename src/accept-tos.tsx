import React from "react";
import { combineReducers, applyMiddleware } from "redux";
import classNames from "classnames";
const LogRocket = require("ui/utils/logrocket").default;
const configureStore = require("devtools/client/debugger/src/actions/utils/create-store").default;
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
import reducer from "ui/reducers/app";
import hooks from "ui/hooks";
import Modal from "ui/components/shared/NewModal";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id")!;

function AcceptTOSScreen() {
  const acceptTOS = hooks.useAcceptTOS();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await acceptTOS({ variables: { version: 1 } });
    window.onbeforeunload = null;
    document.location.reload();
  };

  return (
    <div
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <Modal>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-lg space-y-12 relative flex flex-col justify-between"
          style={{ width: "520px" }}
        >
          <h2 className="font-bold text-3xl text-gray-900">Terms of Service</h2>
          <form className="space-y-6" onSubmit={e => onSubmit(e)}>
            <label className="block text-sm uppercase font-semibold ">
              Please accept our Terms of Service
            </label>
            <input
              type="submit"
              value="Accept"
              className={classNames(
                "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccentHover justify-center cursor-pointer",
                "text-white bg-primaryAccent hover:bg-primaryAccentHover"
              )}
            ></input>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export async function initialize() {
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  const createStore = configureStore();
  const store = createStore(combineReducers({ app: reducer }), {}, middleware);
  store.dispatch({ type: "setup_app", recordingId });

  return { store, Page: AcceptTOSScreen };
}
