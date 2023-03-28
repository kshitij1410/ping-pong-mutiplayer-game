import React from "react";
import useWebSocket from 'react-use-websocket';
import {
  canvasWidth,
  canvasHeight,
  Pallet1X,
  Pallet2X,
  initialBall,
} from "./constants";

import {
  drawCanvas,
  drawPallet,
  checkBallCollision,
  checkIfBallIsInCanvas,
  drawBall,
  drawScore
} from "./helpers";


import { Ball, Score } from "./types";

interface UseCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  yPlayer1: number;
  yPlayer2: number;
  setScore: React.Dispatch<React.SetStateAction<Score>>;
  score: Score,
  playerId: number
}
const useCanvas = ({
  canvasRef,
  yPlayer1,
  yPlayer2,
  setScore,
  score,
  playerId
}: UseCanvasProps) => {

  const ball = React.useRef<Ball>(initialBall);
  const WS_URL = 'ws://127.0.0.1:8000';

  const isBallEvent = (message: WebSocketEventMap['message']) => {
    let evt = JSON.parse(message.data);

    if (evt.type === 'ballEvent') {
        const [x, y] = evt.data.ball[0];
        ball.current.x = x;
        ball.current.y = y;
    }
    return evt.type === 'ballEvent';
  }

  const isScoreEvent = (message: WebSocketEventMap['message']) => {
    let evt = JSON.parse(message.data);

    if (evt.type === 'scoreEvent') {
      if (evt.data.users.length === 2) {
        if (evt.data.score.length === 1) {
          const [left, right] = evt.data.score[0];
          if (left !== 0 && right !== 0) {
            setScore({
              "left": left,
              "right": right
            })
          }

        }
      }
      else {
        setScore({
          "left": 0,
          "right": 0
        })
      }

    }

    return evt.type === 'scoreEvent';
  }


  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isBallEvent,
  });

  useWebSocket(WS_URL, {
    share: true,
    filter: isScoreEvent,
  });




  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Missing canvas ref");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Missing context ref");
    let frameCount = 0;
    let animationFrameId: number | null = null;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      drawCanvas({ ctx, frameCount });
      drawPallet({
        ctx,
        frameCount,
        pos: { x: Pallet1X, y: yPlayer1 },
      });
      const game_id = JSON.parse(localStorage.getItem('userData')!).gameid;

      drawScore(ctx, (score.left).toString(), canvasWidth / 4, canvasHeight / 5);
      drawScore(ctx, (score.right).toString(), 3 * canvasWidth / 4, canvasHeight / 5);
      const isFirstPlayer = ball.current.x < canvasWidth / 2;

      ball.current = checkBallCollision({
        palletY: isFirstPlayer ? yPlayer1 : yPlayer2,
        palletX: isFirstPlayer ? Pallet1X : Pallet2X,
        ball: ball.current,
        sign: isFirstPlayer ? 1 : -1,
      });

      const { ball: ballUpdated, pointFor } = checkIfBallIsInCanvas(
        ball.current
      );
      ball.current = ballUpdated;

      if (pointFor) {
        setScore((prevScore) => ({
          ...prevScore,
          [pointFor]: prevScore[pointFor] + 1,
        }));
        ball.current = initialBall;
      }

      drawBall({
        ctx,
        frameCount,
        pos: { x: ball.current.x, y: ball.current.y },
      });

      drawPallet({
        ctx,
        frameCount,
        pos: { x: Pallet2X, y: yPlayer2 },
      });

      sendJsonMessage({
        type: 'ballEvent',
        x: ball.current.x,
        y: ball.current.y,
        game_id,
      });

      sendJsonMessage({
        type: 'scoreEvent',
        left: score['left'],
        right: score['right'],
        game_id
      });


      animationFrameId = window.requestAnimationFrame(render);

    };

    render();

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };

  }, [ball, canvasRef, setScore, yPlayer1, yPlayer2]);
};

export default useCanvas;
