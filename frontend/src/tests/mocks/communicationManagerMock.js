import { reactive } from 'vue';

export function createCommunicationManagerMock(overrides = {}) {
  const state = reactive({
    jugadors: [],
    notifications: [],
    progressSnapshot: [],
    streakTarget: 2,
    room: '',
    gameFinished: null,
    ...(overrides.state || {}),
  });

  return {
    state,
    socket: {
      on: jest.fn(),
      off: jest.fn(),
      id: 'mock-socket',
      ...(overrides.socket || {}),
    },
    reportWordResult: jest.fn(),
    reportProgress: jest.fn(),
    sendKeyPress: jest.fn(),
    requestGameStart: jest.fn(),
    ...(overrides.methods || {}),
  };
}
