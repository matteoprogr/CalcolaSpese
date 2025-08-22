  import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
  import { fetchDownload } from './main.js';
  import { showToast } from './main.js';
  import { showErrorToast } from './main.js';


let db;
initDB();// variabile globale per il database

export function initDB() {
  if (!db) {
    db = new Dexie('TieniIlContoDB');
    db.version(1).stores({
      spese: '++id, *categoria, importo, dataSpesa, [importo+dataSpesa]',
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
      categoria: capitalizeFirstLetter(spesa.categoria),
      dataInserimento: new Date().toISOString(),
      dataSpesa: fomattedISO
    };

    await saveCategoria(spesa.categoria);
    const id = await db.spese.add(data);
    showToast("Spesa aggiunta con successo", "success");

    return { success: true, id };
  } catch (error) {
    console.error("Errore nel salvataggio spesa:", error);
    return { success: false, error };
  }
}

function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function saveCategoria(categoria) {
  const categoriaLower = categoria.toLowerCase().trim();
  const categoriaCapitalized = capitalizeFirstLetter(categoriaLower);
  try {
    await db.categorie.add({ categoria: categoriaCapitalized });
  } catch (error) {
    if (error.name !== 'ConstraintError') {
      console.error('Errore durante l\'aggiunta della categoria:', error);
    }
  }
}

// UPDATE
export async function updateSpesa(spesa) {
  try {
    initDB();

    if (!spesa.id) {
      throw new Error("ID spesa mancante per la sostituzione");
    }

    const fomattedISO = new Date(spesa.dataSpesa).toISOString().split('T')[0];
    const data = {
      ...spesa,
      dataInserimento: spesa.dataInserimento,
      categoria: capitalizeFirstLetter(spesa.categoria),
      dataSpesa: fomattedISO,
      dataModifica: new Date().toISOString()
    };

    await saveCategoria(spesa.categoria);

    // put sostituisce completamente il record
    const id = await db.spese.put(data);

    showToast("Spesa sostituita con successo", "success");
    return { success: true, id };

  } catch (error) {
    console.error("Errore nella sostituzione spesa:", error);
    showToast("Errore durante la sostituzione della spesa", "error");
    return { success: false, error };
  }
}



//// Ricerca spese con più criteri combinati
export async function querySpese(criteri = {}) {
  initDB();

  let collezione = db.spese;
  let usaFiltri = false;

  // Se abbiamo solo categoria, usa l'indice multiEntry
  if (criteri.categoria && !criteri.importoMin && !criteri.importoMax && !criteri.dataInizio && !criteri.dataFine) {
    collezione = collezione.where('categoria').anyOf(criteri.categoria).distinct();
  }
  // Se abbiamo solo importo, usa l'indice
  else if ((criteri.importoMin != null || criteri.importoMax != null) && !criteri.categoria && !criteri.dataInizio && !criteri.dataFine) {
    const min = criteri.importoMin ?? -Infinity;
    const max = criteri.importoMax ?? Infinity;
    collezione = collezione.where('importo').between(min, max, true, true);
  }
  // Se abbiamo solo data, usa l'indice
  else if ((criteri.dataInizio || criteri.dataFine) && !criteri.categoria && !criteri.importoMin && !criteri.importoMax) {
    const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
    const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
    collezione = collezione.where('dataSpesa').between(start, end, true, true);
  }
  // Se abbiamo importo + data (senza categoria), usa l'indice composto
  else if ((criteri.importoMin != null || criteri.importoMax != null) && (criteri.dataInizio || criteri.dataFine) && !criteri.categoria) {
    const min = criteri.importoMin ?? -Infinity;
    const max = criteri.importoMax ?? Infinity;
    const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
    const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
    collezione = collezione
      .where('[importo+dataSpesa]')
      .between([min, start], [max, end], true, true);
  }
  // Per tutti gli altri casi (categoria + altri criteri), usa filtri
  else {
    usaFiltri = true;

    // Se c'è categoria, inizia con quello per sfruttare l'indice multiEntry
    if (criteri.categoria) {
      collezione = collezione.where('categoria').anyOf(criteri.categoria);
    }
  }

  // Applica filtri aggiuntivi se necessario
  if (usaFiltri ||
      (criteri.categoria && (criteri.importoMin != null || criteri.importoMax != null || criteri.dataInizio || criteri.dataFine))) {

    collezione = collezione.filter(spesa => {
      // Filtra per categoria se specificata (controllo intersezione array)
      if (criteri.categoria) {
        const categorieSpesa = Array.isArray(spesa.categoria) ? spesa.categoria : [spesa.categoria];
        const criteriCategorie = Array.isArray(criteri.categoria) ? criteri.categoria : [criteri.categoria];
        const hasCategoriaComune = categorieSpesa.some(cat => criteriCategorie.includes(cat));
        if (!hasCategoriaComune) return false;
      }

      // Filtra per importo
      if (criteri.importoMin != null && spesa.importo < criteri.importoMin) return false;
      if (criteri.importoMax != null && spesa.importo > criteri.importoMax) return false;

      // Filtra per data
      if (criteri.dataInizio && spesa.dataSpesa < criteri.dataInizio) return false;
      if (criteri.dataFine && spesa.dataSpesa > criteri.dataFine) return false;

      return true;
    });
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

export async function deleteCategorie(criteri = []) {
    if (Array.isArray(criteri) && criteri.length > 0) {
        await db.categorie
            .where('categoria')
            .anyOfIgnoreCase(criteri)  // Confronto case-insensitive
            .delete();
        return;
    }
}


export async function getCategorie() {
    initDB();
    return await db.categorie.toArray();
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




