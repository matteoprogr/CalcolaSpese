  import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
//  import { exportDB } from 'dexie-export-import';
//  import { importDB } from 'dexie-export-import';

// Inizializzazione del database con schema e indice composto
const db = new Dexie('TieniIlContoDB');
db.version(1).stores({
  spese: '++id, categoria, importo, dataSpesa ,[categoria+dataSpesa], [categoria+importo], [importo+dataSpesa] ,[categoria+importo+dataSpesa]',
  categorie: '&categoria'
});

// Salvataggio di una spesa
export async function saveSpesa(spesa) {
  try {
    const fomattedISO = new Date(spesa.dataSpesa).toISOString().split('T')[0];

    const data = {
      ...spesa,
      dataInserimento: new Date().toISOString(),
      dataSpesa: fomattedISO
    };

    await saveCategoria(spesa.categoria);

    // restituisce l'id della spesa salvata
    const id = await db.spese.add(data);

    await popolaCategoria();

    // ritorno un valore utile per sapere se è andato tutto bene
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

async function esportaDatabase() {
  try {
    const db = new Dexie('TieniIlContoDB');
    await db.open();

    const blob = await exportDB(db);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_tieniilconto.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Esportazione completata con successo.');
  } catch (error) {
    console.error('Errore durante l\'esportazione:', error);
  }
}

async function importaDatabase(file) {
  try {
    const db = new Dexie('TieniIlContoDB');
    await db.open();

    const importedDb = await importDB(file);
    const nativeDb = importedDb.backendDB();

    // Copia i dati importati nel tuo database Dexie
    await nativeDb.transaction('rw', nativeDb.objectStoreNames, async () => {
      for (const storeName of nativeDb.objectStoreNames) {
        const store = nativeDb.transaction(storeName, 'readwrite').objectStore(storeName);
        const records = await store.getAll();
        await Promise.all(records.map(record => store.put(record)));
      }
    });

    console.log('Importazione completata con successo.');
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
  }
}

async function salvaNelPersistentStorage() {
  try {
    const isPersistent = await navigator.storage.persist();
    if (isPersistent) {
      console.log('I dati saranno conservati anche se lo spazio di archiviazione è limitato.');
    } else {
      console.log('Non è possibile garantire la persistenza dei dati.');
    }
  } catch (error) {
    console.error('Errore durante la richiesta di persistenza:', error);
  }
}

async function verificaPersistentStorage() {
  try {
    const isPersistent = await navigator.storage.persisted();
    if (isPersistent === undefined) {
      console.log('Il browser non supporta l\'API StorageManager.');
    } else if (isPersistent) {
      console.log('Il Persistent Storage è attivo.');
    } else {
      console.log('Il Persistent Storage non è attivo.');
    }
  } catch (error) {
    console.error('Errore durante la verifica dello stato del Persistent Storage:', error);
  }
}

async function gestisciBackup() {
  // Esporta i dati
  await esportaDatabase();

  // Verifica lo stato del Persistent Storage
  await verificaPersistentStorage();

  // Richiedi la persistenza se non è attiva
  await salvaNelPersistentStorage();
}

async function esportaDatiPersistenti() {
  try {
    // Chiedi all'utente di selezionare un file per salvare i dati
    const [fileHandle] = await window.showSaveFilePicker({
      suggestedName: 'dati_backup.json',
      types: [
        {
          description: 'File JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    // Crea un writable stream per il file selezionato
    const writable = await fileHandle.createWritable();

    // Prepara i dati da esportare (ad esempio, dati dal Persistent Storage)
    const dati = JSON.stringify({ chiave: 'valore' });

    // Scrivi i dati nel file
    await writable.write(dati);
    await writable.close();

    console.log('Esportazione completata con successo.');
  } catch (error) {
    console.error('Errore durante l\'esportazione:', error);
  }
}

// import dati da vedere se utile o ridondante rispettoo a alla funzione importaDatabase()  presente sopra
async function importaDati() {
  try {
    // Chiedi all'utente di selezionare il file da importare
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'File JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    // Ottieni il file selezionato
    const file = await fileHandle.getFile();
    const text = await file.text();

    // Parsea i dati dal file
    const dati = JSON.parse(text);

    // Inserisci i dati nel database IndexedDB
    const db = new Dexie('TieniIlContoDB');
    await db.open();
    await db.spese.bulkPut(dati.spese);
    await db.categorie.bulkPut(dati.categorie);

    console.log('Importazione completata con successo.');
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
  }
}
