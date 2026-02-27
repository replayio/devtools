/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React from "react";

interface IModalProps {
  additionalClass: string;
  children: React.ReactNode;
  handleClose: () => void;
  width: string | number;
  status?: string;
}

interface ISlideProps extends IModalProps {
  in: boolean | undefined;
}

export const Modal = ({ additionalClass, children, handleClose, status, width }: IModalProps) => {
  const onClick = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="modal-wrapper" onClick={handleClose}>
      <div
        style={{
          width,
        }}
        className={classnames("modal", additionalClass, status)}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
};

export default function Slide({
  width = "50%",
  in: inProp,
  children,
  additionalClass,
  handleClose,
}: ISlideProps) {
  return (
    <Modal
      width={width}
      status={inProp ? "entered" : "exited"}
      additionalClass={additionalClass}
      handleClose={handleClose}
    >
      {children}
    </Modal>
  );
}
