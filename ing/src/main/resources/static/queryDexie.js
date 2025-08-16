  import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';

// Inizializzazione del database con schema e indice composto
const db = new Dexie('CalcolaSpeseDB');
db.version(1).stores({
  spese: '++id, categoria, importo, dataSpesa ,[categoria+dataSpesa], [categoria+importo], [importo+dataSpesa] ,[categoria+importo+dataSpesa]'
});

// Salvataggio di una spesa
export async function saveSpesa(spesa) {
 const fomattedISO = new Date(spesa.dataSpesa).toISOString().split('T')[0];

  const data = {
    ...spesa,
    dataInserimento: new Date().toISOString(),
    dataSpesa: fomattedISO
  };
  const id = await db.spese.add(data);
  console.log('Spesa salvata con ID', id, data);
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



// Eliminazione spese in base a criteri
export async function deleteSpese(criteri = {}) {

if (Array.isArray(criteri.dataInserimento) && criteri.dataInserimento.length > 0) {
  await db.spese
    .toCollection()
    .filter(spesa => criteri.dataInserimento.includes(spesa.dataInserimento))
    .delete();
  return;
}
}
