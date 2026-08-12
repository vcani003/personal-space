import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Order matters and is the only global CSS import in the project.
//   fonts  — @font-face only, so faces are known before anything asks for them
//   tokens — custom properties, so base.css can consume them
//   base   — reset and document defaults
// Everything after this point is a colocated CSS Module.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";

import { App } from "./App";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Missing #root element in index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
