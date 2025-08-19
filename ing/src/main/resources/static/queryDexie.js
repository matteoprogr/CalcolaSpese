  import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
  import { fetchDownload } from './upload.js';
  import { showToast } from './upload.js';
  import { showErrorToast } from './upload.js';



let db;
initDB();// variabile globale per il database

// Funzione di inizializzazione del database
export function initDB() {
  if (!db) {
    db = new Dexie('TieniIlContoDB');
    db.version(1).stores({
      spese: '++id, categoria, importo, dataSpesa, [categoria+dataSpesa], [categoria+importo], [importo+dataSpesa], [categoria+importo+dataSpesa]',
      categorie: '&categoria'
    });
  }
  return db;
}

// Salvataggio di una spesa
export async function saveSpesa(spesa) {
  try {

    initDB();
    const fomattedISO = new Date(spesa.dataSpesa).toISOString().split('T')[0];

    const data = {
      ...spesa,
      dataInserimento: new Date().toISOString(),
      dataSpesa: fomattedISO
    };

    await saveCategoria(spesa.categoria);
    const id = await db.spese.add(data);
    await popolaCategoria();

    return { success: true, id };
  } catch (error) {
    console.error("Errore nel salvataggio spesa:", error);
    return { success: false, error };
  }
}

async function saveCategoria(categoria) {
  const categoriaLower = categoria.toLowerCase();
  try {
    await db.categorie.add({ categoria: categoriaLower });
    console.log(`Categoria "${categoriaLower}" aggiunta.`);
  } catch (error) {
    if (error.name !== 'ConstraintError') {
      console.error('Errore durante l\'aggiunta della categoria:', error);
    }
  }
}

// Ricerca spese con più criteri combinati
export async function querySpese(criteri = {}) {
  let collezione = db.spese;

  // indici singoli
    if (criteri.categoria && !criteri.importoMin && !criteri.importoMax && !criteri.dataInizio && !criteri.dataFine) {
      collezione = collezione.where('categoria').equals(criteri.categoria);
    }
    if ((criteri.importoMin != null || criteri.importoMax != null) && !criteri.categoria && !criteri.dataInizio && !criteri.dataFine) {
      const min = criteri.importoMin ?? -Infinity;
      const max = criteri.importoMax ?? Infinity;
      collezione = collezione.where('importo').between( min, max, true, true );
    }
    if ((criteri.dataInizio || criteri.dataFine) && !criteri.categoria && !criteri.importoMin && !criteri.importoMax) {
      const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
      const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
      collezione = collezione.where('dataSpesa').between(start, end,true,true);
    }

  // Utilizza indice composto
    if (criteri.categoria && (criteri.dataInizio || criteri.dataFine) && !criteri.importoMin  && !criteri.importoMax) {
        const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
        const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
        collezione = collezione
          .where('[categoria+dataSpesa]')
          .between([criteri.categoria, start], [criteri.categoria, end],true,true);
    }
    if (criteri.categoria && (criteri.importoMin != null || criteri.importoMax != null) && !criteri.dataInizio && !criteri.dataFine) {
        const min = criteri.importoMin ?? -Infinity;
        const max = criteri.importoMax ?? Infinity;
        collezione = collezione
        .where('[categoria+importo]')
        .between([criteri.categoria, min], [criteri.categoria, max],true,true);
    }
    if ((criteri.importoMin != null || criteri.importoMax != null) && (criteri.dataInizio || criteri.dataFine) && !criteri.categoria) {
        const min = criteri.importoMin ?? -Infinity;
        const max = criteri.importoMax ?? Infinity;
        const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
        const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
        collezione = collezione
        .where('[importo+dataSpesa]')
        .between([ min , start ], [ max, end ],true,true);
    }
    if (criteri.categoria && (criteri.importoMin != null || criteri.importoMax != null) && (criteri.dataInizio || criteri.dataFine)) {
        const min = criteri.importoMin ?? -Infinity;
        const max = criteri.importoMax ?? Infinity;
        const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
        const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
        collezione = collezione
        .where('[categoria+importo+dataSpesa]')
        .between([ criteri.categoria, min , start], [ criteri.categoria , max , end ],true,true);
    }


  return collezione.toArray();
}

