import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Receipt from "./Receipt.jsx";
import "./index.css";

// Force service worker updates on boot if a new version is waiting
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[PWA] New content available, reloading page...");
            window.location.reload();
          }
        });
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/receipt" element={<Receipt />} />
        <Route path="/receipt/:id" element={<Receipt />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);