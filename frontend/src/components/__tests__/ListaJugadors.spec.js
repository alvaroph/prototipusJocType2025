import { mount } from '@vue/test-utils';
import ListaJugadors from '../ListaJugadors.vue';

jest.mock('@/services/communicationManager.js', () => {
  const { createCommunicationManagerMock } = require('@/tests/mocks/communicationManagerMock.js');
  return {
    __esModule: true,
    default: createCommunicationManagerMock(),
  };
});

import communicationManager from '@/services/communicationManager.js';

const mockManager = communicationManager;

describe('ListaJugadors.vue', () => {
  beforeEach(() => {
    mockManager.state.jugadors.splice(0, mockManager.state.jugadors.length);
  });

  it('mostra els jugadors actius', () => {
    mockManager.state.jugadors.push(
      { id: '1', name: 'Alex' },
      { id: '2', name: 'Maria' },
    );

    const wrapper = mount(ListaJugadors);
    const pills = wrapper.findAll('span');

    expect(pills).toHaveLength(2);
    expect(wrapper.text()).toContain('Alex');
    expect(wrapper.text()).toContain('Maria');
  });
});
