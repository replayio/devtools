import React from "react";
import ReactCanvasConfetti from "react-canvas-confetti";

const canvasStyles = {
  height: "100%",
  left: 0,
  pointerEvents: "none",
  position: "fixed",
  top: 0,
  width: "100%",
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
        colors: ["#01ACFD", "#F02D5E"],
        origin: { x: 0.3, y: 0.1 },
        particleCount: Math.floor(200 * particleRatio),
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
      colors: "#000000, #330000",
      decay: 0.91,
      scalar: 0.8,
      spread: 100,
    });

    this.makeShot(0.1, {
      colors: "#000000, #330000",
      decay: 0.92,
      scalar: 1.2,
      spread: 120,
      startVelocity: 25,
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
