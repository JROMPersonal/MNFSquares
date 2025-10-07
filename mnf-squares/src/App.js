// src/App.js
import React from "react";
import Grid from "./components/Grid";
import Sidebar from "./components/Sidebar";
import { players } from "./players";

function App() {
  return (
    <div style={{ display: "flex", padding: "20px" }}>
      <Grid players={players} />
      <Sidebar players={players} />
    </div>
  );
}

export default App;
