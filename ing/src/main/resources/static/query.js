 // Verifica se IndexedDB è supportato dal browser
  if (!window.indexedDB) {
    alert("IndexedDB non è supportato dal tuo browser.");
  }

  // Nome del database e dello store
  const dbName = "CalcolaSpeseDB";
  const storeName = "spese";

  // Funzione per aprire o creare il database
  function openDatabase() {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        store.createIndex("categoria", "categoria", { unique: false });
        store.createIndex("importo", "importo", { unique: false });
        store.createIndex("dataSpesa", "dataSpesa", { unique: false });
        store.createIndex("dataInizio", "dataInizio", { unique: false });
        store.createIndex("dataFine", "dataFine", { unique: false });
        store.createIndex("ricorrenza", "ricorrenza", { unique: false });
      }
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        resolve(event.target.result);
      };
      request.onerror = function (event) {
        reject("Errore nell'apertura del database: " + event.target.errorCode);
      };
    });
  }

  // Funzione per salvare una spesa
  async function saveSpesa(spesa) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const data = {
      ...spesa,
      dataInserimento: new Date().toISOString(),
    };
    store.add(data);
    transaction.oncomplete = function () {
      console.log("Spesa salvata:", data);
    };
    transaction.onerror = function () {
      console.error("Errore nel salvataggio della spesa:", transaction.error);
    };
  }

  // Funzione per recuperare le spese in base ai criteri di ricerca
  async function querySpese(criteri) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    let index;
    let range;

    if (criteri !== null && criteri !== undefined  && criteri.categoria) {
      index = store.index("categoria");
      range = IDBKeyRange.only(criteri.categoria);
    } else if (criteri !== null && criteri !== undefined  && (criteri.importoMin != null || criteri.importoMax != null)) {
      index = store.index("importo");
      range = IDBKeyRange.bound(
        criteri.importoMin != null ? criteri.importoMin : -Infinity,
        criteri.importoMax != null ? criteri.importoMax : Infinity
      );
    } else if (criteri !== null && criteri !== undefined  && criteri.dataSpesa) {
      index = store.index("dataSpesa");
      range = IDBKeyRange.only(criteri.dataSpesa);
    } else if (criteri !== null && criteri !== undefined  && criteri.dataSpesa) {
        index = store.index("ricorrenza");
        range = IDBKeyRange.only(criteri.dataSpesa);
    } else {
      index = store;
      range = undefined;
    }

    const request = index.getAll(range);
    request.onsuccess = function () {
      console.log("Spese trovate:", request.result);
    };
    request.onerror = function () {
      console.error("Errore nella ricerca delle spese:", request.error);
    };
  }

    async function deleteSpese(criteri) {
      const db = await openDatabase();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      // 🔹 Caso 1: Cancella tutto se non vengono passati criteri
      if (!criteri || Object.keys(criteri).length === 0) {
        store.clear();
        transaction.oncomplete = () => {
          console.log("Tutte le spese sono state cancellate.");
        };
        transaction.onerror = () => {
          console.error("Errore nella cancellazione di tutte le spese:", transaction.error);
        };
        return;
      }

      // 🔹 Caso 2: Cancella per ID
      if (criteri?.id != null) {
        store.delete(criteri.id);
        transaction.oncomplete = () => {
          console.log(`Spesa con ID ${criteri.id} cancellata.`);
        };
        transaction.onerror = () => {
          console.error("Errore nella cancellazione per ID:", transaction.error);
        };
        return;
      }

      // 🔹 Caso 3: Cancella per categoria, dataSpesa o ricorrenza
      let index;
      let range;

      if (criteri?.categoria) {
        index = store.index("categoria");
        range = IDBKeyRange.only(criteri.categoria);
      } else if (criteri?.dataSpesa) {
        index = store.index("dataSpesa");
        range = IDBKeyRange.only(criteri.dataSpesa);
      } else if (criteri?.ricorrenza) {
        index = store.index("ricorrenza");
        range = IDBKeyRange.only(criteri.ricorrenza);
      }

      if (index && range) {
        const request = index.openCursor(range);
        request.onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        request.onerror = function () {
          console.error("Errore durante la cancellazione filtrata:", request.error);
        };
      }

      transaction.oncomplete = () => {
        console.log("Cancellazione completata con criteri:", criteri);
      };
      transaction.onerror = () => {
        console.error("Errore nella cancellazione delle spese:", transaction.error);
      };
    }


export { saveSpesa, querySpese, deleteSpese };