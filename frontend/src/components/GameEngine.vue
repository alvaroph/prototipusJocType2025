<template>
  <div class="game-container">
    <div class="game-engine">
      <div class="paraules-container">
        <!-- Iterem sobre la llista de paraules -->
        <div v-for="(paraula, index) in estatDelJoc.paraules" :key="paraula.id" class="paraula"
          :class="{ 'paraula-activa': index === estatDelJoc.indexParaulaActiva, 'paraula-completada': paraula.estat === 'completada' }">
          <div v-if="index === estatDelJoc.indexParaulaActiva">            
              <span v-for="(lletra, indexLletra) in paraula.text.split('')" 
                   :key="indexLletra" :class="getClasseLletra(indexLletra)">
                  {{ lletra }}
              </span>    
          </div>
          <div v-else>
              {{ paraula.text }}
          </div>
        </div>
      </div>
     
     
      <div v-for="(fila,index) in filesDelTeclat" :key="index" class="keyboard-row">
          <span v-for="lletra in fila" 
          :key="lletra" 
          class="keyboard-key" 
          :class="{
            'tecla-premuda': lletra === teclaPremuda,
            'tecla-remota': lletra === teclaRemota
          }">
            {{ lletra }}
          </span>
        </div>
      <input 
        type="text" 
        class="text-input"
        v-model="estatDelJoc.textEntrat"
        @input="validarProgres"
        placeholder="Comença a escriure..."
      />
      <h2 class="debug-info">Error paraula actual: {{ estatDelJoc.contadorErrors }}</h2>
      <h2 class="debug-info">Paraula actual: {{ paraulaActiva.text }}</h2>
    </div>
    <div class="stats-panel">
      <h3>Estadístiques</h3>
      <div class="stat-item stat-streak">
        <span>Racha perfecta</span>
        <span class="stat-details">
          <span class="stat-streak-count">{{ perfectWordsStreak }}</span>
        </span>
      </div>
      <div v-for="(actual, index) in estatDelJoc.estadistiques" :key="index" class="stat-item">
        <span>{{ actual.paraula }}</span>
        <span class="stat-details">
          <span class="stat-time">{{ (actual.temps / 1000).toFixed(2) }}s</span>
          <span class="stat-errors" :class="{ 'no-errors': actual.errors === 0 }">{{ actual.errors }} errors</span>
        </span>
      </div>
      <RealtimeNotifications />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import communicationManager from '../services/communicationManager.js';
import RealtimeNotifications from './RealtimeNotifications.vue';

const props = defineProps({
  diccionario: {
    type: Array,
    default: () => [],
  },
});

const fallbackDiccionari = ['component', 'reactivitat', 'javascript', 'framework', 'template'];
let tempsIniciParaula = 0;

function construirParaules(diccionario) {
  const llista = Array.isArray(diccionario) && diccionario.length ? diccionario : fallbackDiccionari;
  const resultat = [];
  for (let i = 0; i < llista.length; i += 1) {
    resultat.push({ id: i + 1, text: String(llista[i]), estat: 'pendent' });
  }
  return resultat;
}

function reiniciarPartida(diccionario) {
  estatDelJoc.value.paraules = construirParaules(diccionario);
  estatDelJoc.value.indexParaulaActiva = 0;
  estatDelJoc.value.textEntrat = '';
  estatDelJoc.value.estadistiques = [];
  estatDelJoc.value.contadorErrors = 0;
  perfectWordsStreak.value = 0;
  tempsIniciParaula = 0;
  reportarProgres();
}

const estatDelJoc = ref({
  contadorErrors: 0,
  paraules: construirParaules(props.diccionario),
  indexParaulaActiva: 0,
  textEntrat: '',
  estadistiques: [],
});

const paraulaActiva = computed(() => {
  return estatDelJoc.value.paraules[estatDelJoc.value.indexParaulaActiva] || { text: '', estat: 'pendent' };
});

const totalCaracters = computed(() => {
  let total = 0;
  const paraules = estatDelJoc.value.paraules;
  for (let i = 0; i < paraules.length; i += 1) {
    total += paraules[i].text.length;
  }
  return total || 1;
});

const filesDelTeclat = ref([
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]);

const teclaPremuda = ref('');
const teclaRemota = ref('');
const teclesDisponibles = new Set(filesDelTeclat.value.flat());
let remoteKeyTimeout = null;
let remoteKeyListener = null;
const perfectWordsStreak = ref(0);

watch(
  () => props.diccionario,
  (nouDiccionari) => {
    reiniciarPartida(nouDiccionari);
  },
  { immediate: true }
);

let handleKeyDown=function(event) {
  const key = event.key.toUpperCase();
  teclaPremuda.value = key;
  //NETEGEM EL VALOR DE LA TECLA PREMUDA DESPRES DE 100ms
  setTimeout(() => {
    teclaPremuda.value = '';
  }, 100);

  if (teclesDisponibles.has(key)) {
    communicationManager.sendKeyPress(key);
  }

  
  console.log("Tecla premuda: ", teclaPremuda.value);
}



onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);

  remoteKeyListener = (payload) => {
    if (!payload || !payload.key) {
      return;
    }

    const key = String(payload.key).toUpperCase();
    if (!teclesDisponibles.has(key)) {
      return;
    }

    if (payload.playerId && payload.playerId === communicationManager.socket.id) {
      return;
    }

    teclaRemota.value = key;
    if (remoteKeyTimeout) {
      clearTimeout(remoteKeyTimeout);
    }
    remoteKeyTimeout = setTimeout(() => {
      teclaRemota.value = '';
      remoteKeyTimeout = null;
    }, 60);
  };

  communicationManager.socket.on('playerKeyPressed', remoteKeyListener);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (remoteKeyTimeout) {
    clearTimeout(remoteKeyTimeout);
    remoteKeyTimeout = null;
  }
  if (remoteKeyListener) {
    communicationManager.socket.off('playerKeyPressed', remoteKeyListener);
    remoteKeyListener = null;
  }
});


//getClasseLletra(indexLletra). Aquesta funció rebrà l'índex de la lletra que s'està renderitzant i haurà de retornar un string: 'lletra-correcta', 'lletra-incorrecta', o un string buit ''.
function  getClasseLletra(indexLletra) {
  const lletraEsperada = paraulaActiva.value.text[indexLletra];
  const lletraIntroduida = estatDelJoc.value.textEntrat[indexLletra];

  if (!lletraIntroduida) {
    return 'lletra-pendent';
  } else if (lletraIntroduida === lletraEsperada) {
    return 'lletra-correcta';
  } else {
  //registrem un error, incrementem el comptador d'errors en 1
    return 'lletra-incorrecta';
  }
}

function iniciarCronometreParaula() {
  tempsIniciParaula = Date.now();
}

function comptarCaractersCorrectes() {
  let total = 0;
  const estadistiques = estatDelJoc.value.estadistiques;
  for (let i = 0; i < estadistiques.length; i += 1) {
    total += estadistiques[i].paraula.length;
  }

  const paraulaActual = paraulaActiva.value?.text || '';
  const textEntrat = estatDelJoc.value.textEntrat || '';
  for (let i = 0; i < textEntrat.length && i < paraulaActual.length; i += 1) {
    if (textEntrat[i] === paraulaActual[i]) {
      total += 1;
    } else {
      break;
    }
  }

  return total;
}

function reportarProgres() {
  const totalChars = totalCaracters.value || 1;
  const correctes = comptarCaractersCorrectes();
  const percent = Math.max(0, Math.min(100, Math.round((correctes / totalChars) * 100)));

  communicationManager.reportProgress({
    charPercent: percent,
    wordsCompleted: estatDelJoc.value.estadistiques.length,
    totalWords: estatDelJoc.value.paraules.length,
  });
}

// Funció principal que s'executa a cada pulsació
function validarProgres() {
  if (!paraulaActiva.value || !paraulaActiva.value.text) {
    return;
  }
  
  //Anem a mirar si la lletra que acaba de picar es un error o no 
  console.log(estatDelJoc.value.textEntrat)
  const lletraEsperada = paraulaActiva.value.text[estatDelJoc.value.textEntrat.length - 1];
  const lletraIntroduida = estatDelJoc.value.textEntrat[estatDelJoc.value.textEntrat.length - 1];
  console.log("Lletra esperada: ", lletraEsperada);
  console.log("Lletra introduida: ", lletraIntroduida);
  if (lletraEsperada!=lletraIntroduida) {
    console.log(event.key)
      if (event.key != 'Backspace') {
       estatDelJoc.value.contadorErrors++;
      }
  }

  // Iniciem el cronòmetre només quan es comença a
  //  escriure la primera lletra
  if (estatDelJoc.value.textEntrat.length === 1 && tempsIniciParaula === 0) {
    iniciarCronometreParaula();
  }

  // Comprovem si la paraula escrita és igual a la paraula activa
  if (estatDelJoc.value.textEntrat === paraulaActiva.value.text) {
    const paraulaActualText = paraulaActiva.value.text;
    const errorsParaula = estatDelJoc.value.contadorErrors;
    const tempsTrigat = Date.now() - tempsIniciParaula;

    // Desem les estadístiques
    estatDelJoc.value.estadistiques.push({
      paraula: paraulaActualText,
      temps: tempsTrigat,
      errors: errorsParaula,
    });

    // Marquem la paraula com a completada
    paraulaActiva.value.estat = 'completada';

    if (errorsParaula === 0) {
      perfectWordsStreak.value += 1;
    } else {
      perfectWordsStreak.value = 0;
    }

    // Passem a la següent paraula
    estatDelJoc.value.indexParaulaActiva++;
    
    // Netegem l'input i reiniciem el cronòmetre
    estatDelJoc.value.textEntrat = '';
    tempsIniciParaula = 0;
    estatDelJoc.value.contadorErrors = 0;

    const haAcabat = estatDelJoc.value.indexParaulaActiva >= estatDelJoc.value.paraules.length;

    communicationManager.reportWordResult({
      word: paraulaActualText,
      errors: errorsParaula,
      duration: tempsTrigat,
      completedAll: haAcabat,
    });

    reportarProgres();
    return;
  }

  reportarProgres();
}
</script>

