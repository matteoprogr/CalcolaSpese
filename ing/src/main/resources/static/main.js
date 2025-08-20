import { saveSpesa } from './queryDexie.js';
import { querySpese } from './queryDexie.js';
import { deleteSpese } from './queryDexie.js';
import { deleteCategorie } from './queryDexie.js';
import { creaSpesaComponent } from './card.js';
import { creaComponentTotale } from './card.js';
import { overlayAddSpesa } from './card.js';
import { nessunaElementoComponent } from './card.js';
import { categoriaComponent } from './card.js';
import { getCategorie } from './queryDexie.js';
import { overlayRicerca } from './card.js';




// SERVICE WORKER //////////////////////////////////
//if ('serviceWorker' in navigator) {
//  window.addEventListener('load', () => {
//    navigator.serviceWorker.register('/service-worker.js')
//      .then((registration) => {
//        console.log('Service Worker registrato con successo:', registration);
//      })
//      .catch((error) => {
//        console.log('Registrazione del Service Worker fallita:', error);
//      });
//  });
//}



//  EVENT LISTENER //////////////////////////////////
document.getElementById("getSpesaBtn").addEventListener("click", createCriteri);
document.getElementById("deleteSpesaBtn").addEventListener("click", deleteSpesaBtn);
document.getElementById("deleteCategoriaBtn").addEventListener("click", deleteCategoriaBtn);
document.getElementById("uploadResultBtn").addEventListener("click", uploadResult);
document.getElementById("mergeRowsBtn").addEventListener("click", unisciRigheSelezionate);
document.getElementById("removeRowsBtn").addEventListener("click", rimuoviRigheSelezionate);


//  VARIABILI GLOBALI //////////////////////////////////

const manualForm = document.getElementById('manualForm');
let targetId;
let picker;



// SUBMIT FORM  e SECTIONS //////////////////////////////////////////

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        targetId = link.getAttribute('data-target');
        // Rimuove classe active da tutti i link
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Nasconde tutte le sezioni
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));

        // Mostra la sezione target
        const targetSection = document.getElementById(targetId);
        targetSection.classList.add('active');

        // Chiude il menu a scomparsa se aperto
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.checked = false;
        }
        // Sezione specifica "traccia-spesa"
        if (targetId === 'traccia-spesa') {
            setDateRange();
        }
        if (targetId === 'categorie-section') {
            categorieCreateComponent()
        }

    });
});

document.getElementById("uploadForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const selectNomeBanca = document.getElementById("nomeBanca");
    const nomeBanca = selectNomeBanca.options[selectNomeBanca.selectedIndex].text;
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const file = fileInput.files[0];
    const dataInizio = startDate.value;
    const datafine = endDate.value;


     if (!file || (!startDate && !endDate)) {
           showErrorToast("Inserisci un file Excel.", "error");
           return;
       }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nomeBanca", nomeBanca);
    formData.append("dataInizio", dataInizio);
    formData.append("dataFine", datafine);

    fetch("/api/excel/upload", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Errore nel caricamento del file");
        }
        return response.json();
    })
    .then(result => {
        mostraTabella(result);
    })
    .catch(error => {
        document.getElementById("response").innerText = "Errore durante l'upload: " + error;
    });
});

// DOM CONTENT LOADED ///////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
     overlayAddSpesa();
     overlayRicerca();
     setDateRange();
});

//  FUNZIONI //////////////////////////////////

export function setDateRange() {
  const today = new Date();
  const currentMonth = today.toLocaleString('it-IT', { month: 'long' });

  // Calcolo inizio e fine mese
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  let criteri = {};
  picker = flatpickr("#date-range", {
    mode: "range",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: "it",
    minDate: "2020-01-01",
    maxDate: "2030-12-31",
    disableMobile: true,
    defaultDate: [
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    ],
    placeholder: `Seleziona intervallo di date (${currentMonth})`,
    onChange: function (selectedDates, dateStr, instance) {
      const [startDate, endDate] = selectedDates;

      // Aggiorna input visivo
      const rangeText = startDate && endDate
        ? `${startDate.toLocaleDateString('it-IT')} a ${endDate.toLocaleDateString('it-IT')}`
        : 'Seleziona intervallo di date';
      instance.altInput.value = rangeText;

      // Passa i dati a tracciaSpeseClick in formato ISO
      criteri = {
        dataInizio: startDate ? startDate.toISOString().split('T')[0] : null,
        dataFine: endDate ? endDate.toISOString().split('T')[0] : null,
      };
      tracciaSpeseClick(criteri);
    }
  });

    createCriteri();
}

