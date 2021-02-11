import React, { useState } from "react";
import { isDeployPreview } from "ui/utils/environment";
import "./UserOptions.css";
import { UserButton, useUser } from "@clerk/clerk-react";

export default function UserOptions() {
  // const [expanded, setExpanded] = useState(false);
  const user = useUser();

  if (isDeployPreview()) {
    return null;
  }

  if (!user) {
    // TODO: Clerk.dev
    return "login"; // <LoginButton />;
  }

  return <UserButton />;
  // const buttonContent = <Avatar player={user} isFirstPlayer={true} />;

  // return (
  //   <div className="user-options">
  //     <Dropdown
  //       buttonContent={buttonContent}
  //       setExpanded={setExpanded}
  //       expanded={expanded}
  //       orientation="bottom"
  //     >
  //       <div className="user row">
  //         <div className="user-avatar">
  //           <Avatar player={user} isFirstPlayer={true} />
  //         </div>
  //         <div className="user-info">
  //           <div className="user-name">{user.fullName}</div>
  //           <div className="user-email">
  //             {user.primaryEmailAddress && user.primaryEmailAddress.emailAddress}
  //           </div>
  //         </div>
  //       </div>

  //       <div className="row clickable logout">
  //         <LoginButton />
  //       </div>
  //     </Dropdown>
  //   </div>
  // );
}
