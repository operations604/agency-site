import { createRoot } from "react-dom/client";
// Latin subsets only, and only the weights the page actually uses.
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter-tight/latin-600.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
