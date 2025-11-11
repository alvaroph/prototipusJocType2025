import { mount } from '@vue/test-utils';
import RealtimeNotifications from '../RealtimeNotifications.vue';

jest.mock('@/services/communicationManager.js', () => {
  const { createCommunicationManagerMock } = require('@/tests/mocks/communicationManagerMock.js');
  return {
    __esModule: true,
    default: createCommunicationManagerMock(),
  };
});

import communicationManager from '@/services/communicationManager.js';

const mockManager = communicationManager;

describe('RealtimeNotifications.vue', () => {
  beforeEach(() => {
    mockManager.state.progressSnapshot.splice(0, mockManager.state.progressSnapshot.length);
    mockManager.state.notifications.splice(0, mockManager.state.notifications.length);
  });

  it('mostra el progrés agregat de jugadors', () => {
    mockManager.state.progressSnapshot.push({
      id: '1',
      name: 'Tester',
      charPercent: 45,
      wordsCompleted: 2,
      totalWords: 5,
    });

    const wrapper = mount(RealtimeNotifications);
    expect(wrapper.text()).toContain('Tester');
    expect(wrapper.text()).toContain('2 / 5');
  });

  it('renderitza notificacions i reacciona al canvi', async () => {
    mockManager.state.notifications.push({ id: 'notif-1', name: 'Alex', streak: 3, target: 5, word: 'hola' });

    const wrapper = mount(RealtimeNotifications);
    expect(wrapper.text()).toContain('Alex');

    mockManager.state.notifications.splice(0, 1);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain('Alex');
  });
});
