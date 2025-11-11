import { CommunicationManager } from '../communicationManager.js';

function createSocketMock() {
  const listeners = {};
  const socket = {
    emit: jest.fn(),
    on: jest.fn((event, handler) => {
      listeners[event] = handler;
      return socket;
    }),
  };
  return { socket, listeners };
}

describe('CommunicationManager', () => {
  let socket;
  let listeners;
  let manager;

  beforeEach(() => {
    jest.useFakeTimers();
    const mock = createSocketMock();
    socket = mock.socket;
    listeners = mock.listeners;
    manager = new CommunicationManager(() => socket);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('unirSala envia joinRoom i desa el nom', () => {
    manager.unirSala('TestPlayer', 'arena');

    expect(socket.emit).toHaveBeenCalledWith('joinRoom', { name: 'TestPlayer', room: 'arena' });
    expect(manager.state.playerName).toBe('TestPlayer');
  });

  test('reportProgress normalitza els valors', () => {
    manager.reportProgress({ charPercent: 50 });

    expect(socket.emit).toHaveBeenCalledWith('playerProgress', {
      charPercent: 50,
      wordsCompleted: 0,
      totalWords: 0,
    });
  });

  test('pushNotification elimina la notificació després del timeout', () => {
    manager.pushNotification({ name: 'Player', streak: 2 });

    expect(manager.state.notifications).toHaveLength(1);
    jest.runAllTimers();
    expect(manager.state.notifications).toHaveLength(0);
  });

  test('listener playerStreak genera notificació', () => {
    const handler = listeners.playerStreak;
    expect(typeof handler).toBe('function');

    handler({ name: 'Alex', streak: 3, target: 5, word: 'hola' });

    expect(manager.state.notifications[0]).toMatchObject({
      name: 'Alex',
      streak: 3,
      target: 5,
      word: 'hola',
    });
  });
});
