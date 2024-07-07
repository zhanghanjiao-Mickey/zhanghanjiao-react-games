// config.js
export const apiUrl = 'http://47.95.10.230:9090';
export const playerToken = 'EqeCPHNfcC34FU7qC8J/5BJEjfZLcmKA4Nb36wa7ubd1ZeZO1ywgXhfPOhbKKR9D';

export const Status = {
    GAME_OVER: { code: 0, description: "游戏结束(失败)" },
    CONTINUE: { code: 1, description: "游戏继续" },
    CLEARED: { code: 2, description: "过关" },
    GAME_WIN: { code: 3, description: "游戏结束(通关)" }
};