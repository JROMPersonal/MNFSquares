import React, { useState } from 'react';
import { Plus, Trash2, Shuffle, Lock, Unlock } from 'lucide-react';

export default function FootballSquares() {
  const [squares, setSquares] = useState(Array(100).fill(null));
  const [players, setPlayers] = useState([]);
  const [rowNumbers, setRowNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [colNumbers, setColNumbers] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [highlightedPlayer, setHighlightedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const ADMIN_KEY = 'mnf2024'; // Change this to your secret password

  const handleAddPlayer = () => {
    setPlayers([...players, { name: '', squares: 1 }]);
  };

  const handleRemovePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleAdminLogin = () => {
    if (adminKeyInput === ADMIN_KEY) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminKeyInput('');
      setAdminError('');
    } else {
      setAdminError('Incorrect admin key');
      setAdminKeyInput('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
  };

  const handlePlayerNameChange = (index, name) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  const handlePlayerSquaresChange = (index, squareCount) => {
    const newPlayers = [...players];
    newPlayers[index].squares = parseInt(squareCount) || 1;
    setPlayers(newPlayers);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const randomizeNumbers = () => {
    setRowNumbers(shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    setColNumbers(shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  };

  const fillSquares = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      alert('Please add at least one player with a name!');
      return;
    }

    const totalNeeded = validPlayers.reduce((sum, p) => sum + p.squares, 0);
    if (totalNeeded > 100) {
      alert(`Total squares (${totalNeeded}) exceeds 100!`);
      return;
    }

    const playerSquares = [];
    validPlayers.forEach(player => {
      for (let i = 0; i < player.squares; i++) {
        playerSquares.push(player.name.trim());
      }
    });

    const shuffledPlayers = shuffleArray(playerSquares);
    const allSquares = [...shuffledPlayers, ...Array(100 - shuffledPlayers.length).fill(null)];
    const finalSquares = shuffleArray(allSquares);

    setSquares(finalSquares);
  };

  const clearSquares = () => {
    setSquares(Array(100).fill(null));
  };

  const getPlayerSquareCount = (playerName) => {
    return squares.filter(s => s === playerName).length;
  };

  const getPlayerSquares = (playerName) => {
    const playerSquaresList = [];
    squares.forEach((square, index) => {
      if (square === playerName) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        playerSquaresList.push({
          chiefs: colNumbers[col],
          jaguars: rowNumbers[row]
        });
      }
    });
    return playerSquaresList;
  };

  const getUniquePlayers = () => {
    const uniqueNames = new Set(squares.filter(s => s !== null));
    return Array.from(uniqueNames);
  };

  const totalAssigned = squares.filter(s => s !== null).length;
  const totalRequested = players.reduce((sum, p) => sum + (p.squares || 0), 0);

  return (
    <div className="min-h-screen bg-[#1e1f22] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-white">Monday Night Football Squares</h1>
          <button
            onClick={() => isAdmin ? handleAdminLogout() : setShowAdminModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors border ${
              isAdmin
                ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                : 'bg-red-600 text-white border-red-500 hover:bg-red-700'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock size={18} />
                <span className="text-sm">Admin Mode</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span className="text-sm">Admin</span>
              </>
            )}
          </button>
        </div>
        <p className="text-center text-gray-400 mb-8">Chiefs vs Jaguars</p>

        {/* Admin Login Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdminModal(false)}>
            <div className="bg-[#2b2d31] rounded-lg p-6 w-96 border border-[#404249]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Enter Admin Key</h3>
              <input
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Admin key"
                className="w-full px-3 py-2 bg-[#313338] border border-[#404249] text-gray-200 placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] mb-3"
                autoFocus
              />
              {adminError && (
                <p className="text-red-400 text-sm mb-3">{adminError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-4 py-2 bg-[#4da6ff] text-white rounded hover:bg-[#3399ff] transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminKeyInput('');
                    setAdminError('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8 justify-center">
          {/* Grid Section */}
          <div className={isAdmin ? "flex-shrink-0" : ""}>
            <div className="bg-[#2b2d31] rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-semibold text-gray-300">
                  Assigned: {totalAssigned} / 100
                </div>
                {isAdmin && (
                  <button
                    onClick={randomizeNumbers}
                    className="px-4 py-2 bg-[#4da6ff] text-white text-sm font-medium rounded hover:bg-[#3399ff] transition-colors shadow-lg"
                  >
                    🎲 Randomize Numbers
                  </button>
                )}
              </div>

              <div className="inline-block">
                {/* Column header with team name */}
                <div className="flex mb-1">
                  <div style={{width: '80px'}}></div>
                  <div className="text-center font-bold text-lg text-[#4da6ff]" style={{width: '533px'}}>
                    Chiefs
                  </div>
                </div>

                {/* Column numbers */}
                <div className="flex mb-1">
                  <div style={{width: '80px'}}></div>
                  <div className="flex gap-1">
                    {colNumbers.map(num => (
                      <div key={num} className="flex items-center justify-center font-bold text-sm text-gray-400" style={{width: '52px', height: '32px'}}>
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid rows */}
                <div className="flex">
                  {/* Jaguars label vertically */}
                  <div className="flex items-center justify-center" style={{width: '40px'}}>
                    <div className="font-bold text-lg text-[#4da6ff]" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>
                      Jaguars
                    </div>
                  </div>

                  {/* Row numbers */}
                  <div className="flex flex-col gap-1" style={{width: '40px'}}>
                    {rowNumbers.map(num => (
                      <div key={num} className="flex items-center justify-center font-bold text-sm text-gray-400" style={{width: '40px', height: '52px'}}>
                        {num}
                      </div>
                    ))}
                  </div>

                  {/* Grid squares */}
                  <div className="grid grid-cols-10 gap-1">
                    {squares.map((square, index) => {
                      const isHighlighted = square && square === highlightedPlayer;
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (square) {
                              setHighlightedPlayer(square);
                              setSelectedPlayer(square);
                            }
                          }}
                          className={`border-2 rounded text-xs font-medium flex items-center justify-center transition-all ${
                            isHighlighted
                              ? 'border-[#00d4ff] bg-[#00d4ff]/30 text-white shadow-lg shadow-[#00d4ff]/50 cursor-pointer'
                              : square
                              ? 'border-[#4da6ff]/50 bg-[#4da6ff]/10 text-gray-200 cursor-pointer hover:bg-[#4da6ff]/20'
                              : 'border-[#404249] bg-[#313338] text-gray-400'
                          }`}
                          style={{width: '52px', height: '52px'}}
                        >
                          {square && (
                            <div className="truncate px-1">{square}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players Section - Only visible to admins */}
          {isAdmin && (
            <div className="w-96">
              <div className="bg-[#2b2d31] rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Players</h2>

                {/* Players List */}
                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {players.map((player, index) => {
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Player name"
                          value={player.name}
                          onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#313338] border border-[#404249] text-gray-200 placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff]"
                        />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={player.squares}
                          onChange={(e) => handlePlayerSquaresChange(index, e.target.value)}
                          className="w-16 px-2 py-2 bg-[#313338] border border-[#404249] text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center"
                        />
                        <button
                          onClick={() => handleRemovePlayer(index)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Player Button */}
                <button
                  onClick={handleAddPlayer}
                  className="w-full px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors flex items-center justify-center gap-2 border border-[#404249] mb-4"
                >
                  <Plus size={20} />
                  Add Player
                </button>

                {/* Summary */}
                <div className="mb-4 p-3 bg-[#313338] rounded border border-[#404249]">
                  <div className="text-sm text-gray-300">
                    Total squares: <span className="font-bold text-white">{totalRequested}</span> / 100
                  </div>
                  {totalRequested > 100 && (
                    <div className="text-xs text-red-400 mt-1">
                      Too many squares!
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={fillSquares}
                    className="w-full px-4 py-3 bg-[#4da6ff] text-white rounded hover:bg-[#3399ff] transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <Shuffle size={20} />
                    Fill Squares Randomly
                  </button>
                  <button
                    onClick={clearSquares}
                    className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Clear All Squares
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Squares Lookup - Bottom of Page */}
        {totalAssigned > 0 && (
          <div className="mt-8 bg-[#2b2d31] rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Player Squares</h2>
            <div className="flex gap-6">
              {/* Player List - Left Side */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-[#313338] rounded border border-[#404249] max-h-80 overflow-y-auto">
                  {getUniquePlayers().map((playerName, index) => {
                    const isSelected = selectedPlayer === playerName;
                    const playerSquares = getPlayerSquares(playerName);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPlayer(playerName);
                          setHighlightedPlayer(playerName);
                        }}
                        className={`w-full px-4 py-3 text-left font-semibold transition-colors border-b border-[#404249] last:border-b-0 ${
                          isSelected
                            ? 'bg-[#4da6ff] text-white'
                            : 'text-gray-200 hover:bg-[#383a40]'
                        }`}
                      >
                        {playerName} ({playerSquares.length})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Squares Details - Right Side */}
              <div className="flex-1">
                {selectedPlayer ? (
                  <div className="bg-[#313338] rounded border border-[#404249] p-6">
                    <h3 className="text-xl font-bold text-white mb-4">{selectedPlayer}'s Squares</h3>
                    <div className="space-y-2">
                      {getPlayerSquares(selectedPlayer).map((sq, idx) => (
                        <div key={idx} className="px-4 py-2 bg-[#2b2d31] rounded border border-[#404249] text-gray-200">
                          <span className="font-semibold text-[#4da6ff]">Chiefs {sq.chiefs}</span>
                          {' - '}
                          <span className="font-semibold text-[#4da6ff]">Jaguars {sq.jaguars}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#313338] rounded border border-[#404249] p-6 flex items-center justify-center h-80">
                    <p className="text-gray-500 text-center">Select a player to view their squares</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}