import React from "react";
import ReactCanvasConfetti from "react-canvas-confetti";

const canvasStyles = {
  position: "fixed",
  pointerEvents: "none",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  zIndex: 100,
};

export default class Realistic extends React.Component {
  constructor(props) {
    super(props);
    this.animationInstance = null;
  }

  makeShot = (particleRatio, opts) => {
    this.animationInstance &&
      this.animationInstance({
        ...opts,
        origin: { y: 0.1, x: 0.3 },
        particleCount: Math.floor(200 * particleRatio),
        colors: ["#01ACFD", "#F02D5E"],
      });
  };

  fire = () => {
    this.makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    this.makeShot(0.2, {
      spread: 60,
    });

    this.makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: "#000000, #330000",
    });

    this.makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: "#000000, #330000",
    });

    this.makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  getInstance = instance => {
    this.animationInstance = instance;
  };

  componentDidMount() {
    this.fire();
  }

  render = () => <ReactCanvasConfetti refConfetti={this.getInstance} style={canvasStyles} />;
}
