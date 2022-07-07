import React, { Suspense, useContext } from "react";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

import { SessionContext } from "../contexts/SessionContext";
import { useAppSelector } from "src/app/hooks";

import Loader from "../components/Loader";
import { SourcesTree } from "../features/sourcesTree/SourcesTree";
import { SourceContent } from "../features/sources/SourceContent";
import { SelectedLocationHits } from "../features/sources/SelectedLocationHits";
import { SelectedPointStackFrames } from "../features/sources/SelectedPointStackFrames";

const IndexPage: NextPage = () => {
  const sessionData = useContext(SessionContext);
  const selectedSourceId = useAppSelector(state => state.selectedSources.selectedSourceId);
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
            <SourcesTree />
          </Suspense>
        </div>
        <div style={{ marginLeft: 10 }}>
          <h2>Source Contents</h2>
          <SourceContent key={selectedSourceId} />
        </div>
        <div style={{ marginLeft: 10 }}>
          <SelectedLocationHits />
        </div>
        <div style={{ marginLeft: 10 }}>
          <SelectedPointStackFrames />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
