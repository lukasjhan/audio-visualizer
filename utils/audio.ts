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

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.gainNode = this.audioContext.createGain();

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  play(): void {
    if (!this.isPlaying && this.buffer) {
      this.setupSource(); // 항상 새 source 노드를 생성해야 합니다.
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
      this.setupSource(); // 초기 상태로 source 노드 재설정
    }
  }

  getCurrentTime(): number {
    return this.audioContext.currentTime;
  }

  setVolume(level: number) {
    if (!this.gainNode) return;

    // 볼륨 레벨을 1~10 사이로 제한
    this.volume = Math.min(Math.max(level, 1), 10);
    // GainNode의 gain 값을 설정하여 볼륨 조정
    this.gainNode.gain.value = this.volume / 10;
  }
}
