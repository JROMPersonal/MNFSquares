// src/components/Grid.js
import React from "react";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const Grid = ({ players }) => {
  const [nfcNumbers] = React.useState(shuffleArray([...Array(10).keys()]));
  const [afcNumbers] = React.useState(shuffleArray([...Array(10).keys()]));
  const [shuffledPlayers] = React.useState(shuffleArray(players));

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Grid */}
      <table border="1" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>NFC\AFC</th>
            {afcNumbers.map((num) => (
              <th key={num} style={{ padding: "10px" }}>{num}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nfcNumbers.map((nfcNum, rowIndex) => (
            <tr key={nfcNum}>
              <td style={{ padding: "10px" }}>{nfcNum}</td>
              {afcNumbers.map((afcNum, colIndex) => {
                const playerIndex = rowIndex * 10 + colIndex;
                return (
                  <td key={afcNum} style={{ padding: "10px", textAlign: "center" }}>
                    {shuffledPlayers[playerIndex]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Grid;