async function tracciaSpeseClick(criteri) {
    try {
        const spese = await querySpese(criteri);
        spese.sort((a, b) => new Date(a.dataSpesa).getTime() - new Date(b.dataSpesa).getTime());
        const listaSpese = document.getElementById("lista-spese");
        const listaSpeseTotale = document.getElementById("lista-spese-totale");
        const zeroSpese = document.getElementById("zero-spese");
        listaSpese.innerHTML = "";
        spese.forEach(spesa => {
          const nodo = creaSpesaComponent(spesa);
          listaSpese.appendChild(nodo);
        });

        const totale = creaComponentTotale(spese);
        listaSpeseTotale.innerHTML = "";
        zeroSpese.innerHTML = "";
        const totaleText = totale.innerText.trim();
        if(totaleText !== "0.00 €") {
            listaSpeseTotale.appendChild(totale);
        }else {
        const nodo = nessunaElementoComponent("spesa")
        zeroSpese.appendChild(nodo);
        }

    } catch (err) {
        console.error("Errore nel recupero spese:", err);
    }
}

export async function categorieCreateComponent() {
    const categorie = await getCategorie();
    const categorieList = document.getElementById("gestione-categorie");
    const zeroCategorie = document.getElementById("zero-categorie");
    categorieList.innerHTML = "";
    if (!categorie || categorie.length === 0) {
        const nodo = nessunaElementoComponent("categoria")
        zeroCategorie.appendChild(nodo);
    }else{
        categorie.forEach(cat => {
          const nodo = categoriaComponent(cat.categoria);
          categorieList.appendChild(nodo);
        });
    }
}

function mostraTabella(data) {
    const resultsTable = document.getElementById("resultsTable");
    const resultsTableTot = document.getElementById("resultsTableTot");
    const resultsBody = document.getElementById("resultsBody");
    const resultsBodyTot = document.getElementById("resultsBodyTot");

    resultsBody.innerHTML = "";
    resultsBodyTot.innerHTML = "";

    const dataValuta = data.dataValuta;
    const categoria = data.categoria;
    const descrizione = data.descrizione;
    const valore = data.valore;
    const totale = data.totale;

    for (let i = 0; i < dataValuta.length; i++) {
         aggiungiRiga(dataValuta[i],categoria[i],descrizione[i],valore[i],"resultsBody");
    }

    aggiungiRiga(null,"Totale", null, totale, "resultsBodyTot");
    aggiungiRiga(null,"Totale selezionato", null, 0, "resultsBodyTot");

    resultsTable.style.display = "table";
    resultsTableTot.style.display = "table";
    document.getElementById("mergeRowsBtn").style.display = "inline-block";
    document.getElementById("uploadResultBtn").style.display = "inline-block";
    document.getElementById("removeRowsBtn").style.display = "inline-block";

}

