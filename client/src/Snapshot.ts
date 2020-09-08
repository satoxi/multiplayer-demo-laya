interface IInputData {
  input: number;
  inputID: number;
}

interface ISnapshot {
  lastProcessedInput: number;
  position: Muse.Vector;
  velocity: Muse.Vector;
  timestamp: number;
}
