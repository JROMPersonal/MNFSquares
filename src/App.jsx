import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shuffle, Lock, Unlock, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const [tooltipSquare, setTooltipSquare] = useState(null);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Editable fields
  const [gameTitle, setGameTitle] = useState('Monday Night Football Squares');
  const [teamRow, setTeamRow] = useState('Jaguars');
  const [teamCol, setTeamCol] = useState('Chiefs');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Quarter scores
  const [quarterScores, setQuarterScores] = useState({
    q1: { team_col: '', team_row: '' },
    q2: { team_col: '', team_row: '' },
    q3: { team_col: '', team_row: '' },
    q4: { team_col: '', team_row: '' }
  });
  const [isComplete, setIsComplete] = useState(false);

  const ADMIN_KEY = 'x123james';

  // Get week ID from URL query parameter (e.g., ?week=1, ?week=2)
  const getWeekId = () => {
    const params = new URLSearchParams(window.location.search);
    const week = params.get('week');
    return week ? `week${week}` : 'week1'; // Default to week1
  };

  const weekId = getWeekId();

  const getCurrentWeekNumber = () => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('week')) || 1;
  };

  const navigateToWeek = (weekNumber) => {
    window.location.href = `?week=${weekNumber}`;
  };

  // Load data from Supabase on mount
  useEffect(() => {
    loadGameData();
  }, [weekId]);

  // Save data to Supabase whenever state changes (debounced)
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        saveGameData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [squares, players, rowNumbers, colNumbers, gameTitle, teamRow, teamCol, quarterScores, isComplete, isLoading]);

  const loadGameData = async () => {
    try {
      const { data, error } = await supabase
        .from('game_weeks')
        .select('*')
        .eq('week_id', weekId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading data:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setSquares(data.squares || Array(100).fill(null));
        setPlayers(data.players || []);
        setRowNumbers(data.row_numbers || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        setColNumbers(data.col_numbers || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        setGameTitle(data.game_title || 'Monday Night Football Squares');
        setTeamRow(data.team_row || 'Jaguars');
        setTeamCol(data.team_col || 'Chiefs');
        setQuarterScores(data.quarter_scores || {
          q1: { team_col: '', team_row: '' },
          q2: { team_col: '', team_row: '' },
          q3: { team_col: '', team_row: '' },
          q4: { team_col: '', team_row: '' }
        });
        setIsComplete(data.is_complete || false);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setIsLoading(false);
    }
  };

  const saveGameData = async () => {
    try {
      const gameData = {
        week_id: weekId,
        squares,
        players,
        row_numbers: rowNumbers,
        col_numbers: colNumbers,
        game_title: gameTitle,
        team_row: teamRow,
        team_col: teamCol,
        quarter_scores: quarterScores,
        is_complete: isComplete,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('game_weeks')
        .select('id')
        .eq('week_id', weekId)
        .single();

      if (existing) {
        await supabase
          .from('game_weeks')
          .update(gameData)
          .eq('week_id', weekId);
      } else {
        await supabase
          .from('game_weeks')
          .insert([gameData]);
      }
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

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
    newPlayers[index].squares = squareCount === '' ? '' : parseInt(squareCount) || 1;
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

  const handleSquareClick = (index, square) => {
    if (square) {
      setHighlightedPlayer(square);
      setSelectedPlayer(square);
      setTooltipSquare(tooltipSquare === index ? null : index);
    }
  };

  const totalAssigned = squares.filter(s => s !== null).length;
  const totalRequested = players.reduce((sum, p) => sum + (p.squares || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center">
        <div className="text-white text-xl">Loading {weekId}...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          {isAdmin && isEditingTitle ? (
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-xl sm:text-2xl lg:text-4xl font-bold text-white bg-[#313338] border border-[#4da6ff] rounded px-2 py-1 focus:outline-none"
              autoFocus
            />
          ) : (
            <h1
              className={`text-xl sm:text-2xl lg:text-4xl font-bold text-white ${isAdmin ? 'cursor-pointer hover:text-[#4da6ff]' : ''} transition-colors`}
              onClick={() => isAdmin && setIsEditingTitle(true)}
            >
              {gameTitle} <span className="text-sm text-gray-500">({weekId})</span>
            </h1>
          )}
          <button
            onClick={() => isAdmin ? handleAdminLogout() : setShowAdminModal(true)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded transition-colors border text-xs sm:text-sm ${
              isAdmin
                ? 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                : 'bg-red-600 text-white border-red-500 hover:bg-red-700'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="sm:hidden">Admin</span>
              </>
            ) : (
              <>
                <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Admin</span>
              </>
            )}
          </button>
        </div>
        <p className="text-center text-gray-400 mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base">
          {teamCol} vs {teamRow}
        </p>

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => navigateToWeek(getCurrentWeekNumber() - 1)}
            disabled={getCurrentWeekNumber() <= 1}
            className={`px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base ${
              getCurrentWeekNumber() <= 1
                ? 'bg-[#313338] text-gray-600 cursor-not-allowed'
                : 'bg-[#313338] text-gray-200 hover:bg-[#383a40] border border-[#404249]'
            }`}
          >
            ← Previous Week
          </button>
          <div className="px-4 py-2 bg-[#2b2d31] text-white font-semibold rounded border border-[#4da6ff] text-sm sm:text-base">
            Week {getCurrentWeekNumber()}
          </div>
          <button
            onClick={() => navigateToWeek(getCurrentWeekNumber() + 1)}
            className="px-3 sm:px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors border border-[#404249] text-sm sm:text-base"
          >
            Next Week →
          </button>
        </div>

        {/* Admin Login Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdminModal(false)}>
            <div className="bg-[#2b2d31] rounded-lg p-4 sm:p-6 w-full max-w-sm border border-[#404249]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Enter Admin Key</h3>
              <input
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Admin key"
                className="w-full px-3 py-2 bg-[#313338] border border-[#404249] text-gray-200 placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] mb-3 text-sm sm:text-base"
                autoFocus
              />
              {adminError && (
                <p className="text-red-400 text-xs sm:text-sm mb-3">{adminError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-3 sm:px-4 py-2 bg-[#4da6ff] text-white rounded hover:bg-[#3399ff] transition-colors text-sm sm:text-base"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminKeyInput('');
                    setAdminError('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip Modal for Mobile */}
        {tooltipSquare !== null && squares[tooltipSquare] && (
          <div className="md:hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTooltipSquare(null)}>
            <div className="bg-[#1e1f22] rounded-lg p-4 border-2 border-orange-400 max-w-xs" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-white text-lg">{squares[tooltipSquare]}</div>
                <button onClick={() => setTooltipSquare(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="text-gray-300">
                {teamCol} {colNumbers[tooltipSquare % 10]} - {teamRow} {rowNumbers[Math.floor(tooltipSquare / 10)]}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 justify-center">
          {/* Grid Section */}
          <div className={isAdmin ? "flex-shrink-0 w-full" : "w-full"}>
            <div className="bg-[#2b2d31] rounded-lg shadow-xl p-2 sm:p-4 lg:p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
                <div className="text-xs sm:text-sm font-semibold text-gray-300">
                  Assigned: {totalAssigned} / 100
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsZoomedOut(!isZoomedOut)}
                    className="lg:hidden px-2 sm:px-3 py-1 sm:py-2 bg-[#313338] text-gray-200 text-xs sm:text-sm font-medium rounded hover:bg-[#383a40] transition-colors border border-[#404249]"
                  >
                    {isZoomedOut ? '🔍 Zoom In' : '🔍 Zoom Out'}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={randomizeNumbers}
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-[#4da6ff] text-white text-xs sm:text-sm font-medium rounded hover:bg-[#3399ff] transition-colors shadow-lg"
                    >
                      🎲 <span className="hidden sm:inline">Randomize Numbers</span>
                    </button>
                  )}
                </div>
              </div>

              <div className={`inline-block min-w-max transition-transform origin-top-left ${isZoomedOut ? 'lg:scale-100 scale-[0.65]' : ''}`}>
                {/* Column header with team name */}
                <div className="flex mb-1">
                  <div className="w-12 lg:w-20"></div>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={teamCol}
                      onChange={(e) => setTeamCol(e.target.value)}
                      className="text-center font-bold text-sm sm:text-base lg:text-lg text-[#4da6ff] bg-[#313338] border border-[#4da6ff] rounded px-2 focus:outline-none"
                      style={{width: 'calc(10 * (48px + 4px))'}}
                    />
                  ) : (
                    <div className="text-center font-bold text-sm sm:text-base lg:text-lg text-[#4da6ff]" style={{width: 'calc(10 * (48px + 4px))'}}>
                      {teamCol}
                    </div>
                  )}
                </div>

                {/* Column numbers */}
                <div className="flex mb-1">
                  <div className="w-12 lg:w-20"></div>
                  <div className="flex gap-1">
                    {colNumbers.map(num => (
                      <div key={num} className="flex items-center justify-center font-bold text-xs sm:text-sm text-gray-400 w-12 h-8 lg:w-[52px] lg:h-8">
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid rows */}
                <div className="flex">
                  {/* Team label vertically */}
                  <div className="flex items-center justify-center w-6 lg:w-10">
                    {isAdmin ? (
                      <input
                        type="text"
                        value={teamRow}
                        onChange={(e) => setTeamRow(e.target.value)}
                        className="font-bold text-sm sm:text-base lg:text-lg text-[#4da6ff] bg-[#313338] border border-[#4da6ff] rounded px-1 py-2 focus:outline-none text-center w-full"
                        style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}
                      />
                    ) : (
                      <div className="font-bold text-sm sm:text-base lg:text-lg text-[#4da6ff]" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>
                        {teamRow}
                      </div>
                    )}
                  </div>

                  {/* Row numbers */}
                  <div className="flex flex-col gap-1 w-6 lg:w-10">
                    {rowNumbers.map(num => (
                      <div key={num} className="flex items-center justify-center font-bold text-xs sm:text-sm text-gray-400 h-12 lg:h-[52px]">
                        {num}
                      </div>
                    ))}
                  </div>

                  {/* Grid squares */}
                  <div className="grid grid-cols-10 gap-1">
                    {squares.map((square, index) => {
                      const isHighlighted = square && square === highlightedPlayer;
                      const row = Math.floor(index / 10);
                      const col = index % 10;
                      const chiefsScore = colNumbers[col];
                      const jaguarsScore = rowNumbers[row];

                      return (
                        <div
                          key={index}
                          onClick={() => handleSquareClick(index, square)}
                          className={`border-2 rounded text-xs font-medium flex items-center justify-center transition-all relative group w-12 h-12 lg:w-[52px] lg:h-[52px] ${
                            isHighlighted
                              ? 'border-[#00d4ff] bg-[#00d4ff]/30 text-white shadow-lg shadow-[#00d4ff]/50 cursor-pointer'
                              : square
                              ? 'border-[#4da6ff]/50 bg-[#4da6ff]/10 text-gray-200 cursor-pointer hover:bg-[#4da6ff]/20 active:bg-[#4da6ff]/30'
                              : 'border-[#404249] bg-[#313338] text-gray-400'
                          }`}
                        >
                          {square && (
                            <>
                              <div className="px-1 text-[10px] sm:text-xs leading-tight text-center break-words">{square}</div>
                              {/* Desktop Tooltip */}
                              <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1e1f22] text-white text-sm rounded shadow-lg border-2 border-orange-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                                <div className="font-semibold">{square}</div>
                                <div className="text-xs text-gray-300">{teamCol} {chiefsScore} - {teamRow} {jaguarsScore}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                  <div className="border-4 border-transparent border-t-orange-400"></div>
                                </div>
                              </div>
                            </>
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
            <div className="w-full lg:w-96">
              <div className="bg-[#2b2d31] rounded-lg shadow-xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Players</h2>

                {/* Players List */}
                <div className="space-y-2 mb-4 max-h-60 sm:max-h-96 overflow-y-auto">
                  {players.map((player, index) => {
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Player name"
                          value={player.name}
                          onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#313338] border border-[#404249] text-gray-200 placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-sm sm:text-base"
                        />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={player.squares}
                          onChange={(e) => handlePlayerSquaresChange(index, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-12 sm:w-16 px-1 sm:px-2 py-1.5 sm:py-2 bg-[#313338] border border-[#404249] text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center text-sm sm:text-base"
                        />
                        <button
                          onClick={() => handleRemovePlayer(index)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 sm:p-2"
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Player Button */}
                <button
                  onClick={handleAddPlayer}
                  className="w-full px-3 sm:px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors flex items-center justify-center gap-2 border border-[#404249] mb-3 sm:mb-4 text-sm sm:text-base"
                >
                  <Plus size={18} className="sm:w-5 sm:h-5" />
                  Add Player
                </button>

                {/* Summary */}
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#313338] rounded border border-[#404249]">
                  <div className="text-xs sm:text-sm text-gray-300">
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#4da6ff] text-white rounded hover:bg-[#3399ff] transition-colors flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
                  >
                    <Shuffle size={18} className="sm:w-5 sm:h-5" />
                    Fill Squares Randomly
                  </button>
                  <button
                    onClick={clearSquares}
                    className="w-full px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs sm:text-sm"
                  >
                    Clear All Squares
                  </button>
                </div>

                {/* Quarter Scores Section */}
                <div className="mt-6 pt-6 border-t-2 border-[#404249]">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 text-white">Quarter Scores</h3>
                  <div className="space-y-3">
                    {['q1', 'q2', 'q3', 'q4'].map((quarter, idx) => (
                      <div key={quarter} className="bg-[#313338] rounded p-3 border border-[#404249]">
                        <div className="font-semibold text-gray-200 mb-2 text-sm">Q{idx + 1}</div>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">{teamCol}</label>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              placeholder="0"
                              value={quarterScores[quarter].team_col}
                              onChange={(e) => setQuarterScores({
                                ...quarterScores,
                                [quarter]: { ...quarterScores[quarter], team_col: e.target.value }
                              })}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-2 py-1.5 bg-[#2b2d31] border border-[#404249] text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center"
                            />
                          </div>
                          <div className="text-gray-500 font-bold">-</div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">{teamRow}</label>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              placeholder="0"
                              value={quarterScores[quarter].team_row}
                              onChange={(e) => setQuarterScores({
                                ...quarterScores,
                                [quarter]: { ...quarterScores[quarter], team_row: e.target.value }
                              })}
                              onFocus={(e) => e.target.select()}
                              className="w-full px-2 py-1.5 bg-[#2b2d31] border border-[#404249] text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mark as Complete Button */}
                  <button
                    onClick={() => setIsComplete(!isComplete)}
                    className={`w-full mt-4 px-4 py-3 rounded font-semibold transition-colors ${
                      isComplete
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-yellow-500 text-black hover:bg-yellow-600'
                    }`}
                  >
                    {isComplete ? '✓ Week Complete' : 'Mark Week as Complete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Squares Lookup - Bottom of Page */}
        {totalAssigned > 0 && (
          <div className="mt-4 sm:mt-6 lg:mt-8 bg-[#2b2d31] rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Player Squares</h2>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Player List - Left Side */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-[#313338] rounded border border-[#404249] max-h-60 md:max-h-80 overflow-y-auto">
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
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold transition-colors border-b border-[#404249] last:border-b-0 text-sm sm:text-base ${
                          isSelected
                            ? 'bg-[#4da6ff] text-white'
                            : 'text-gray-200 hover:bg-[#383a40] active:bg-[#383a40]'
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
                  <div className="bg-[#313338] rounded border border-[#404249] p-3 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{selectedPlayer}'s Squares</h3>
                    <div className="space-y-2">
                      {getPlayerSquares(selectedPlayer).map((sq, idx) => (
                        <div key={idx} className="px-3 sm:px-4 py-2 bg-[#2b2d31] rounded border border-[#404249] text-gray-200 text-sm sm:text-base">
                          <span className="font-semibold text-[#4da6ff]">{teamCol} {sq.chiefs}</span>
                          {' - '}
                          <span className="font-semibold text-[#4da6ff]">{teamRow} {sq.jaguars}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#313338] rounded border border-[#404249] p-6 flex items-center justify-center h-40 md:h-80">
                    <p className="text-gray-500 text-center text-sm sm:text-base">Select a player to view their squares</p>
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