import React, { useEffect, useState } from 'react';
import './TileMatching.css';
import { apiUrl, playerToken } from './config';

// 动态导入 textures 文件夹中的所有图片
// const importAll = (r) => {
//   let images = {};
//   r.keys().forEach((item) => { images[item.replace('./', '')] = r(item); });
//   return images;
// };

// const images = importAll(require.context('./textures', false, /\.(png|jpe?g|svg)$/));

const TileMatching = () => {
  const [levelName, setLevelName] = useState('关卡名称');
  const [lives, setLives] = useState(0);
  const [hints, setHints] = useState(0);
  const [timer, setTimer] = useState(0);
  const [board, setBoard] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/game/tile-matching/level/1/init`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Token-Player': playerToken
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setLevelName(`Level 1: ${data.name}`);
        setLives(data.life);
        setHints(data.tips);
        setTimer(data.time);
        setBoard(data.matrix);
      })
      .catch(error => console.error('Error fetching game data:', error));
  }, []);

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
        matrix: board
      };
      fetch(`${apiUrl}/game/tile-matching/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token-Player': playerToken
        },
        body: JSON.stringify(requestData)
      })
        .then(response => response.json())
        .then(data => {
          console.log('连接后');
          console.log(data);
          if (!data.path || data.path.length === 0 || clickedNumber !== board[selectedCoords.row][selectedCoords.col]) {
            setSelectedTile({ row: i, col: j });
          } else {
            setTimer(prevTimer => (prevTimer + 1 <= 100 ? prevTimer + 1 : 100));
            const newBoard = [...board];
            data.path.forEach(coord => {
              newBoard[coord.row][coord.col] = 0;
            });
            setBoard(newBoard);
            setSelectedTile(null);
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
        'Token-Player': playerToken
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log('后端返回的数据:', data);
      })
      .catch(error => console.error('Error sending request:', error));
  };

  return (
    <div className="App">
      <header className="header">
        <div id="level-name">{levelName}</div>
        <div id="lives">生命: <span id="lives-value">{lives}</span></div>
        <div id="hints">提示: <span id="hints-value">{hints}</span></div>
        <div id="timer">时间条: <span id="timer-value">{timer}</span></div>
        <button id="hint-button" onClick={handleHintButtonClick}>提示</button>
      </header>
      <div className="board" id="board">
{board.map((row, i) =>
  row.map((number, j) => {
    // 排除 i 和 j 等于 0 或等于 row.length - 1 的情况
    if (i !== 0 && i !== board.length - 1 && j !== 0 && j !== row.length - 1) {
      return (
        <div
          key={`${i}-${j}`}
          className={`tile ${selectedTile && selectedTile.row === i && selectedTile.col === j ? 'selected' : ''}`}
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
