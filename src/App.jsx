import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function FootballSquares() {
  const [squares, setSquares] = useState(Array(100).fill(null));
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSquares, setNewPlayerSquares] = useState('');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [rowNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [colNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && newPlayerSquares) {
      const squareCount = parseInt(newPlayerSquares);
      if (squareCount > 0) {
        setPlayers([...players, { name: newPlayerName.trim(), squares: squareCount }]);
        setNewPlayerName('');
        setNewPlayerSquares('');
      }
    }
  };

  const handleRemovePlayer = (index) => {
    const playerToRemove = players[index];
    // Remove player's squares from grid
    const newSquares = squares.map(s => s === playerToRemove.name ? null : s);
    setSquares(newSquares);
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleSquareClick = (index) => {
    setSelectedSquare(index);
  };

  const assignPlayerToSquare = (playerName) => {
    if (selectedSquare !== null) {
      const newSquares = [...squares];
      newSquares[selectedSquare] = playerName;
      setSquares(newSquares);
      setSelectedSquare(null);
    }
  };

  const clearSquare = () => {
    if (selectedSquare !== null) {
      const newSquares = [...squares];
      newSquares[selectedSquare] = null;
      setSquares(newSquares);
      setSelectedSquare(null);
    }
  };

  const getPlayerSquareCount = (playerName) => {
    return squares.filter(s => s === playerName).length;
  };

  const totalAssigned = squares.filter(s => s !== null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Monday Night Football Squares</h1>
        <p className="text-center text-gray-600 mb-8">Chiefs vs Jaguars</p>

        <div className="flex gap-8">
          {/* Grid Section */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="text-sm font-semibold text-gray-700">
                  Assigned: {totalAssigned} / 100
                </div>
              </div>

              <div className="inline-block">
                {/* Column header with team name */}
                <div className="flex mb-2">
                  <div className="w-10 h-10"></div>
                  <div className="flex-1 text-center font-bold text-lg text-blue-600">
                    Chiefs
                  </div>
                </div>

                {/* Column numbers */}
                <div className="flex">
                  <div className="w-10"></div>
                  {colNumbers.map(num => (
                    <div key={num} className="w-12 h-10 flex items-center justify-center font-bold text-sm text-gray-700">
                      {num}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                <div className="flex">
                  {/* Row numbers and team name */}
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-10 text-center font-bold text-lg text-green-600 transform -rotate-0 whitespace-nowrap">
                        Jaguars
                      </div>
                    </div>
                    {rowNumbers.map(num => (
                      <div key={num} className="w-10 h-12 flex items-center justify-center font-bold text-sm text-gray-700">
                        {num}
                      </div>
                    ))}
                  </div>

                  {/* Grid squares */}
                  <div className="grid grid-cols-10 gap-1">
                    {squares.map((square, index) => (
                      <button
                        key={index}
                        onClick={() => handleSquareClick(index)}
                        className={`w-12 h-12 border-2 rounded text-xs font-medium transition-all ${
                          selectedSquare === index
                            ? 'border-blue-500 bg-blue-100 scale-105'
                            : square
                            ? 'border-green-400 bg-green-50 hover:bg-green-100'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {square && (
                          <div className="truncate px-1">{square}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedSquare !== null && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">
                      Square {selectedSquare + 1} selected
                    </span>
                    <button
                      onClick={() => setSelectedSquare(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {squares[selectedSquare] && (
                    <button
                      onClick={clearSquare}
                      className="w-full mb-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Clear Square
                    </button>
                  )}
                  <div className="text-sm text-gray-600">Click a player to assign:</div>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {players.map((player, idx) => (
                      <button
                        key={idx}
                        onClick={() => assignPlayerToSquare(player.name)}
                        className="w-full text-left px-3 py-2 bg-white rounded hover:bg-blue-100 transition-colors border border-gray-200"
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Players Section */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Players</h2>

              {/* Add Player Form */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="# of squares"
                  min="1"
                  max="100"
                  value={newPlayerSquares}
                  onChange={(e) => setNewPlayerSquares(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddPlayer}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Player
                </button>
              </div>

              {/* Players List */}
              <div className="space-y-2">
                {players.map((player, index) => {
                  const assignedCount = getPlayerSquareCount(player.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{player.name}</div>
                        <div className="text-sm text-gray-600">
                          {assignedCount} / {player.squares} squares
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
                {players.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No players yet. Add some above!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}