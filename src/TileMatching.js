import React, { useEffect, useState } from 'react';
import './TileMatching.css';
import { apiUrl, Status } from './config';

const TileMatching = () => {
    const [globalToken, setGlobalToken] = useState('');
    const [levelName, setLevelName] = useState('关卡名称');
    const [lives, setLives] = useState(0);
    const [hints, setHints] = useState(0);
    const [timer, setTimer] = useState(0);
    const [board, setBoard] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [playerToken, setPlayerToken] = useState('');
    const [level, setLevel] = useState(1);
    const [hintCoords, setHintCoords] = useState([]); // 新增状态用于存储提示返回的位置

    useEffect(() => {
        const fetchTokenAndInitGame = async () => {
            try {
                // Fetch the token
                const tokenResponse = await fetch(`${apiUrl}/sys/login`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any other headers needed for login
                    },
                });
                const responseData = await tokenResponse.json(); // 解析响应体为 JSON 数据
                const token = responseData.token; // 获取 token 属性
                console.log('Token fetched:', token);
                setPlayerToken(token); // Save token to state

                // Fetch player data using the token
                const gamePlayerResponse = await fetch(`${apiUrl}/game/tile-matching/init/player`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token-Player': token,
                    },
                });
                const playerData = await gamePlayerResponse.json();
                console.log('playerData:', playerData);
                setLives(playerData.life);
                setHints(playerData.tips);

                // Fetch game data using the token
                const gameDataResponse = await fetch(`${apiUrl}/game/tile-matching/init/level`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token-Player': token,
                    },
                });
                const gameData = await gameDataResponse.json();
                console.log(gameData);
                setLevelName(`Level ${level} : ${gameData.name}`);
                setTimer(gameData.time);
                setBoard(gameData.matrix || []); // 确保 gameData.matrix 是一个数组
            } catch (error) {
                console.error('Error fetching token or game data:', error);
            }
        };

        fetchTokenAndInitGame();
    }, []);

    useEffect(() => {
        const init = async () => {
            console.log('开始渲染');
            // Fetch game data using the token
            const gameDataResponse = await fetch(`${apiUrl}/game/tile-matching/init/level`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Token-Player': playerToken,
                },
            });
            const gameData = await gameDataResponse.json();
            console.log(gameData);
            setLevelName(`Level ${level} : ${gameData.name}`);
            setTimer(gameData.time);
            setBoard(gameData.matrix || []); // 确保 gameData.matrix 是一个数组
        };
        if (playerToken) {
            init();
        }
    }, [level]);

    useEffect(() => {
        let timerInterval = null;
        if (timer > 0) {
            timerInterval = setInterval(() => {
                setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timerInterval);
    }, [timer]);

    const handleTileClick = (i, j) => {
        const clickedNumber = board[i][j];
        if (!selectedTile) {
            setSelectedTile({ row: i, col: j });
        } else if (selectedCoords && selectedCoords.row === i && selectedCoords.col === j) {
            setSelectedTile(null);
        } else {
            const requestData = {
                p1: selectedCoords,
                p2: { row: i, col: j },
                matrix: board,
            };
            fetch(`${apiUrl}/game/tile-matching/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token-Player': playerToken,
                },
                body: JSON.stringify(requestData),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('link接口返回数据：');
                    console.log(data);
                    switch (data.status) {
                        case Status.CLEARED.code:
                            alert(`恭喜您通过第 ${level} 关！！`);
                            setLevel(level + 1);
                            break;
                        case Status.GAME_WIN.code:
                            alert('您已通关！！');
                            setLevel(1);
                            break;
                        case Status.GAME_OVER.code:
                            alert('您已失败（生命<0）！！');
                            setLevel(1);
                            break;
                        case Status.CONTINUE.code:
                            if (data.match === 1) {
                                console.log('正常消除');
                                setLives(data.life);
                                setHintCoords([]);
                                setTimer(prevTimer => (prevTimer + 1 <= 100 ? prevTimer + 1 : 100));
                                setBoard(data.matrix || board.map((row, rowIndex) =>
                                    row.map((cell, colIndex) =>
                                        data.path.some(coord => coord.row === rowIndex && coord.col === colIndex) ? 0 : cell
                                    )
                                ));
                                setSelectedTile(null);
                            } else {
                                setSelectedTile({ row: i, col: j });
                            }
                            break;
                        default:
                            setSelectedTile({ row: i, col: j });
                            break;
                    }
                })
                .catch(error => console.error('Error sending tiles to backend:', error));
        }
        setSelectedCoords({ row: i, col: j });
    };

    const handleHintButtonClick = () => {
        fetch(`${apiUrl}/game/tile-matching/tips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token-Player': playerToken,
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log('后端返回的数据:', data);
                setHints(data.tips);
                setHintCoords([data.p1, data.p2]); // 更新提示返回的位置
            })
            .catch(error => console.error('Error sending request:', error));
    };

    useEffect(() => {
        console.log('Lives changed:', lives);
    }, [lives]);

    useEffect(() => {
        console.log('Hints changed:', hints);
    }, [hints]);

    return (
        <div className="App">
            <header className="header">
                <div id="level-name">{levelName}</div>
                <div id="lives">生命: {lives}</div>
                <div id="hints">提示: {hints}</div>
                <div id="timer">时间条: {timer}</div>
                <button id="hint-button" onClick={handleHintButtonClick}>提示</button>
            </header>
            <div className="board" id="board">
                {board.map((row, i) =>
                    row.map((number, j) => {
                        if (i !== 0 && i !== board.length - 1 && j !== 0 && j !== row.length - 1) {
                            const isHint = hintCoords.some(coord => coord.row === i && coord.col === j); // 判断是否是提示返回的位置
                            return (
                                <div
                                    key={`${i}-${j}`}
                                    className={`tile ${selectedTile && selectedTile.row === i && selectedTile.col === j ? 'selected' : ''} ${isHint ? 'hint' : ''}`}
                                    style={{ backgroundImage: `url('textures/${number}.png')` }}
                                    onClick={() => handleTileClick(i, j)}
                                    data-row={i}
                                    data-col={j}
                                />
                            );
                        } else {
                            return null; // 在排除的情况下返回 null 或其他占位符
                        }
                    })
                )}
            </div>
        </div>
    );
};

export default TileMatching;
