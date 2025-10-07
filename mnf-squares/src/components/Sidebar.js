// src/components/Sidebar.js
import React from "react";

const Sidebar = ({ players }) => {
  return (
    <div style={{ marginLeft: "20px" }}>
      <h3>Player List</h3>
      <ol>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ol>
    </div>
  );
};

export default Sidebar;
