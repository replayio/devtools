import "@testing-library/jest-dom";

delete window.location;
window.location = new URL("http://localhost?recordingId=fake");
