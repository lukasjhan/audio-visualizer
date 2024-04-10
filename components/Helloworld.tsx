'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '@/utils/audio';

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function drawAudioWaveform(
  context: CanvasRenderingContext2D,
  audioBuffer: AudioBuffer,
  time: number
) {
  const canvas = context.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const channelData = audioBuffer.getChannelData(0); // 첫 번째 채널 데이터 사용
  const step = Math.ceil(channelData.length / width); // 오디오 데이터를 캔버스 너비에 맞게 줄이기 위한 단계
  const duration = audioBuffer.duration;

  context.clearRect(0, 0, width, height); // 캔버스 지우기
  context.beginPath();
  context.lineWidth = 1;

  context.strokeStyle = 'red';
  const currentTimePosition = (time / duration) * width;

  let x = 0;
  let i = 0;
  for (i = 0; i < channelData.length; i += step) {
    const y = ((1 + channelData[i]) * height) / 2; // 오디오 데이터를 캔버스 높이에 맞게 조정

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += width / (channelData.length / step); // 캔버스 너비에 맞게 x 좌표 증가
    if (x > currentTimePosition) break;
  }

  context.stroke();
  context.beginPath();

  context.strokeStyle = 'white';
  for (i; i < channelData.length; i += step) {
    const y = ((1 + channelData[i]) * height) / 2; // 오디오 데이터를 캔버스 높이에 맞게 조정

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += width / (channelData.length / step); // 캔버스 너비에 맞게 x 좌표 증가
  }
  context.stroke();

  const line = (time / duration) * canvas.width;
  context.strokeStyle = 'red';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(line, 0);
  context.lineTo(line, canvas.height);
  context.stroke();
  context.lineWidth = 1;

  const currentTimeString = formatTime(time);
  context.fillStyle = 'red';
  context.font = '16px Arial';
  context.fillText(currentTimeString, line + 45, 15); // 선의 바로 옆에 시간 표시

  const totalTimeString = formatTime(duration);
  context.fillStyle = 'white'; // 총 시간을 흰색으로 설정
  context.textAlign = 'right'; // 텍스트를 오른쪽 정렬
  context.fillText(totalTimeString, width - 10, 15); // 캔버스의 오른쪽 상단에 위치
}

export function HelloWorld() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioManager = useRef(new AudioManager());
  const [resetCount, updateResetCount] = useState<number>(0);

  useEffect(() => {
    const fetchAudioData = async () => {
      await audioManager.current.load('/api/audio');
      const audioContext = audioManager.current.audioContext;
      const audioBuffer = audioManager.current.buffer;
      if (!audioContext || !audioBuffer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Canvas에 오디오 시각화 그리기
      // 예를 들어, 오디오 파형을 그릴 수 있습니다.
      drawAudioWaveform(context, audioBuffer, 0);
    };

    fetchAudioData();
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      const audioBuffer = audioManager.current.buffer;
      if (canvas && audioBuffer) {
        const context = canvas.getContext('2d');
        if (context) {
          // 기존의 시각화 그리기
          const currentTime = audioManager.current.getCurrentTime();
          drawAudioWaveform(context, audioBuffer, currentTime);
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, resetCount]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioManager.current.pause();
    } else {
      audioManager.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    audioManager.current.pause();
    audioManager.current.reset();
    setIsPlaying(false);
    updateResetCount((prev) => prev + 1);
  };

  return (
    <div>
      <div
        style={{
          padding: '30px',
          border: '1px solid grey',
        }}
      >
        <canvas ref={canvasRef} width="1400" height="400" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button onClick={handlePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}
