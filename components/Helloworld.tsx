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
  const channelData = audioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  const duration = audioBuffer.duration;

  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.lineWidth = 1;

  context.strokeStyle = 'red';
  const currentTimePosition = (time / duration) * width;

  let x = 0;
  let i = 0;
  for (i = 0; i < channelData.length; i += step) {
    const y = ((1 + channelData[i]) * height) / 2;

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += width / (channelData.length / step);
    if (x > currentTimePosition) break;
  }

  context.stroke();
  context.beginPath();

  context.strokeStyle = 'white';
  for (i; i < channelData.length; i += step) {
    const y = ((1 + channelData[i]) * height) / 2;

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += width / (channelData.length / step);
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [resetCount, updateResetCount] = useState<number>(0);
  const [audioManager, setAudioManger] = useState<AudioManager | null>(null);
  const [volume, setVolume] = useState(5);

  useEffect(() => {
    const fetchAudioData = async () => {
      const audioManager = new AudioManager();
      setAudioManger(audioManager);
      await audioManager.load('/api/audio');
      const audioContext = audioManager.audioContext;
      const audioBuffer = audioManager.buffer;
      if (!audioContext || !audioBuffer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      drawAudioWaveform(context, audioBuffer, 0);
    };

    fetchAudioData();
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!audioManager) return;
      const audioBuffer = audioManager.buffer;
      if (canvas && audioBuffer) {
        const context = canvas.getContext('2d');
        if (context) {
          const currentTime = audioManager.getCurrentTime();
          drawAudioWaveform(context, audioBuffer, currentTime);
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioManager, isPlaying, resetCount]);

  const handlePlayPause = () => {
    if (!audioManager) return;
    if (isPlaying) {
      audioManager.pause();
    } else {
      audioManager.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (!audioManager) return;
    audioManager.pause();
    audioManager.reset();
    setIsPlaying(false);
    updateResetCount((prev) => prev + 1);
  };

  useEffect(() => {
    let animationFrameId: number;

    const drawFrequencyBars = () => {
      if (!audioManager) return;
      const canvas = canvas2Ref.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const width = canvas.width;
      const height = canvas.height;
      const dataArray = audioManager.dataArray;
      const analyser = audioManager.analyser;
      if (!dataArray || !analyser) return;
      const barWidth = (width / dataArray.length) * 1.5;
      let barHeight;
      let x = 0;

      context.clearRect(0, 0, width, height);

      analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i];

        context.fillStyle = 'rgb(' + (barHeight + 120) + ',50,50)';
        context.fillRect(
          x,
          height - barHeight * 0.6,
          barWidth,
          barHeight * 0.6
        );

        x += barWidth + 1;
      }

      animationFrameId = requestAnimationFrame(drawFrequencyBars);
    };
    drawFrequencyBars();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioManager, isPlaying, resetCount]);

  const increaseVolume = () => {
    if (!audioManager) return;
    audioManager.setVolume(volume + 1);
    setVolume(audioManager.volume);
  };

  const decreaseVolume = () => {
    if (!audioManager) return;
    audioManager.setVolume(volume - 1);
    setVolume(audioManager.volume);
  };

  return (
    <div>
      <div
        style={{
          padding: '30px',
          border: '1px solid grey',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <canvas ref={canvasRef} width="1400" height="400" />
        <canvas ref={canvas2Ref} width="1400" height="200" />
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
        <button onClick={decreaseVolume}>-</button>
        <span> {`[${volume}]`} </span>
        <button onClick={increaseVolume}>+</button>
      </div>
    </div>
  );
}