async function creaTabellaManuale(spese) {
     const tbody = document.getElementById("resultsBodyManual");
     const tbodyTot = document.getElementById("resultsBodyTotManual");

     tbody.innerHTML = "";
     tbodyTot.innerHTML = "";

     if (!spese || spese.length === 0) {
         document.getElementById("resultsTableManual").style.display = "none";
         document.getElementById("resultsTableTotManual").style.display = "none";
         return;
     }

     let totale = 0;
     let selectedRow = null;

     spese.forEach(spesa => {
         const tr = document.createElement("tr");

         // Salva l'id della spesa direttamente sulla riga
         tr.dataset.dataIns = spesa.dataInserimento;

         // Colonna Data Spesa
         const tdData = document.createElement("td");
         const dateObj = new Date(spesa.dataSpesa);

         // Recuperiamo giorno, mese e anno
         const day = String(dateObj.getDate()).padStart(2, '0');       // aggiunge 0 iniziale se <10
         const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // i mesi in JS partono da 0
         const year = dateObj.getFullYear();
         // Formattiamo la data come dd/mm/yyyy
         tdData.textContent = `${day}/${month}/${year}`;
         tdData.title = `Data Spesa: ${day}/${month}/${year}`;
         tdData.style.textAlign = "center";
         tr.appendChild(tdData);

         // Colonna Categoria
         const tdCategoria = document.createElement("td");
         tdCategoria.textContent = spesa.categoria || "";
         tdCategoria.title = `Categoria: ${spesa.categoria}`;
         tdCategoria.style.textAlign = "center";
         tr.appendChild(tdCategoria);

         // Colonna Descrizione
         const tdDescr = document.createElement("td");
         tdDescr.textContent = spesa.descrizione || "";
         tdDescr.title = `Descrizione: ${spesa.descrizione}`;
         tdDescr.style.textAlign = "center";
         tr.appendChild(tdDescr);

         // Colonna Importo
         const tdImporto = document.createElement("td");
         tdImporto.textContent = spesa.importo ? spesa.importo.toFixed(2) : "0.00";
         tdImporto.title = `Importo: ${spesa.importo}`;
         tdImporto.style.textAlign = "center";
         tr.appendChild(tdImporto);

         // Aggiungi listener per selezione
          tr.addEventListener("click", () => {
              tr.classList.toggle("selected-row");
          });

         tbody.appendChild(tr);

         totale += spesa.importo || 0;
     });

     // Totale
     const trTot = document.createElement("tr");
     const tdTot = document.createElement("td");
     tdTot.colSpan = 4;
     tdTot.style.textAlign = "right";
     tdTot.style.fontWeight = "bold";
     tdTot.textContent = "Totale:";
     trTot.appendChild(tdTot);

     const tdTotVal = document.createElement("td");
     tdTotVal.textContent = totale.toFixed(2);
     trTot.appendChild(tdTotVal);

     tbodyTot.appendChild(trTot);

     // Mostra le tabelle
     document.getElementById("resultsTableManual").style.display = "table";
     document.getElementById("resultsTableTotManual").style.display = "table";

}

function aggiungiRiga(dataValuta, categoria ,descrizione, valore, results) {

   // Aggiunge la nuova riga unita
    if (!isValid(descrizione) && categoria !== "Totale" && categoria !== "Totale selezionato") {
      showErrorToast("Inserisci un testo valido", "error");
       return;
    }
   if (isNaN(valore)) {
        showErrorToast("Inserisci un numero valido", "error");
       return;
   }
    const tabella = document.getElementById(results);
    const nuovaRiga = document.createElement("tr");

    const dataValutaCell = document.createElement("td");
    dataValutaCell.textContent = dataValuta;

    const categoriaCell = document.createElement("td");
    categoriaCell.textContent = categoria;

    const descrizioneCell = document.createElement("td");
    descrizioneCell.textContent = descrizione;

    const valoreCell = document.createElement("td");
    valoreCell.classList.add("valore-spesa");
    valoreCell.textContent = valore.toFixed(2);

    if (categoria.toLowerCase() === "totale") {
        nuovaRiga.style.fontWeight = "bold";
        nuovaRiga.id = "rigaTotaleBackend";
    }
    if(categoria.toLowerCase() === "totale selezionato") {
        nuovaRiga.style.fontWeight = "bold";
        nuovaRiga.id = "totaleLive";
    }

    if(categoria !== "Totale" && categoria !== "Totale selezionato"){
     // Aggiungi listener per selezione
        nuovaRiga.addEventListener("click", () => {
        nuovaRiga.classList.toggle("selected-row");
        aggiornaTotaleLive();
        });

        nuovaRiga.appendChild(dataValutaCell);
        nuovaRiga.appendChild(categoriaCell);
        nuovaRiga.appendChild(descrizioneCell);
        nuovaRiga.appendChild(valoreCell);
    }else{
        nuovaRiga.appendChild(categoriaCell);
        nuovaRiga.appendChild(valoreCell);
    }

        tabella.appendChild(nuovaRiga);

}


function isValid(value) {
    return value != null && !Number.isNaN(value) && value !== "";
}

export async function createCriteri() {

    const criteri = {};
//    if (isValid(manualForm.categoria.value)) {
//        criteri.categoria = manualForm.categoria.value;
//    }
//
//    const importo = parseFloat(manualForm.importo.value);
//    if (isValid(importo)) {
//        criteri.importoMin = importo;
//        criteri.importoMax = importo;
//    }

   if (picker && picker.selectedDates.length > 0) {
     const [startDate, endDate] = picker.selectedDates;
     if (startDate) criteri.dataInizio = startDate.toISOString().split('T')[0];
     if (endDate) criteri.dataFine = endDate.toISOString().split('T')[0];
   }

     await tracciaSpeseClick(criteri);;
}


