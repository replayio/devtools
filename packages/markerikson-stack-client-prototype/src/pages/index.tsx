import React, { Suspense, useContext } from "react";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

import { SessionContext } from "../contexts/SessionContext";

import Loader from "../components/Loader";
import { SourcesList } from "../features/sources/SourcesList";
import { SourceContent } from "../features/sources/SourceContent";

const IndexPage: NextPage = () => {
  const sessionData = useContext(SessionContext);
  const { currentUserInfo } = sessionData;

  return (
    <div className={styles.container}>
      <h2>Session</h2>
      <div>
        Session ID: <span title={sessionData.sessionId}>{sessionData.sessionId.slice(0, 8)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        User: {currentUserInfo?.name} <img src={currentUserInfo?.picture} height={24} />
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ minWidth: 300 }}>
          <h2>Sources Entries</h2>
          <Suspense fallback={<Loader />}>
            <SourcesList />
          </Suspense>
        </div>
        <div style={{ marginLeft: 10 }}>
          <h2>Source Contents</h2>
          <SourceContent />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
