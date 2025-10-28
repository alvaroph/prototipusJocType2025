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
          :class="{'tecla-premuda':lletra==teclaPremuda}">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';

const estatDelJoc = ref({
  //contador d'errors per a la paraula actual
  contadorErrors: ref(0),
  // Llista de paraules a escriure. Cada paraula és un objecte.
  paraules: [
    { id: 1, text: 'component', estat: 'pendent' },
    { id: 2, text: 'reactivitat', estat: 'pendent' },
    { id: 3, text: 'javascript', estat: 'pendent' },
    { id: 4, text: 'framework', estat: 'pendent' },
    { id: 5, text: 'template', estat: 'pendent' }
  ],
  // L'índex de la paraula que l'usuari ha d'escriure ara mateix.
  indexParaulaActiva: 0,
  // El text que l'usuari està introduint a l'input.
  textEntrat: '',
  // Un array on guardarem els resultats de cada paraula.
  estadistiques: [],
});

const filesDelTeclat = ref([
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]);

const teclaPremuda = ref('');

let handleKeyDown=function(event) {
  teclaPremuda.value = event.key.toUpperCase();
  //NETEGEM EL VALOR DE LA TECLA PREMUDA DESPRES DE 100ms
  setTimeout(() => {
    teclaPremuda.value = '';
  }, 100);

  
  console.log("Tecla premuda: ", teclaPremuda.value);
}



onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
   window.removeEventListener('keydown', handleKeyDown);
})


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

// Afegeix també una propietat computada per accedir fàcilment a la paraula activa
const paraulaActiva = computed(() => {
  return estatDelJoc.value.paraules[estatDelJoc.value.indexParaulaActiva];
});

// Variable per guardar el temps d'inici de cada paraula
let tempsIniciParaula = 0;

function iniciarCronometreParaula() {
  tempsIniciParaula = Date.now();
}

// Funció principal que s'executa a cada pulsació
function validarProgres() {
  
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
    const tempsTrigat = Date.now() - tempsIniciParaula;
    
    // Desem les estadístiques
    estatDelJoc.value.estadistiques.push({
      paraula: paraulaActiva.value.text,
      temps: tempsTrigat,
      errors: estatDelJoc.value.contadorErrors,
    });

    // Marquem la paraula com a completada
    paraulaActiva.value.estat = 'completada';

    // Passem a la següent paraula
    estatDelJoc.value.indexParaulaActiva++;
    
    // Netegem l'input i reiniciem el cronòmetre
    estatDelJoc.value.textEntrat = '';
    tempsIniciParaula = 0;
    estatDelJoc.value.contadorErrors = 0;

    // Si hi ha una següent paraula
    if (estatDelJoc.value.indexParaulaActiva < estatDelJoc.value.paraules.length) {
      // (Podem afegir lògica addicional aquí si volem)
    } else {
      // Joc acabat!
      console.log('Joc acabat!', estatDelJoc.value.estadistiques);
      alert("FINAL DEL JOC!");
    }
  }
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

.paraules-container {
  font-size: 1.5rem;
  line-height: 2.5rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #2c2e31;
  border-radius: 8px;
  position: relative;
  display: block; /* Para que las palabras se apilen */
  height: 13rem; /* 2.5rem de line-height * 5 + padding */
  overflow-y: auto; /* Scroll vertical si es necesario */
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
</style>