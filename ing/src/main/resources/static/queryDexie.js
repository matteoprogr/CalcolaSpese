  import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.mjs';
  import { fetchDownload } from './main.js';
  import { showToast } from './main.js';
  import { showErrorToast } from './main.js';
  import { isValid } from './main.js';


let db;
initDB();// variabile globale per il database


/////// INIZIALIZZAZIONE DB ///////////////////
export function initDB() {
  if (!db) {
    db = new Dexie('MoneyLogDB');
    db.version(1).stores({
      spese: '++id, *categoria, importo, data, [importo+data]',
      categorie: '&categoria',
      entrate: '++id, *categoria, importo, data, [importo+data]',
      defaultCat: 'inizializato'
    });

    initCategorie();
  }
  return db;
}


async function initCategorie(){
    const catList = ["Altro","Tempo libero", "Casa e utenze","Trasporti","Salute e benessere","Shopping" ];

    const isInit = await db.defaultCat.get("init");
    if(!isInit){
        for (const cat of catList) {
            await saveCategoria(cat);
        }
    }

    await db.defaultCat.put({ inizializato: "init", done: true });
}

/////////////////   SALVATAGGIO TRANSAZIONI   ///////////////////////////
export async function saveSpesa(spesa, excel) {
  try {

    initDB();
    const fomattedISO = new Date(spesa.data).toISOString().split('T')[0];
    const categoria = capitalizeFirstLetter(spesa.categoria);
    const data = {
      descrizione: await setDescrizione(spesa.descrizione,categoria),
      importo: -Math.abs(spesa.importo),
      categoria: categoria,
      dataInserimento: new Date().toISOString(),
      data: fomattedISO
    };

    await saveCategoria(spesa.categoria);
    const id = await db.spese.add(data);
    if(!excel){
        showToast("Spesa aggiunta con successo", "success");
    }


    return { success: true, id };
  } catch (error) {
    console.error("Errore nel salvataggio spesa:", error);
    return { success: false, error };
  }
}


export async function saveEntrata(entrata) {
  try {

    initDB();
    const fomattedISO = new Date(entrata.data).toISOString().split('T')[0];
    const categoria = capitalizeFirstLetter(entrata.categoria);

    const data = {
      descrizione: await setDescrizione(entrata.descrizione,categoria),
      importo: entrata.importo,
      categoria: categoria,
      dataInserimento: new Date().toISOString(),
      data: fomattedISO
    };

    await saveCategoria(entrata.categoria);
    const id = await db.entrate.add(data);
    showToast("entrata aggiunta con successo", "success");

    return { success: true, id };
  } catch (error) {
    console.error("Errore nel salvataggio entrata:", error);
    return { success: false, error };
  }
}

async function setDescrizione(descrizione, categoria){
     if(descrizione === ""){
        return categoria;
     }
     return descrizione;
}



/////////// SALVATAGGIO CATEGORIE //////////////////////
export async function saveCategoria(categoria) {
  const categoriaLower = categoria.toLowerCase().trim();
  const categoriaCapitalized = capitalizeFirstLetter(categoriaLower);
  try {

    const cat = await db.categorie.get(categoriaCapitalized);
    if(!isValid(cat)){
    await db.categorie.add({
        categoria: categoriaCapitalized,
        richieste: 1
         });
    }else{
        updateCategoria(categoria, null, true);
    }

  } catch (error) {
      showErrorToast('Errore durante l\'aggiunta della categoria', "error");
  }
}



