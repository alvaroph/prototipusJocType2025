<template>
  <div class="game-container">
    <div class="game-engine">
      <div class="tema-partida" v-if="tema">Tema: {{ tema }}</div>
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
        ref="textInput"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import communicationManager from '../services/communicationManager.js';

const props = defineProps({
  diccionario: {
    type: Array,
    default: () => [],
  },
  tema: {
    type: String,
    default: '',
  },
});

const textInput = ref(null);
defineExpose({
  focusInput: () => {
    textInput.value?.focus();
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
/* Estructura principal */
.game-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 4rem;
  padding-top: 10vh;
}

/* Estilos globales inspirados en Monkeytype */
body {
  background-color: #323437;
  color: #d1d0c5;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  min-height: 100vh;
  margin: 0;
  padding: 2rem;
}

.game-engine {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.tema-partida {
  color: #e2b714;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.paraules-container {
  font-size: 1.5rem;
  line-height: 2.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #2c2e31;
  border-radius: 8px;
  position: relative;
  display: block; /* Para que las palabras se apilen */
  height: 14rem; /* Ajustado para 5 palabras */
  overflow-y: hidden; /* Ocultar scroll */
}

.paraula {
  margin: 0.2em 0.5em;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #646669; /* Color para palabras pendientes */
}

.paraula-activa {
  background-color: #e2b714; /* Color amarillo del tema */
  color: #2c2e31; /* Texto oscuro para contraste */
}

/* Aseguramos que el texto dentro de la palabra activa también cambie */
.paraula-activa .lletra-correcta {
  color: #2c2e31;
}

.paraula-completada {
  color: #d1d0c5; /* Color para palabras completadas */
}

.lletra-pendent {
  color: #646669;
}

.lletra-correcta {
  color: #d1d0c5; /* Letras correctas en la palabra activa */
}

.lletra-incorrecta {
  color: #ca4754; /* Letras incorrectas */
  text-decoration: underline;
}

.text-input {
  background-color: #2c2e31;
  color: #e2b714; /* Color del texto del input (amarillo) */
  border: 2px solid #646669;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  width: 80%;
  max-width: 500px;
  text-align: center;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  outline: none;
}

.text-input:focus {
  border-color: #e2b714;
}

.debug-info, p {
  color: #646669; /* Color para texto secundario */
  margin-top: 1rem;
}

/* Panel de estadísticas */
.stats-panel {
  width: 250px;
  padding: 1rem;
  background-color: #2c2e31;
  border-radius: 8px;
  color: #646669;
}

.stats-panel h3 {
  color: #e2b714;
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.stat-streak {
  border-bottom: 1px solid rgba(100, 102, 105, 0.4);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.stat-streak-count {
  font-weight: 600;
  color: #e2b714;
}

.stat-details {
  display: flex;
  gap: 1rem;
}

.stat-errors {
  color: #ca4754;
}

.stat-errors.no-errors {
  color: #70a75c; /* Un verde agradable a la vista */
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.keyboard-key {
  background-color: #4a4d50;
  border: 1px solid #323437;
  border-radius: 6px;
  color: #d1d0c5;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 4px;
  padding: 12px 18px;
  transition: all 0.1s ease-in-out;
  box-shadow: 0 2px 0 #2c2e31;
  transform: translateY(0);
}

.tecla-premuda {
  background-color: #e2b714;
  color: #2c2e31;
  transform: translateY(2px);
  box-shadow: none;
}

.tecla-remota {
  background-color: #4caf50;
  color: #1e1f22;
  box-shadow: none;
  transform: translateY(1px);
}
</style>