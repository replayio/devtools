import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

import { SessionContext } from "../contexts/SessionContext";
import { useContext } from "react";

const IndexPage: NextPage = () => {
  const sessionData = useContext(SessionContext);

  return (
    <div className={styles.container}>
      <h1>Empty Page</h1>
      Current user:
      <div style={{ whiteSpace: "pre", fontFamily: "monospace", textAlign: "left" }}>
        {JSON.stringify(sessionData?.currentUserInfo, null, 2)}
      </div>
    </div>
  );
};

export default IndexPage;