export function capitalizeFirstLetter(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


////////// UPDATE TRANSAZIONI ///////////////////
export async function updateSpesa( spesa, isNew) {
  try {
    initDB();

    if (!spesa.id) {
      throw new Error("ID spesa mancante per la sostituzione");
    }

    const fomattedISO = new Date(spesa.data).toISOString().split('T')[0];
    const categoria = capitalizeFirstLetter(spesa.categoria);
    const data = {
      id: spesa.id,
      descrizione: await setDescrizione(spesa.descrizione,categoria),
      dataInserimento: isValid(spesa.dataInserimento) ? spesa.dataInserimento : fomattedISO,
      importo: -Math.abs(spesa.importo),
      categoria: categoria,
      data: fomattedISO,
      dataModifica: new Date().toISOString()
    };
    if(isNew){
        await saveCategoria(spesa.categoria);
    }

    const id = await db.spese.put(data);

    showToast("Spesa sostituita con successo", "success");
    return { success: true, id };

  } catch (error) {
    console.error("Errore nella sostituzione spesa:", error);
    showToast("Errore durante la sostituzione della spesa", "error");
    return { success: false, error };
  }
}

export async function updateEntrata(entrata, isNew) {
  try {
    initDB();

    if (!entrata.id) {
      throw new Error("ID entrata mancante per la sostituzione");
    }

    const fomattedISO = new Date(entrata.data).toISOString().split('T')[0];
    const categoria = capitalizeFirstLetter(entrata.categoria);
    const data = {
      id: entrata.id,
      descrizione: await setDescrizione(entrata.descrizione,categoria),
      importo: entrata.importo,
      categoria: categoria,
      data: fomattedISO,
      dataInserimento: isValid(entrata.dataInserimento) !== null ? entrata.dataInserimento : fomattedISO,
      dataModifica: new Date().toISOString()
    };

    if(isNew){
        await saveCategoria(entrata.categoria);
    }


    // put sostituisce completamente il record
    const id = await db.entrate.put(data);

    showToast("Entrata sostituita con successo", "success");
    return { success: true, id };

  } catch (error) {
    showToast("Errore durante la sostituzione della entrata", "error");
    return { success: false, error };
  }
}



/////////////////  RICERCA ///////////////////////
export async function queryTrns(criteri = {}, tabActive) {
  initDB();
  let collezione;
  if(!tabActive){
    collezione = db.spese;
  }else if(tabActive){
    collezione = db.entrate;
  }

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
    collezione = collezione.where('data').between(start, end, true, true);
  }
  // Se abbiamo importo + data (senza categoria), usa l'indice composto
  else if ((criteri.importoMin != null || criteri.importoMax != null) && (criteri.dataInizio || criteri.dataFine) && !criteri.categoria) {
    const min = criteri.importoMin ?? -Infinity;
    const max = criteri.importoMax ?? Infinity;
    const start = criteri.dataInizio ? criteri.dataInizio : Dexie.minKey;
    const end = criteri.dataFine ? criteri.dataFine : Dexie.maxKey;
    collezione = collezione
      .where('[importo+data]')
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
      if (criteri.dataInizio && spesa.data < criteri.dataInizio) return false;
      if (criteri.dataFine && spesa.data > criteri.dataFine) return false;

      return true;
    });
  }

  return collezione.toArray();
}

////////////////    ELIMINAZIONE TRANSAZIONI ////////////////////////////////
export async function deleteSpese(criteri = {}, tabActive) {

    let collezione;
    if(!tabActive){
        collezione = db.spese.toCollection();
    }else if(tabActive){
        collezione = db.entrate.toCollection();
    }

    if (Array.isArray(criteri) && criteri.length > 0) {
        await  collezione.filter(trns => criteri.includes(trns.dataInserimento)).delete();
        return;
    }
}
//////////// DELETE CATEGORIE /////////////////
export async function deleteCategorie(criteri = []) {
    if (Array.isArray(criteri) && criteri.length > 0) {
        await db.categorie
            .where('categoria')
            .anyOfIgnoreCase(criteri)  // Confronto case-insensitive
            .delete();
    }
    for(const categoria of criteri){
        updateCatInTrns(categoria, "Altro");
    }
    return;
}

//////////// GET CATEGORIE /////////////////
export async function getCategorie(criterio) {
    initDB();

    let categorie;
    if (!criterio || criterio.trim() === "") {
        categorie = await db.categorie.toArray();
    } else {
        categorie = await db.categorie
            .where("categoria")
            .startsWithIgnoreCase(criterio)
            .toArray();
    }

    // ordino in ordine decrescente per richieste
    return categorie.sort((a, b) => b.richieste - a.richieste);
}


//////////// UPDATE CATEGORIE /////////////////
export async function updateCategoria(oldCat, newCat, richiesta) {
    try{
        const record = await db.categorie.get(oldCat);
        newCat = capitalizeFirstLetter(newCat)
        if(richiesta === false){
            if (oldCat === newCat) return;
            if (!isValid(record)) return;
            await db.categorie.delete(oldCat);
            await db.categorie.put({ ...record, categoria: newCat });
            updateCatInTrns(oldCat, newCat);
        }else if(richiesta === true){
            const count = record.richieste +1;
            await db.categorie.update(oldCat, { richieste: count });
        }
    }catch(err){
        showErrorToast("Errore durante l'update","error")
    }

}

