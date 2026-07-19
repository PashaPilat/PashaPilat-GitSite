import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import '@fortawesome/fontawesome-free/css/all.min.css';
import "./styles/main.scss";

// восстановление пути после редиректа 404
const redirect = sessionStorage.getItem("redirect");
if (redirect) {
    sessionStorage.removeItem("redirect");
    window.history.replaceState(null, "", redirect);
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);

