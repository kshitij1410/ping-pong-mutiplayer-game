import React, { useState } from 'react';
import './App.css';
import PingPongBoard from './component/ping';
import { Player } from "./component/types";
import Home from './component/Layout/home'
import Loading from './component/Layout/LoadingPage';
import useWebSocket from 'react-use-websocket';


const initialScore = {
  [Player.LEFT]: 0,
  [Player.RIGHT]: 0,
};

function App() {
  const [score, setScore] = React.useState(initialScore);
  const [total_user, setTotal_user] = useState<number>(0);
  const [game_id, setGame_id] = useState<String | null>(null);
  const WS_URL = 'ws://127.0.0.1:8000';
  const [playerId, setPlayerId] = useState<number>(0);
  


  function isGameEvent(message: WebSocketEventMap['message']) {
    let evt = JSON.parse(message.data);
    const username = JSON.parse(localStorage.getItem('userData')!).username;
    if (evt.type === 'gameevent') {
      setTotal_user(evt.data.users.length);
      setGame_id(evt.data.gameId)
      if (username === evt.data.userName[0]) {
        setPlayerId(1);
      }
      else setPlayerId(2);
    }
    return evt.type === 'gameevent';
  }

 

  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isGameEvent
  });
  



  return (
    <>

      {
        game_id !== null ?
          (total_user === 2 ?
            <>
              <h1>Ping Pong Game</h1>
              <h5>Player {playerId} you are using paddle {playerId}</h5>
              <PingPongBoard
                score={score}
                playerId={playerId}
                setScore={setScore}
              />
            </>

            : <Loading />
          ) :
          <Home />
      }

    </>
  );
}

export default App;
