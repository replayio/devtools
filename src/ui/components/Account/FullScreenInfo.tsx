import React, { ReactElement } from "react";
import "./FullScreenInfo.css";

export default function WelcomeScreen({
  header,
  children,
}: {
  header: string;
  children: ReactElement;
}) {
  return (
    <div className="full-screen-info">
      <main>
        <section className="content-container">
          <div className="header">
            <img className="logo" src="images/logo.svg" />
            <h1>{header}</h1>
          </div>
          <div className="content">{children}</div>
        </section>
        <section className="filler"></section>
      </main>
    </div>
  );
}
