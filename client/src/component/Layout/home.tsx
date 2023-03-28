import React, { useState, useEffect } from "react";
import { v4 as uuid } from 'uuid';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import LoginPage from "./Login";


const Home = () => {
    const [gameid, setGameid] = useState("");
    const [username, setUsername] = useState("");
    const [id, setId] = useState("");
    const [error, setError] = useState<string>("");
    const createId = () => {
        const uniqueId = uuid();
        console.log(uniqueId)
        setId(uniqueId);
    }
    const WS_URL = 'ws://127.0.0.1:8000';

    const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
        onOpen: () => {
            console.log('WebSocket connection established.');
        },
        share: true,
        filter: () => false,
        retryOnError: true,
        shouldReconnect: () => true

    });

    function isErrorEvent(message: WebSocketEventMap['message']) {
        let evt = JSON.parse(message.data);
        debugger
        const loacl_game_id=JSON.parse(localStorage.getItem('userData')!).gameid
        if (evt.type === 'errorEvent' && loacl_game_id===evt.data.error_game_id) {
            if (evt.data.error.length > 0 ) {
                setError(evt.data.error);
            }
        }
        return evt.type === 'errorEvent'
    }


    useWebSocket(WS_URL, {
        share: true,
        filter: isErrorEvent
    });


    useEffect(() => {
        if (gameid && readyState === ReadyState.OPEN) {
            sendJsonMessage({
                gameid,
                username,
                type: 'gameevent'
            });

            sendJsonMessage({
                gameid,
                type: 'errorEvent'
            });

            const client_id = uuid();
            const data = { gameid, username, client_id }
            localStorage.setItem('userData', JSON.stringify(data))
        }

    }, [gameid, sendJsonMessage, readyState]);



    return (
        <>
            <button onClick={createId}>Create Game Id: </button>
            {
                id.length > 0 ? <span>  {id}</span> : null
            }
            <br></br>
            <LoginPage onLogin={setGameid} userName={setUsername} />
            <br></br>
            {
                error.length>0?<span style={{color:"red"}}>{error}</span>:null
            }
        </>


    )
}

export default Home;