<style>
.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
  position: relative;
}

.game-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.4;
  pointer-events: none;
}


.game-engine,
.stats-panel {
  position: relative;
  background: var(--color-paper);
  border: 5px solid var(--color-ink);
  border-radius: 32px;
  box-shadow:
    0 18px 0 var(--color-ink),
    0 25px 45px rgba(0, 0, 0, 0.3);
  padding: 2rem;
}

.game-engine {
  max-width: 900px;
  text-align: center;
  color: var(--color-ink);
}

.game-engine::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 24px;
  border: 3px dashed rgba(27, 18, 48, 0.2);
  pointer-events: none;
}

.paraules-container {
  font-size: 1.4rem;
  line-height: 2.3rem;
  margin-bottom: 1.5rem;
  padding: 1.4rem;
  background:
    radial-gradient(circle at 18% 25%, rgba(64, 231, 185, 0.25), transparent 55%),
    var(--color-cloud);
  border: 4px solid var(--color-ink);
  border-radius: 24px;
  height: 13rem;
  overflow-y: auto;
  box-shadow: inset 0 12px 0 rgba(255, 255, 255, 0.5);
}


.paraula {
  margin: 0.2em 0.5em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: var(--color-ink);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 2px solid rgba(27, 18, 48, 0.2);
  background: rgba(255, 255, 255, 0.6);
}

.paraula-activa {
  background: linear-gradient(110deg, var(--color-pink), var(--color-violet));
  color: #fff;
  border-color: var(--color-ink);
  box-shadow: 0 8px 0 rgba(27, 18, 48, 0.6);
}

.paraula-completada {
  color: var(--color-teal);
  border-color: rgba(64, 231, 185, 0.4);
}


.lletra-pendent {
  color: rgba(27, 18, 48, 0.4);
  opacity: 0.5;
}

.lletra-correcta {
  color: var(--color-ink);
}

.lletra-incorrecta {
  color: var(--color-gold);
  text-shadow: 0 0 6px rgba(246, 195, 72, 0.6);
}

.text-input {
  background: #fff;
  color: var(--color-ink);
  border: 4px solid var(--color-ink);
  border-radius: 28px;
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  width: 80%;
  max-width: 480px;
  text-align: center;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  box-shadow: 0 8px 0 rgba(27, 18, 48, 0.4);
}

.text-input:focus {
  outline: none;
  border-color: var(--color-blue);
  box-shadow: 0 10px 0 rgba(27, 18, 48, 0.4), 0 0 0 4px rgba(79, 115, 244, 0.25);
}

.debug-info {
  color: var(--color-blue);
  font-size: 0.9rem;
  background: rgba(79, 115, 244, 0.08);
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 16px;
  border: 2px solid rgba(79, 115, 244, 0.3);
}

.stats-panel {
  width: 280px;
  color: var(--color-ink);
  background: linear-gradient(150deg, rgba(246, 195, 72, 0.2), rgba(64, 231, 185, 0.25));
}

.stats-panel::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 24px;
  border: 3px dashed rgba(27, 18, 48, 0.2);
  pointer-events: none;
}

.stats-panel h3 {
  margin: 0 0 1rem;
  color: var(--color-pink);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}


.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px dashed rgba(27, 18, 48, 0.2);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.stat-streak {
  border-bottom: 2px solid var(--color-gold);
  padding-bottom: 0.7rem;
  margin-bottom: 0.9rem;
  background: rgba(246, 195, 72, 0.2);
  border-radius: 18px;
  padding: 0.7rem;
}

.stat-streak-count {
  font-size: 1.3rem;
  color: var(--color-gold);
}

.stat-details {
  display: flex;
  gap: 1rem;
}

.stat-errors {
  color: var(--color-pink);
}

.stat-errors.no-errors {
  color: var(--color-teal);
}

.keyboard-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}

.keyboard-key {
  background: linear-gradient(150deg, var(--color-gold), var(--color-teal));
  border: 4px solid var(--color-ink);
  border-radius: 18px;
  color: var(--color-ink);
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Chelsea Market', system-ui;
  margin: 0.2rem;
  padding: 0.65rem 1.1rem;
  box-shadow: 0 6px 0 rgba(27, 18, 48, 0.6);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  min-width: 44px;
  text-align: center;
}

.keyboard-key.tecla-premuda {
  transform: translateY(3px);
  box-shadow: 0 3px 0 rgba(27, 18, 48, 0.4);
  background: linear-gradient(150deg, var(--color-pink), var(--color-violet));
  color: #fff;
}

.keyboard-key.tecla-remota {
  background: linear-gradient(150deg, var(--color-blue), var(--color-teal));
  box-shadow: 0 3px 0 rgba(20, 12, 35, 0.6);
}

@media (max-width: 1024px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .stats-panel {
    width: 100%;
  }
}
</style>
