import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

import Modal from "./NewModal";

function addLoomComment(loom: string) {
  return JSON.stringify({
    content: [
      {
        content: [{ text: loom, type: "text" }],
        type: "paragraph",
      },
    ],
    type: "doc",
  });
}

function NewAttachment({ hideModal, modalOptions }: PropsFromRedux) {
  const addCommentReply = hooks.useAddCommentReply();
  const [url, setUrl] = useState("");
  const loom = url.match(/loom\.com\/share\/(\S*?)(\"|\?|$)/)?.[1];

  const onChange = (e: any) => {
    setUrl(e.target.value);
  };

  const onSubmit = () => {
    if (loom && modalOptions?.comment) {
      const reply = { ...modalOptions.comment, content: addLoomComment(url) };
      addCommentReply(reply);
      hideModal();
    }
  };

  const color = !loom ? "bg-gray-300" : "bg-primaryAccent";

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div className="overflow-hidden rounded-lg bg-white" style={{ width: "600px" }}>
        <div className="width-full flex h-12 items-center bg-primaryAccent">
          <div className="img loom ml-3 mr-2" style={{ background: "white" }}></div>
          <div className="text-lg text-white">Add Loom url</div>
        </div>
        <div className="flex h-12 items-center pr-3">
          <form className="flex w-full" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="http://loom.com/share"
              onChange={onChange}
              value={url}
              className="align-center mr-3 h-9 flex-grow border-none text-gray-500 placeholder-gray-300 focus:ring-0"
            ></input>
            <button className={`${color} rounded-lg py-1 px-2 text-white`} onClick={onSubmit}>
              Save
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  {
    hideModal: actions.hideModal,
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewAttachment);