async function deleteSpesaBtn() {
    // Trova tutte le righe selezionate
    const selectedCards = document.querySelectorAll('.spesa.selected');

    if (selectedCards.length === 0) {
        showErrorToast("Seleziona almeno una riga da eliminare.","error");
        return;
    }

    const criteri = [];
    if (selectedCards.length > 0) {
         selectedCards.forEach(card => {
        if (card.getAttribute('datains') !== null) {
            criteri.push(card.getAttribute('datains'));
        }
    });
    }

    if (criteri.length === 0) {
        showErrorToast("Errore durante l'eliminazione.","error");
        return;
    }

    await deleteSpese(criteri);

    if(criteri.length === 1){
        showToast("Spesa eliminata con successo", "success");
    } else {
        showToast("Spese eliminate con successo", "success");
    }

    createCriteri();
}

async function deleteCategoriaBtn() {
    // Trova tutte le righe selezionate
    const selectedCards = document.querySelectorAll('.cat.selected');

    if (selectedCards.length === 0) {
        showErrorToast("Seleziona almeno una riga da eliminare.","error");
        return;
    }

    const criteri = [];
    if (selectedCards.length > 0) {
         selectedCards.forEach(card => {
            criteri.push(card.innerText);
    });
    }

    if (criteri.length === 0) {
        showErrorToast("Errore durante l'eliminazione.","error");
        return;
    }

    await deleteCategorie(criteri);

    if(criteri.length === 1){
        showToast("Categoria eliminata con successo", "success");
    } else {
        showToast("Categorie eliminate con successo", "success");
    }

    categorieCreateComponent();
}

function uploadResult() {
    const tabella = document.getElementById("resultsBody");
    const rowTot = document.getElementById("rigaTotaleBackend");
    const rows = tabella.getElementsByTagName("tr");

    const dati = {
        dataValuta: [],
        categoria: [],
        descrizione: [],
        valore: [],
        totale: 0
    };

    // Ciclo sulle righe della tabella
    for (let row of rows) {
        const celle = row.getElementsByTagName("td");

        if (celle.length >= 4) {
            const dataValuta = celle[0].innerText.trim();
            const categoria = celle[1].innerText.trim();
            const descrizione = celle[2].innerText.trim();
            const valore = parseFloat(celle[3].innerText.trim());

            if (!isNaN(valore)) {
                dati.dataValuta.push(dataValuta);
                dati.categoria.push(categoria);
                dati.descrizione.push(descrizione);
                dati.valore.push(valore);
            }
        }
    }

    // Riga totale
    const celle = rowTot.getElementsByTagName("td");
    if (celle.length >= 4) {
        const valore = parseFloat(celle[3].innerText.trim());

        if (!isNaN(valore)) {
            dati.totale = valore;
        }
    }

    fetchDownload(dati);
}


export async function fetchDownload(dati) {
    // Invio al backend
        fetch("/api/excel/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dati)
        })
        .then(response => {
            if (!response.ok) throw new Error("Errore durante l'invio");
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "elaborazione.xlsx";
            link.click();
        })
        .catch(err => console.error(err));
}

function addNuovaRiga(inputCategoria, inputTesto, inputDouble) {
    const resultsBody = document.getElementById("resultsBody");

    const categoria = inputCategoria.value.trim();
    const testo = inputTesto.value.trim();
    // valore inserito con il meno " - "
    const numero = parseFloat(-inputDouble.value);

    if (!isValid(testo)) {
        showErrorToast("Inserisci un testo valido", "error");
        return;
    }
    if (isNaN(numero)) {
        showErrorToast("Inserisci un numero valido", "error");
        return;
    }

    // Controllo se esiste già una riga con lo stesso testo
    let rigaTrovata = null;
    for (const row of resultsBody.rows) {
        const cellTesto = row.cells[1];
        const cellTestotrim = cellTesto.textContent.trim(); //cellTestotrim// la seconda cella contiene il testo
        if (cellTesto && cellTestotrim === testo) {
            rigaTrovata = row;
            break;
        }
    }

    if (rigaTrovata) {
        // Sommo il valore esistente con quello nuovo
        const cellValore = rigaTrovata.cells[2];
        const valoreAttuale = parseFloat(cellValore.textContent);
        const nuovoValore = valoreAttuale + numero;
        cellValore.textContent = nuovoValore.toFixed(2);
    } else {
        // Se non esiste, aggiungo una nuova riga
        aggiungiRiga(null, categoria, testo, numero,"resultsBody");
    }

    // Pulisco input
    inputTesto.value = "";
    inputDouble.value = "";
    aggiornaTotale();
}


