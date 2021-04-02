import React from "react";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <main>
        <section className="content-container">
          <div className="header">
            <img className="logo" src="images/logo.svg" />
            <h1>Welcome to Replay!</h1>
          </div>
          <div className="content">
            <p>{`We're so glad you're here.`}</p>
            <p>{`See that big red button up there? When you press it, you'll begin recording the page you're on.`}</p>
            <p>{`Recordings should be less than one minute for best results. Take it for a spin now!`}</p>
          </div>
        </section>
        <section className="filler"></section>
      </main>
    </div>
  );
}
