import React, { useState } from "react";
import useWebSocket from 'react-use-websocket';

type propsType ={
    onLogin:React.Dispatch<React.SetStateAction<string>>,
    userName:React.Dispatch<React.SetStateAction<string>>
}
    const LoginPage = ({onLogin,userName}: propsType) => {
    const [gameid, setGameid] = useState("");
    const [name, setName] = useState("");
    const WS_URL = 'ws://127.0.0.1:8000';

    useWebSocket(WS_URL, {
        share: true,
        filter: () => false
      });

    const handleSubmit = (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(gameid==="" || name === "") console.log("error in input...")
        if(!gameid.trim() || !name.trim()) {
            return;
          }
          onLogin && onLogin(gameid);
          userName && userName(name);
          setGameid("");
          setName("")
    }

    return (
        <>
            <form  onSubmit={handleSubmit}>

                <label htmlFor="game-id" >Join by game Id: </label>
                <input type="text" value={gameid} onChange={(e) => setGameid(e.currentTarget.value)} />
                <label htmlFor="game-id" >Username: </label>
                <input type="text" value={name} onChange={(e) => setName(e.currentTarget.value)} />
                <button type="submit" >Submit</button>
            </form>
        </>


    )
}
export default LoginPage;