function aggiornaTotale() {
   const rows = document.querySelectorAll("#resultsBody tr");
   const rowsTot = document.querySelectorAll("#resultsBodyTot tr");
   let somma = 0;

   rows.forEach(row => {
       const valoreCell = row.querySelector(".valore-spesa");
        if(valoreCell){
           const valore = parseFloat(valoreCell.textContent);
           somma += valore;
        }
   });

   const totaleCell = document.getElementById("rigaTotaleBackend");
   const valoreCell = totaleCell.querySelector(".valore-spesa");
   let valueTot = parseFloat(somma).toFixed(2);
    if (totaleCell) {
           valoreCell.textContent = somma.toFixed(2);
       }

}

function aggiornaTotaleLive() {
    let somma = 0;
    const rows = document.querySelectorAll("#resultsBody tr");

    rows.forEach(row => {
        const valoreCell = row.querySelector(".valore-spesa");

        if (row.classList.contains("selected-row") && valoreCell) {
            const valore = parseFloat(valoreCell.textContent);
            if (!isNaN(valore)) {
                somma += valore;
            }
        }
    });

    const totaleCell = document.getElementById("totaleLive");
    const valoreCell = totaleCell.querySelector(".valore-spesa");
    if (totaleCell) {
        valoreCell.textContent = somma.toFixed(2);
    }
}

function rimuoviRigheSelezionate() {
    const rows = document.querySelectorAll("#resultsBody tr");
    const rowsTot = document.querySelectorAll("#resultsBodyTot tr");
    const righeRimuovere = [];
    let sommadaRimuovere = 0;
    let valoreTotale = 0;

    // raccoglie le righe con checkbox selezionata, escludendo totale
    rows.forEach(row => {

        const valoreCell = row.querySelector(".valore-spesa");
        const etichettaCell = row.children[1];
        const etichetta = etichettaCell?.textContent?.toLowerCase();

        if (row.classList.contains("selected-row") && valoreCell) {
            const valore = parseFloat(valoreCell.textContent);
            const etichetta = etichettaCell.textContent;
            righeRimuovere.push({ etichetta, valore, row });
            sommadaRimuovere += valore;
        }
    });

     // Se meno di due righe selezionate, non si unisce
        if (righeRimuovere.length < 1) {
            showErrorToast("Seleziona almeno una riga da rimuovere.", "error");
            return;
        }

    righeRimuovere.forEach(r => r.row.remove());
    aggiornaTotaleLive();
    aggiornaTotale();


}

function unisciRigheSelezionate() {
    const rows = document.querySelectorAll("#resultsBody tr");
    const righeDaUnire = [];

    // raccoglie le righe con checkbox selezionata, escludendo totale
    rows.forEach(row => {
        const valoreCell = row.querySelector(".valore-spesa");
        const dataCell = row.children[0];
        const categoriaCell = row.children[1];
        const descrizioneCell = row.children[2];

        if (row.classList.contains("selected-row") && valoreCell) {
            const data = dataCell.textContent;
            const categoria = categoriaCell.textContent;
            const valore = parseFloat(valoreCell.textContent);
            const descrizione = descrizioneCell.textContent;
            righeDaUnire.push({ data, categoria, descrizione, valore, row });
        }
    });

    // Se meno di due righe selezionate, non si unisce
    if (righeDaUnire.length < 2) {
        showErrorToast("Seleziona almeno due righe da unire.", "error");
        return;
    }

    // Somma valori e concatena etichette
    const dataSum = righeDaUnire.map(r => r.data).join("   ");
    const categoriaSum = righeDaUnire.map(r => r.categoria).join("   ");
    const descrizioneSum = righeDaUnire.map(r => r.etichetta).join("   ");
    const nuovoValore = righeDaUnire.reduce((acc, curr) => acc + curr.valore, 0);

    // Rimuove le righe originali
    righeDaUnire.forEach(r => r.row.remove());

    aggiungiRiga(dataSum,categoriaSum,descrizioneSum, nuovoValore,"resultsBody");

    aggiornaTotale();

}



function isMobile() {
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 968; // considera "mobile" se lo schermo è <= 768px
  return isMobileUA && isSmallScreen;
}

// Mostra un toast
export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100); // fade in

  // rimuovi dopo 3 secondi
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export function showErrorToast(message,type = "error") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100); // fade in

  // rimuovi dopo 3 secondi
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

