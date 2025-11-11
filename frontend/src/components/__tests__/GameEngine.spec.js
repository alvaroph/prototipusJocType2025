import { mount, flushPromises } from '@vue/test-utils';
import GameEngine from '../GameEngine.vue';

jest.mock('@/services/communicationManager.js', () => {
  const { createCommunicationManagerMock } = require('@/tests/mocks/communicationManagerMock.js');
  return {
    __esModule: true,
    default: createCommunicationManagerMock(),
  };
});

import communicationManager from '@/services/communicationManager.js';

const mockManager = communicationManager;

describe('GameEngine.vue', () => {
  beforeEach(() => {
    mockManager.reportWordResult.mockClear();
    mockManager.reportProgress.mockClear();
    mockManager.sendKeyPress.mockClear();
  });

  it('renderitza les paraules del diccionari', () => {
    const wrapper = mount(GameEngine, {
      props: { diccionario: ['hola', 'adeu'] },
    });

    expect(wrapper.text()).toContain('hola');
    expect(wrapper.text()).toContain('adeu');
  });

  it('informa el resultat quan es completa una paraula', async () => {
    const wrapper = mount(GameEngine, {
      props: { diccionario: ['hola'] },
    });

    const input = wrapper.find('input');
    await input.setValue('hola');
    await flushPromises();

    expect(mockManager.reportWordResult).toHaveBeenCalled();
    expect(mockManager.reportProgress).toHaveBeenCalled();
  });
});
