const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
});

//hash map
const clients = {};
const gameIds = {};
const mapping_user_with_game = {};

const typesDef = {
    GAME_EVENT: 'gameevent',
    PADDLE_EVENT: 'paddleEvent',
    SCORE_EVENT: 'scoreEvent',
    BALL_EVENT: 'ballEvent',
    ERROR_EVENT:'errorEvent'
}

const broadcastMessage = (_type) => {

    for (let gameId in gameIds) {
        const json = { type: _type, data: { ...gameIds[gameId], gameId } }
        const data = JSON.stringify(json);

        gameIds[gameId].users.map((id) => {
            const conn = clients[id];
            if (conn.readyState === WebSocket.OPEN) {
                conn.send(data);
            }
        })

    }

}

const handleMessage = (message, userId) => {
    const dataFromClient = JSON.parse(message);


    if (dataFromClient.type === typesDef.GAME_EVENT) {
        const game_id = dataFromClient.gameid;
        const username = dataFromClient.username;
        

        if (gameIds.hasOwnProperty(game_id) === false) {
            gameIds[game_id] = {
                userName: [],
                users: [],
                paddle: [],
                ball: [],
                score: []
            };
        }

        if (gameIds[game_id].users.length == 2) {
            //send error message
              const error_game_id=dataFromClient.gameid;
              let error="This game id is can't be used by more than 2 player";
              const json={type:typesDef.ERROR_EVENT, data: {error,error_game_id}};
              const data = JSON.stringify(json);
              const conn=clients[userId];
              delete clients[userId];
              conn.send(data);
              return;
        }

        mapping_user_with_game[userId] = {
            gameId: "",
            userName: "",
        }

        gameIds[game_id].userName.push(username);
        gameIds[game_id].users.push(userId);

        mapping_user_with_game[userId].gameId = game_id;
        mapping_user_with_game[userId].userName = username;
        broadcastMessage(dataFromClient.type);
    }
    else if (dataFromClient.type === typesDef.PADDLE_EVENT) {
        const paddle1 = dataFromClient.paddle1;
        const paddle2 = dataFromClient.paddle2;
        const game_id = dataFromClient.game_id;
        const playerId = dataFromClient.playerId;

        //push score
        if (gameIds[game_id].paddle.length < 2)
            gameIds[game_id].paddle.push([paddle1, paddle2]);
        else {
            if (playerId === 1) {
                gameIds[game_id].paddle.shift();
                gameIds[game_id].paddle.unshift([paddle1, paddle2])
            }
            else {
                gameIds[game_id].paddle.pop();
                gameIds[game_id].paddle.push([paddle1, paddle2])
            }
        }

        broadcastMessage(dataFromClient.type);

    }
    else if (dataFromClient.type === typesDef.BALL_EVENT) {
        const x = dataFromClient.x;
        const y = dataFromClient.y;
        const game_id = dataFromClient.game_id;

        if (gameIds[game_id].ball.length === 1) {
            gameIds[game_id].ball.pop();
            gameIds[game_id].ball.push([x, y]);
        } else {
            gameIds[game_id].ball.push([x, y]);
        }

        broadcastMessage(dataFromClient.type);

    }
    else if (dataFromClient.type === typesDef.SCORE_EVENT) {
        const game_id = dataFromClient.game_id;
        const leftScore = dataFromClient.left;
        const rightScore = dataFromClient.right;

        if (gameIds[game_id].score.length === 1) {
            gameIds[game_id].score.pop();
            gameIds[game_id].score.push([leftScore, rightScore]);
        } else {
            gameIds[game_id].score.push([leftScore, rightScore]);
        }

        broadcastMessage(dataFromClient.type);


    } else {
        //do nothing
    }


}


function handleDisconnect(userId) {
    if (mapping_user_with_game.hasOwnProperty(userId) === false) return;

    console.log(`${userId} disconnected.`);
    const json = { type: typesDef.GAME_EVENT };
    console.log(mapping_user_with_game[userId])
    const game_id = mapping_user_with_game[userId]?.gameId;
    const username = mapping_user_with_game[userId]?.userName;

    // const paddle_idx = gameIds[game_id]?.users?.findIndex((_id) => _id === userId);


    delete clients[userId];
    gameIds[game_id].users = gameIds[game_id]?.users.filter((id) => id !== userId);
    gameIds[game_id].userName = gameIds[game_id]?.userName.filter((name) => name !== username);
    gameIds[game_id].paddle = []
    gameIds[game_id].score = []
    gameIds[game_id].ball = [];
    

    if (gameIds[game_id].users.length === 0) delete gameIds[game_id];
    delete mapping_user_with_game[userId];

    broadcastMessage(typesDef.GAME_EVENT);
}


wsServer.on('connection', function (connection) {
    const userId = uuidv4();
    console.log('Recieved a new connection');
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    connection.on('open', () => console.log("connection is opened"));
    connection.on('message', (message) => handleMessage(message, userId));
    connection.on('close', () => handleDisconnect(userId));
});


