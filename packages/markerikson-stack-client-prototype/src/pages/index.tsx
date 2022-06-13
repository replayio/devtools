import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

import { SessionContext } from "../contexts/SessionContext";
import { useContext } from "react";

import { useGetSourcesQuery } from "../app/api";

const IndexPage: NextPage = () => {
  const sessionData = useContext(SessionContext);

  const { data } = useGetSourcesQuery();

  return (
    <div className={styles.container}>
      <h1>Current user</h1>

      <div style={{ whiteSpace: "pre", fontFamily: "monospace", textAlign: "left" }}>
        {JSON.stringify(sessionData?.currentUserInfo, null, 2)}
      </div>
      <h2>Sources Entries</h2>
      <ul>
        {data?.map(entry => {
          return <li key={entry.sourceId}>{entry.url}</li>;
        })}
      </ul>
    </div>
  );
};

export default IndexPage;
