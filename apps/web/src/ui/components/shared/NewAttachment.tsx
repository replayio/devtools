import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Modal from "./NewModal";

function addLoomComment(loom: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: loom }],
      },
    ],
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
      <div className="rounded-lg overflow-hidden bg-white" style={{ width: "600px" }}>
        <div className="bg-primaryAccent h-12 width-full flex items-center">
          <div className="img loom ml-3 mr-2" style={{ background: "white" }}></div>
          <div className="text-white text-lg">Add Loom url</div>
        </div>
        <div className="h-12 flex items-center pr-3">
          <form className="flex w-full" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="http://loom.com/share"
              onChange={onChange}
              value={url}
              className="border-none h-9 align-center flex-grow text-gray-500 placeholder-gray-300 mr-3 focus:ring-0"
            ></input>
            <button className={`${color} text-white py-1 px-2 rounded-lg`} onClick={onSubmit}>
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
    setModal: actions.setModal,
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewAttachment);