//////////////   UPDATE CATEGORIE IN TRANSAZIONI ////////////////////////
async function updateCatInTrns(oldCat, newCat){
    const criteri = {categoria: [oldCat]}
    const catSpese = await queryTrns(criteri, false);
    const catEntrate = await queryTrns(criteri, true);
    if(catSpese.length !== 0){
        for(const spesa of catSpese){
            spesa.categoria = newCat;
            await updateSpesa(spesa,false);
        }
    }
    if(catEntrate.length !== 0){
        for(const entrata of catEntrate){
            entrata.categoria = newCat;
            await updateEntrata(entrata, false);
        }
    }

}


document.getElementById('btnDeleteData').addEventListener('click', () => {
  apriConferma();
});

function apriConferma() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('hidden');

  const yesBtn = document.getElementById('confirmYes');
  const noBtn = document.getElementById('confirmNo');

  // pulisco eventuali vecchi listener
  yesBtn.replaceWith(yesBtn.cloneNode(true));
  noBtn.replaceWith(noBtn.cloneNode(true));

  // riestraggo i bottoni aggiornati
  const newYesBtn = document.getElementById('confirmYes');
  const newNoBtn = document.getElementById('confirmNo');

  newYesBtn.addEventListener('click', async () => {
    modal.classList.add('hidden');
    await PulisciDatabase();
  });

  newNoBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

async function PulisciDatabase() {
  try {
    await db.delete();
    db = null;
    const esiste = await Dexie.exists("MoneyLogDB");

    if (!esiste) {
      showToast("Database eliminato con successo!");
    } else {
      showErrorToast("Attenzione: il database non è stato eliminato correttamente!", "error");
    }
  } catch (error) {
    showErrorToast("Errore durante l'eliminazione del database", "error");
  }
}



////////////////  EXPORT DATABASE ////////////////////////
document.getElementById('btnExportJSON').addEventListener('click', esportaDatabase);
async function esportaDatabase() {
    const overlaySpinner = document.getElementById('spinnerOverlay');
  try {
  overlaySpinner.style.display = 'flex';
  const spese = await queryTrns({},false);
  const entrate = await queryTrns({},true);

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
          result.dataValuta.push(item.data);   // mappo su dataValuta
          result.categoria.push(item.categoria);
          result.descrizione.push(item.descrizione || "");
          result.valore.push(item.importo);
      });

    entrate.forEach(item => {
            result.id.push(item.id);
            result.dataValuta.push(item.data);   // mappo su dataValuta
            result.categoria.push(item.categoria);
            result.descrizione.push(item.descrizione || "");
            result.valore.push(item.importo);
        });

  fetchDownload(result);

  }catch (error) {
    console.error('Errore durante l\'esportazione dei dati:', error);
  }finally{
    overlaySpinner.style.display = 'none';
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
    fileInput.value = "";
  }
});

/////////////////////////  IMPORT  ////////////////////////////////////////
async function importaDatabase(file) {
        const overlaySpinner = document.getElementById('spinnerOverlay');
      try {
        overlaySpinner.style.display = 'flex';
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

        const transazioni = parseDataTabella(result);

        for (const trns of transazioni) {
            if(trns.importo < 0){
                await saveSpesa(trns);
            }else if(trns.importo > 0){
                await saveEntrata(trns);
            }
        }

        showToast("Importazione completata!", "success");
      } catch (error) {
        showErrorToast("Errore durante l'importazione", "error");
      }finally{
        overlaySpinner.style.display = 'none';
      }
}

 function parseDataTabella(dataTabella) {
      const transazioni = [];

      for (let i = 0; i < dataTabella.categoria.length; i++) {
        transazioni.push({
          id: dataTabella.id[i],
          data: dataTabella.dataValuta[i],
          categoria: dataTabella.categoria[i],
          descrizione: dataTabella.descrizione[i],
          importo: dataTabella.valore[i]
        });
      }

      return transazioni;
    }




