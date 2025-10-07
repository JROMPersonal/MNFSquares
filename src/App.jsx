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
  const [showUpdatePlayersModal, setShowUpdatePlayersModal] = useState(false);
  const [updatePlayersKeyInput, setUpdatePlayersKeyInput] = useState('');
  const [updatePlayersError, setUpdatePlayersError] = useState('');
  const [tooltipSquare, setTooltipSquare] = useState(null);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSquare, setAssigningSquare] = useState(null);
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasAdminParam = searchParams.has("admin");

    // Admin page means: you're logged in as admin and ?admin is in URL
    setIsAdminPage(isAdmin && hasAdminParam);
  }, [isAdmin]);

  // Editable fields
  const [gameTitle, setGameTitle] = useState('Monday Night Football Squares');
  const [teamRow, setTeamRow] = useState('Team A');
  const [teamCol, setTeamCol] = useState('Team B');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Quarter scores
  const [quarterScores, setQuarterScores] = useState({
    q1: { team_col: '', team_row: '' },
    q2: { team_col: '', team_row: '' },
    q3: { team_col: '', team_row: '' },
    q4: { team_col: '', team_row: '' }
  });
  const [isComplete, setIsComplete] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);

  const ADMIN_KEY = 'x123james';

  // Load current week setting first
  useEffect(() => {
    loadCurrentWeek();
  }, []);

  // Redirect to current week if no week specified (after currentWeek is loaded)
  useEffect(() => {
    if (currentWeek > 0) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('week') && !params.has('admin')) {
        window.location.href = `?week=${currentWeek}`;
      }
    }
  }, [currentWeek]);

  // Get week ID from URL query parameter
  const getWeekId = () => {
    const params = new URLSearchParams(window.location.search);

    // Check if we're in admin/template mode
    if (params.has('admin')) {
      return 'season_template';
    }

    const week = params.get('week');
    return week ? `week${week}` : 'week1';
  };

  const weekId = getWeekId();
  const isTemplateMode = weekId === 'season_template';

  const getCurrentWeekNumber = () => {
    if (isTemplateMode) return null;
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

  // Auto-load template players for all weeks (not just empty ones)
  useEffect(() => {
    if (!isLoading && !isTemplateMode) {
      loadTemplateData();
    }
  }, [isLoading, weekId]);

  // Save data to Supabase whenever state changes
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

        if (!isTemplateMode) {
          setGameTitle(data.game_title || 'Monday Night Football Squares');
          setTeamRow(data.team_row || 'Team A');
          setTeamCol(data.team_col || 'Team B');
          setQuarterScores(data.quarter_scores || {
            q1: { team_col: '', team_row: '' },
            q2: { team_col: '', team_row: '' },
            q3: { team_col: '', team_row: '' },
            q4: { team_col: '', team_row: '' }
          });
          setIsComplete(data.is_complete || false);
        }
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setIsLoading(false);
    }
  };

  const loadTemplateData = async () => {
    try {
      const { data, error } = await supabase
        .from('game_weeks')
        .select('players')
        .eq('week_id', 'season_template')
        .single();

      if (data && data.players && data.players.length > 0) {
        setPlayers(data.players);
      }
    } catch (err) {
      console.error('Error loading template:', err);
    }
  };

  const loadCurrentWeek = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('current_week')
        .eq('id', 1)
        .single();

      if (data) {
        setCurrentWeek(data.current_week || 1);
      }
    } catch (err) {
      console.error('Error loading current week:', err);
    }
  };

  const saveCurrentWeek = async (week) => {
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('id', 1)
        .single();

      if (existing) {
        await supabase
          .from('settings')
          .update({ current_week: week })
          .eq('id', 1);
      } else {
        await supabase
          .from('settings')
          .insert([{ id: 1, current_week: week }]);
      }
      setCurrentWeek(week);
    } catch (err) {
      console.error('Error saving current week:', err);
    }
  };

  const resetToTemplate = async () => {
    if (confirm('Reset players to season template? This will overwrite current players.')) {
      await loadTemplateData();
    }
  };

  const saveGameData = async () => {
    try {
      const gameData = isTemplateMode
        ? {
            week_id: weekId,
            players,
            squares: Array(100).fill(null),
            row_numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            col_numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            game_title: 'Season Template',
            team_row: 'Team A',
            team_col: 'Team B',
            quarter_scores: {
              q1: { team_col: '', team_row: '' },
              q2: { team_col: '', team_row: '' },
              q3: { team_col: '', team_row: '' },
              q4: { team_col: '', team_row: '' }
            },
            is_complete: false,
            updated_at: new Date().toISOString()
          }
        : {
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
      localStorage.setItem('isAdmin', 'true');
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
    localStorage.removeItem('isAdmin');
  };

const handleUpdatePlayersLogin = () => {
  if (isAdmin) {
    setIsAdmin(true);
    localStorage.setItem('isAdmin', 'true');
    setUpdatePlayersKeyInput('');
    setUpdatePlayersError('');
    window.location.href = '?admin';
  } else {
    setUpdatePlayersError('Incorrect admin key');
    setUpdatePlayersKeyInput('');
  }
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
      alert(`Total Players (${totalNeeded}) exceeds 100!`);
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

  const getWinningSquares = () => {
    const winners = [];
    const quarters = ['q1', 'q2', 'q3', 'q4'];

    quarters.forEach((quarter, qIndex) => {
      const scores = quarterScores[quarter];
      if (scores && scores.team_col !== '' && scores.team_row !== '') {
        const colLastDigit = parseInt(scores.team_col) % 10;
        const rowLastDigit = parseInt(scores.team_row) % 10;

        const colIndex = colNumbers.indexOf(colLastDigit);
        const rowIndex = rowNumbers.indexOf(rowLastDigit);

        if (colIndex !== -1 && rowIndex !== -1) {
          const squareIndex = rowIndex * 10 + colIndex;
          const player = squares[squareIndex];

          winners.push({
            quarter: `Q${qIndex + 1}`,
            score: `${teamCol} ${scores.team_col} - ${teamRow} ${scores.team_row}`,
            player: player || 'No one',
            colNum: colLastDigit,
            rowNum: rowLastDigit,
            squareIndex: squareIndex
          });
        }
      }
    });

    return winners;
  };

  const isWinningSquare = (index) => {
    if (!isComplete) return false;
    const winners = getWinningSquares();
    return winners.some(w => w.squareIndex === index);
  };

  const handleSquareClick = (index, square) => {
    if (isAdmin) {
      setAssigningSquare(index);
      setShowAssignModal(true);
    } else if (square) {
      setHighlightedPlayer(square);
      setSelectedPlayer(square);
      setTooltipSquare(tooltipSquare === index ? null : index);
    }
  };

  const assignSquareToPlayer = (playerName) => {
    const newSquares = [...squares];
    newSquares[assigningSquare] = playerName;
    setSquares(newSquares);
    setShowAssignModal(false);
    setAssigningSquare(null);
  };

  const clearAssignedSquare = () => {
    const newSquares = [...squares];
    newSquares[assigningSquare] = null;
    setSquares(newSquares);
    setShowAssignModal(false);
    setAssigningSquare(null);
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
              className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-[#313338] border border-[#4da6ff] rounded px-2 py-1 focus:outline-none"
              autoFocus
            />
          ) : (
            <h1
              className={`text-lg sm:text-xl lg:text-2xl font-bold text-white ${isAdmin ? 'cursor-pointer hover:text-[#4da6ff]' : ''} transition-colors`}
              onClick={() => isAdmin && setIsEditingTitle(true)}
            >
              {isTemplateMode ? 'Season Player Template' : gameTitle}
              {!isTemplateMode && <span className="text-sm text-gray-500"> ({weekId})</span>}
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
          {!isTemplateMode && isAdmin && (
            <button
              onClick={() => {
                if (!isAdmin) {
                  setShowUpdatePlayersModal(true);
                } else {
                  window.location.href = '?admin';
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded transition-colors border text-xs sm:text-sm bg-purple-600 text-white border-purple-500 hover:bg-purple-700"
            >
              <span>Update Players</span>
            </button>
          )}
        </div>
        <p className="text-center text-gray-400 mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base">
          {isTemplateMode ? 'Manage your season-wide player list' : `${teamCol} vs ${teamRow}`}
        </p>

        {/* Week Navigation - Hide in template mode */}
        {!isTemplateMode && (
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
            <div className="px-4 py-2 bg-[#2b2d31] text-white font-semibold rounded border border-[#4da6ff] text-sm sm:text-base flex items-center gap-2">
              Week
              <input
                type="number"
                min="1"
                value={getCurrentWeekNumber()}
                onChange={(e) => {
                  const weekNum = parseInt(e.target.value);
                  if (weekNum >= 1) {
                    navigateToWeek(weekNum);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-12 sm:w-16 px-2 py-1 bg-[#2b2d31] text-white rounded focus:outline-none text-center"
              />
            </div>
            <button
              onClick={() => navigateToWeek(getCurrentWeekNumber() + 1)}
              disabled={getCurrentWeekNumber() >= currentWeek}
              className={`px-3 sm:px-4 py-2 rounded transition-colors border text-sm sm:text-base ${
                getCurrentWeekNumber() >= currentWeek
                  ? 'bg-[#313338] text-gray-600 cursor-not-allowed border-[#404249]'
                  : 'bg-[#313338] text-gray-200 hover:bg-[#383a40] border-[#404249]'
              }`}
            >
              Next Week →
            </button>
          </div>
        )}

        {/* Template Mode Info Banner */}
        {isTemplateMode && (
          <div className="mb-6 bg-[#4da6ff]/20 border-2 border-[#4da6ff] rounded-lg p-4">
            <h3 className="text-lg font-bold text-[#4da6ff] mb-2">Season Template</h3>
            <p className="text-gray-300 text-sm mb-3">
              Players added here will automatically appear in all weeks - You still need to randomize the squares / numbers.
            </p>

            {/* Current Week Setting - Admin Only */}
            {isAdmin && (
              <div className="mb-4 p-3 bg-[#2b2d31] rounded border border-[#404249]">
                <label className="text-sm text-gray-300 block mb-2">Current Week (for homepage redirect):</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={currentWeek}
                    onChange={(e) => {
                      const week = parseInt(e.target.value);
                      if (week >= 1) {
                        saveCurrentWeek(week);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-20 px-3 py-2 bg-[#313338] border border-[#4da6ff] text-white rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center"
                  />
                  <span className="text-gray-400 text-sm">Users will be redirected to Week {currentWeek}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => window.location.href = '?week=1'}
              className="px-4 py-2 bg-[#4da6ff] text-white rounded hover:bg-[#3399ff] transition-colors text-sm"
            >
              ← Back to Weeks
            </button>
          </div>
        )}

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

        {/* Update Players Login Modal */}
        {showUpdatePlayersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpdatePlayersModal(false)}>
            <div className="bg-[#2b2d31] rounded-lg p-4 sm:p-6 w-full max-w-sm border border-[#404249]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Update Season Players</h3>
              <p className="text-gray-400 text-sm mb-3">Enter admin key to manage season template</p>
              <input
                type="password"
                value={updatePlayersKeyInput}
                onChange={(e) => setUpdatePlayersKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdatePlayersLogin()}
                placeholder="Admin key"
                className="w-full px-3 py-2 bg-[#313338] border border-[#404249] text-gray-200 placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] mb-3 text-sm sm:text-base"
                autoFocus
              />
              {updatePlayersError && (
                <p className="text-red-400 text-xs sm:text-sm mb-3">{updatePlayersError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdatePlayersLogin}
                  className="flex-1 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowUpdatePlayersModal(false);
                    setUpdatePlayersKeyInput('');
                    setUpdatePlayersError('');
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

        {/* Assign Square Modal - Admin only */}
        {showAssignModal && isAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
            <div className="bg-[#2b2d31] rounded-lg p-4 sm:p-6 w-full max-w-md border border-[#404249]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Assign Square {assigningSquare !== null ? assigningSquare + 1 : ''}
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {squares[assigningSquare] && (
                <button
                  onClick={clearAssignedSquare}
                  className="w-full mb-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Clear Square
                </button>
              )}

              <div className="text-sm text-gray-400 mb-2">Select a player:</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {players.filter(p => p.name.trim()).map((player, idx) => (
                  <button
                    key={idx}
                    onClick={() => assignSquareToPlayer(player.name.trim())}
                    className="w-full text-left px-4 py-3 bg-[#313338] text-gray-200 rounded hover:bg-[#4da6ff] hover:text-white transition-colors border border-[#404249]"
                  >
                    {player.name}
                  </button>
                ))}
                {players.filter(p => p.name.trim()).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No players added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Winners Display - Hide in template mode */}
        {!isTemplateMode && isComplete && getWinningSquares().length > 0 && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-lg p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-yellow-400 mb-4">🏆 Winners! 🏆</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {getWinningSquares().map((winner, idx) => (
                <div key={idx} className="bg-[#2b2d31] rounded-lg p-4 border-2 border-yellow-500/50">
                  <div className="text-yellow-400 font-bold text-lg mb-2">{winner.quarter}</div>
                  <div className="text-white font-semibold text-xl mb-2">{winner.player}</div>
                  <div className="text-gray-300 text-sm mb-1">{winner.score}</div>
                  <div className="text-[#4da6ff] text-sm">
                    Square: {teamCol} {winner.colNum}, {teamRow} {winner.rowNum}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 justify-center">
          {/* Grid Section - Hide in template mode */}
          {!isTemplateMode && (
            <div className={isAdmin ? "flex-shrink-0 w-full" : "w-full"}>
            <div className="bg-[#2b2d31] rounded-lg shadow-xl p-2 sm:p-4 lg:p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
                <div className="text-xs sm:text-sm font-semibold text-gray-300">
                  Squares: {totalAssigned} / 100
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsZoomedOut(!isZoomedOut)}
                    className="lg:hidden px-2 sm:px-3 py-1 sm:py-2 bg-[#313338] text-gray-200 text-xs sm:text-sm font-medium rounded hover:bg-[#383a40] transition-colors border border-[#404249]"
                  >
                    {isZoomedOut ? 'Zoom In' : 'Zoom Out'}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={randomizeNumbers}
                      className="px-2 sm:px-4 py-1 sm:py-2 bg-[#4da6ff] text-white text-xs sm:text-sm font-medium rounded hover:bg-[#3399ff] transition-colors shadow-lg"
                    >
                      Randomize Numbers
                    </button>
                  )}
                </div>
              </div>

              <div className={`inline-block min-w-max transition-transform origin-top-left ${isZoomedOut ? 'lg:scale-100 scale-[0.65]' : ''}`}>
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

                <div className="flex">
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

                  <div className="flex flex-col gap-1 w-6 lg:w-10">
                    {rowNumbers.map(num => (
                      <div key={num} className="flex items-center justify-center font-bold text-xs sm:text-sm text-gray-400 h-12 lg:h-[52px]">
                        {num}
                      </div>
                    ))}
                  </div>

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
                            isWinningSquare(index)
                              ? 'border-yellow-500 bg-yellow-500/30 text-white shadow-lg shadow-yellow-500/50 animate-pulse'
                              : isHighlighted
                              ? 'border-[#00d4ff] bg-[#00d4ff]/30 text-white shadow-lg shadow-[#00d4ff]/50 cursor-pointer'
                              : square
                              ? 'border-[#4da6ff]/50 bg-[#4da6ff]/10 text-gray-200 cursor-pointer hover:bg-[#4da6ff]/20 active:bg-[#4da6ff]/30'
                              : 'border-[#404249] bg-[#313338] text-gray-400'
                          }`}
                        >
                          {square && (
                            <>
                              <div className="px-1 text-[10px] sm:text-xs leading-tight text-center break-words">{square}</div>
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
          )}

          {/* Players Section */}
          {(isAdmin || isTemplateMode) && (
            <div className="w-full lg:w-96 mx-auto">
              <div className="bg-[#2b2d31] rounded-lg shadow-xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
                  {isTemplateMode ? 'Season Players' : 'Players'}
                </h2>

                <div className="space-y-2 mb-4 max-h-60 sm:max-h-96 overflow-y-auto px-0.5">
                  {players.map((player, index) => {
                    const isHighlighted = highlightedPlayer === player.name.trim();
                    const assignedCount = getPlayerSquareCount(player.name.trim());
                    const canHighlight = player.name.trim() && assignedCount > 0;

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`flex-1 flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-all ${
                            canHighlight ? 'cursor-pointer' : ''
                          } ${
                            isHighlighted
                              ? 'bg-[#00d4ff]/30 ring-2 ring-[#00d4ff]'
                              : canHighlight ? 'hover:bg-[#383a40]' : ''
                          }`}
                          onClick={() => {
                            if (canHighlight && !(isAdmin && isAdminPage)) {
                              setHighlightedPlayer(highlightedPlayer === player.name.trim() ? null : player.name.trim());
                              setSelectedPlayer(highlightedPlayer === player.name.trim() ? null : player.name.trim());
                            }
                          }}
                        >
                          {isAdmin && isAdminPage ? (
                            <input
                              type="text"
                              placeholder="Player name"
                              value={player.name}
                              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                              className="flex-1 bg-transparent border-none text-gray-200 placeholder-gray-500 focus:outline-none text-sm sm:text-base"
                            />
                          ) : (
                            <span className="flex-1 text-gray-200 text-sm sm:text-base select-none">
                              {player.name || <span className="text-gray-500">Player name</span>}
                            </span>
                          )}
                          {assignedCount > 0 && (
                            <span className="text-xs sm:text-sm text-gray-400 font-semibold select-none">
                              ({assignedCount})
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={player.squares}
                          onChange={(e) => handlePlayerSquaresChange(index, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          disabled={!(isAdmin && isAdminPage)}
                          className={`w-12 sm:w-16 px-1 sm:px-2 py-1.5 sm:py-2 bg-[#313338] border border-[#404249] text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4da6ff] text-center text-sm sm:text-base ${
                            !(isAdmin && isAdminPage) ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        />
                        {isAdmin && isAdminPage && (
                          <button
                            onClick={() => handleRemovePlayer(index)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 sm:p-2"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isAdmin && isAdminPage && (
                  <button
                    onClick={handleAddPlayer}
                    className="w-full px-3 sm:px-4 py-2 bg-[#313338] text-gray-200 rounded hover:bg-[#383a40] transition-colors flex items-center justify-center gap-2 border border-[#404249] mb-3 sm:mb-4 text-sm sm:text-base"
                  >
                    <Plus size={18} className="sm:w-5 sm:h-5" />
                    Add Person
                  </button>
                )}

                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#313338] rounded border border-[#404249]">
                  <div className="text-xs sm:text-sm text-gray-300">
                    Total People: <span className="font-bold text-white">{totalRequested}</span> / 100
                  </div>
                  {totalRequested > 100 && (
                    <div className="text-xs text-red-400 mt-1">Too many squares!</div>
                  )}
                </div>

                {!isAdminPage && (
                <div className="space-y-2">
                {isAdmin && (
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
                )}
                </div>
                )}

                {isAdmin && !isAdminPage && (
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
                )}

              </div>
            </div>
          )}
        </div>

        {/* Player Squares Lookup - Hide in template mode */}
        {!isTemplateMode && totalAssigned > 0 && (
          <div className="mt-4 sm:mt-6 lg:mt-8 bg-[#2b2d31] rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Player Squares</h2>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
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