'use client';

export class AudioManager {
  public audioContext: AudioContext;
  public source: AudioBufferSourceNode | null;
  public buffer: AudioBuffer | null;
  public isPlaying: boolean;
  public analyser: AnalyserNode | null;
  public dataArray: Uint8Array | null;
  public volume: number;
  public gainNode: GainNode | null;

  constructor() {
    this.audioContext = new AudioContext();
    this.source = null;
    this.buffer = null;
    this.analyser = null;
    this.dataArray = null;
    this.isPlaying = false;

    this.volume = 5;
    this.gainNode = null;
  }

  async load(url: string): Promise<void> {
    const response = await fetch(url);
    const audioBlob = await response.blob();
    // blob = arraybuffer + type string(audio/mpeg3)
    this.buffer = await this.audioContext.decodeAudioData(
      await audioBlob.arrayBuffer()
    );
    this.setupSource();
  }

  private setupSource(): void {
    this.audioContext = new AudioContext();
    if (this.source) {
      this.source.disconnect();
    }
    this.source = this.audioContext.createBufferSource();
    if (this.buffer) {
      this.source.buffer = this.buffer;
    }
    this.source.start(0, 0);
    this.audioContext.suspend();

    // 오디오의 크기를 분석하는 노드.
    // fftSize는 분석하는 데이터의 크기를 나타냄
    // dataArray에다가 정보를 갱신한다.
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // 오디오의 크기를 담당하는 노드.
    this.gainNode = this.audioContext.createGain();

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  play(): void {
    if (!this.isPlaying && this.buffer) {
      this.setupSource();
      this.source!.start(0);
      this.isPlaying = true;
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.audioContext.suspend().then(() => {
        this.isPlaying = false;
      });
    }
  }

  resume(): void {
    if (!this.isPlaying) {
      this.audioContext.resume().then(() => {
        this.isPlaying = true;
      });
    }
  }

  reset(): void {
    if (this.isPlaying || this.audioContext.state === 'suspended') {
      this.setupSource();
    }
  }

  getCurrentTime(): number {
    return this.audioContext.currentTime;
  }

  setVolume(level: number) {
    if (!this.gainNode) return;

    this.volume = Math.min(Math.max(level, 1), 10);
    this.gainNode.gain.value = this.volume / 10;
  }
}