export async function deleteSpese(criteri = {}) {
    if (Array.isArray(criteri) && criteri.length > 0) {
        await db.spese
            .toCollection()
            .filter(spesa => criteri.includes(spesa.dataInserimento))
            .delete();
        return;
    }
}


export async function popolaCategoria(){
  const selectCategoria = document.getElementById("categoria");
  selectCategoria.innerHTML = "";

  // Recupera tutte le categorie dalla tabella 'categorie'
  const categorie = await db.categorie.toArray();

    if(document.getElementById('iDoption') === null){
      // Aggiungi un'opzione vuota come placeholder
      const optionDefault = document.createElement("option");
      optionDefault.value = "";
      optionDefault.id = "iDoption";
      optionDefault.textContent = "Seleziona";
      selectCategoria.appendChild(optionDefault);
    }

  // Aggiungi le categorie al campo select
  categorie.forEach(categoria => {
    const option = document.createElement("option");
    option.value = categoria.categoria;
    option.textContent = categoria.categoria;
    selectCategoria.appendChild(option);
  });
}

document.getElementById('btnDeleteData').addEventListener('click', PulisciDatabase);
async function PulisciDatabase() {
  try {
  //TODO da migliorare
    const conferma = window.confirm(
      "Sei sicuro di voler eliminare TUTTO il database? Questa operazione non può essere annullata."
    );
    if (conferma) {

        await db.delete();
        db = null;
        const esiste = await Dexie.exists("TieniIlContoDB");

        if (!esiste) {
          showToast("Database eliminato con successo!");
        } else {
         showErrorToast("Attenzione: il database non è stato eliminato correttamente!", "error");
        }
    }
  } catch (error) {
    showErrorToast("Errore durante l'eliminazione del database", "error");
  }
}



document.getElementById('btnExportJSON').addEventListener('click', esportaDatabase);
async function esportaDatabase() {

  try {
  const spese = await querySpese();

  const result = {
          id: [],
          dataValuta: [],
          categoria: [],
          descrizione: [],
          valore: [],
          totale: 0
      };

  spese.forEach(item => {
          result.id.push(item.id);
          result.dataValuta.push(item.dataSpesa);   // mappo su dataValuta
          result.categoria.push(item.categoria);
          result.descrizione.push(item.descrizione || "");
          result.valore.push(item.importo);
      });

  fetchDownload(result);

  }catch (error) {
    console.error('Errore durante l\'esportazione dei dati:', error);
  }

}

const fileInput = document.getElementById('fileImport');
const btnImport = document.getElementById('btnImport');

// abilita il bottone solo quando c'è un file selezionato
fileInput.addEventListener('change', () => {
  btnImport.disabled = fileInput.files.length === 0;
});

btnImport.addEventListener('click', () => {
  const file = fileInput.files[0]; // <-- prendi il primo file
  if (file) {
    importaDatabase(file);
  }
});



async function importaDatabase(file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/excel/import", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          showErrorToast("Errore durante l'importazione", "error");
          throw new Error("Errore nel caricamento del file");
        }

        const result = await response.json();

        const spese = parseDataTabella(result);

        for (const spesa of spese) {
          await saveSpesa(spesa);
        }

        showToast("Importazione completata!", "success");
      } catch (error) {

        showErrorToast("Errore durante l'importazione", "error");
      }
}

 function parseDataTabella(dataTabella) {
      const spese = [];

      for (let i = 0; i < dataTabella.categoria.length; i++) {
        spese.push({
          id: dataTabella.id[i],
          dataSpesa: dataTabella.dataValuta[i],
          categoria: dataTabella.categoria[i],
          descrizione: dataTabella.descrizione[i],
          importo: dataTabella.valore[i]
        });
      }

      return spese;
    }




