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
import { overlayEdit } from './card.js';




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
document.getElementById("deleteSpesaBtn").addEventListener("click", deleteSpesaBtn);
document.getElementById("deleteCategoriaBtn").addEventListener("click", deleteCategoriaBtn);
document.getElementById("deleteExcelSpesaBtn").addEventListener("click", deleteSpesaBtnExcel);
document.getElementById("importoMinEntrata").addEventListener("input", createCriteri);
document.getElementById("importoMaxEntrata").addEventListener("input", createCriteri);
document.getElementById("invioBtn").addEventListener("click", uploadExcel);
document.getElementById("downloadBtn").addEventListener("click", downloadExcel);



//  VARIABILI GLOBALI //////////////////////////////////

const manualForm = document.getElementById('manualForm');
let targetId;
let picker;



// SUBMIT FORM  e SECTIONS //////////////////////////////////////////

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('touchstart', function(e) {
        this.touchStartTime = Date.now();
      });

      link.addEventListener('touchend', function(e) {
        if (Date.now() - this.touchStartTime < 400) {
          // Tocco breve: comportamento predefinito
          return;
        }
        // Tocco lungo: impedisci il menu contestuale
        e.preventDefault();
      });
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
        if(targetId === 'elabora-excel'){
            const listTraccia = document.getElementById("lista-spese");
            listTraccia.innerHTML = "";
            setDataExcel();
        }

        const selectedCards = document.querySelectorAll('.selected');
        selectedCards.forEach(card => {card.classList.remove('selected');});
    });
});



// DOM CONTENT LOADED ///////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
     overlayAddSpesa();
     overlayRicerca();
     setDateRange();
//event.target.closest('#mobile-nav')
     document.addEventListener('click', (event) => {
         if (event.target.tagName === 'SPAN' || event.target.closest('#nav-toggle')) return;
           const navToggle = document.getElementById('nav-toggle');
               if (navToggle) {
                   navToggle.checked = false;
               }
       });
     });

//  FUNZIONI //////////////////////////////////

function setDataExcel(){
    const start = document.getElementById('startDate');
    const end = document.getElementById('endDate');
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 2, 0, 0);
    start.value = startOfMonth.toISOString().split("T")[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1, 1, 59, 0);
    end.value = endOfMonth.toISOString().split("T")[0];
}

export function setDateRange(range = "#date-range") {
  const today = new Date();

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 2, 0, 0);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 1, 59, 0);
  const lastDay = endOfMonth.getDate();

  function formatDMY(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }


  function getMonthYearName(date) {
    return date.toLocaleString("it-IT", { month: "long", year: "numeric" });
  }

  const picker = flatpickr(range, {
    mode: "range",
    dateFormat: "Y-m-d",
    altInput: false,
    locale: "it",
    minDate: "2020-01-01",
    maxDate: "2035-12-31",
    defaultDate: [startOfMonth, endOfMonth],  // Passa direttamente Date objects
    formatDate: function(date, format, locale) {
      return formatDMY(date);
    },
    onReady: function(selectedDates, dateStr, instance) {
      if (
        selectedDates.length === 2 &&
        selectedDates[0].getDate() === 1 &&
        selectedDates[1].getDate() === lastDay &&
        selectedDates[0].getMonth() === selectedDates[1].getMonth()
      ) {
        instance.input.value = getMonthYearName(selectedDates[0]).toUpperCase();
      }
    },
    onChange: function(selectedDates, dateStr, instance) {
      if (
        selectedDates.length === 2 &&
        selectedDates[0].getDate() === 1 &&
        selectedDates[1].getDate() === lastDay &&
        selectedDates[0].getMonth() === selectedDates[1].getMonth()
      ) {
        instance.input.value = getMonthYearName(selectedDates[0]).toUpperCase();
      } else {
        instance.input.value = `${formatDMY(selectedDates[0])} – ${formatDMY(selectedDates[1])}`;
      }

      createCriteri();
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


async function uploadExcel() {
    try {
        const fileInput = document.getElementById("fileInput");
        const file = fileInput.files[0];
        const nomeBanca = document.getElementById("nomeBanca").value;
        const startDate = document.getElementById("startDate");
        const endDate = document.getElementById("endDate");
        const dataInizio = startDate.value;
        const dataFine = endDate.value;

        if(!isValid(fileInput) || !isValid(nomeBanca) || nomeBanca === ""){
            showErrorToast("Compila correttamente i campi:", "error");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("nomeBanca", nomeBanca);
        formData.append("dataInizio", dataInizio);
        formData.append("dataFine", dataFine);

        fetchUpload(formData)
        } catch (err) {
            showErrorToast("Errore nel recupero spese:", "error");
        }
}

async function excelCardCreator(dati) {

    try {
        const dataValuta = dati.dataValuta;
        const categoria = dati.categoria;
        const descrizione = dati.descrizione;
        const valore = dati.valore;

        const spese = dataValuta.map((data, i) => ({
          dataSpesa: data,
          categoria: categoria[i],
          descrizione: descrizione[i],
          importo: valore[i]
        }));

        spese.sort((a, b) => new Date(a.dataSpesa) - new Date(b.dataSpesa));
        const  totaleExcel = document.getElementById("lista-spese-excel-totale");
        const  zeroExcel = document.getElementById("zero-rows");
        const listaSpese = document.getElementById("lista-spese-excel");
        listaSpese.innerHTML = "";
        spese.forEach(spesa => {
          const nodo = creaSpesaComponent(spesa);
          listaSpese.appendChild(nodo);
        });

        const totale = creaComponentTotale(spese);
        totaleExcel.innerHTML = "";
        zeroExcel.innerHTML = "";
        const totaleText = totale.innerText.trim();
        if(totaleText !== "0.00 €") {
            totaleExcel.appendChild(totale);
        }else {
        const nodo = nessunaElementoComponent("spesa")
        zeroSpese.appendChild(nodo);
        }

    } catch (err) {
        showErrorToast("Errore nel recupero spese:", "error");
    }

}

async function fetchUpload(formData) {
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
            excelCardCreator(result);
        })
        .catch(error => {
            showErrorToast("Errore durante l'upload", "error");
        });

}

export async function categorieCreateComponent() {
    const categorie = await getCategorie();
    const categorieList = document.getElementById("gestione-categorie");
    const zeroCategorie = document.getElementById("zero-categorie");
    zeroCategorie.innerHTML = "";
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


function isValid(value) {
    return value != null && !Number.isNaN(value) && value !== "";
}

export async function createCriteri() {

    let criteri = {};

    const selectedCards = document.querySelectorAll('.card.selected');
    if (selectedCards.length > 0) {
     criteri = { categoria: [] };
      selectedCards.forEach(card => {
        criteri.categoria.push(card.innerText.trim());
      });
    }

    const min = -Math.abs(document.getElementById("importoMaxEntrata").value);
    const max = -Math.abs(document.getElementById("importoMinEntrata").value);
    if (isValid(min) && min !== -0) {
        criteri.importoMin = parseFloat(min);
    }
    if (isValid(max) && max !== -0) {
        criteri.importoMax = parseFloat(max);
    }


    const inputRange = document.getElementById("date-range").value.trim();

    let dataInizio, dataFine;
    if (inputRange.match(/^[a-z]+\s+\d{4}$/i)) {
        // Se assume il formato "mese anno"
        const { startDate, endDate } = getMonthDateRange(inputRange);
        dataInizio = startDate;
        dataFine = endDate;
    } else {
        // Se è un range come "01/08/2025 – 31/08/2025"
        const { dataInizio: ds, dataFine: df } = parseDateRange(inputRange);
        dataInizio = convertDDMMYYYYtoDate(ds);
        dataFine = convertDDMMYYYYtoDate(df);
    }

    criteri.dataInizio = convertDDMMYYYYtoYYYYMMDD(formatDDMMYYYY(dataInizio));
    criteri.dataFine = convertDDMMYYYYtoYYYYMMDD(formatDDMMYYYY(dataFine));

     await tracciaSpeseClick(criteri);;
}


function getMonthDateRange(monthNameYear) {
  const monthNames = [
    'gennaio','febbraio','marzo','aprile','maggio','giugno',
    'luglio','agosto','settembre','ottobre','novembre','dicembre'
  ];

  const parts = monthNameYear.trim().toLowerCase().split(' ');
  if (parts.length < 2) {
    throw new Error('Formato non valido: usare "mese anno", es. "agosto 2025"');
  }

  const year = parseInt(parts[parts.length - 1], 10);
  const monthName = parts.slice(0, parts.length - 1).join(' ');
  const monthIndex = monthNames.indexOf(monthName);

  if (monthIndex === -1 || isNaN(year)) {
    throw new Error(`Mese non valido: "${monthNameYear}"`);
  }

  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);

  return { startDate, endDate };
}

function parseDateRange(str) {
  const [dataInizio = null, dataFine = null] = str.split(' – ');
  return { dataInizio, dataFine };
}

function convertDDMMYYYYtoDate(str) {
  const [d, m, y] = str.split('/');
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}

function formatDDMMYYYY(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function convertDDMMYYYYtoYYYYMMDD(str) {
  const [d, m, y] = str.split('/');
  return `${y}-${m}-${d}`;
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

async function downloadExcel(){

    const dati = {
    id : [],
    dataValuta : [],
    categoria : [],
    descrizione : [],
    valore : [],
    totale : 0
    }
    const totaleHTML = document.getElementById("lista-spese-excel-totale");
    let totaleExcel = -Math.abs(parseFloat(totaleHTML.innerText));
    dati.totale = totaleExcel;

    const excelHTML = document.getElementById("lista-spese-excel");
    const excelCards = excelHTML.querySelectorAll(".spesa");

     if (excelCards.length === 0) {
        showErrorToast("Importa un file prima del download.","error");
        return;
     }
    let i = 0;
    excelCards.forEach( card => {
        dati.id.push(i++)
        dati.dataValuta.push(card.querySelector('.spesa-header .data').innerText);
        dati.categoria.push(card.querySelector('.spesa-footer .categoria').innerText);
        dati.descrizione.push(card.querySelector('.spesa-body .descrizione').innerText)
        dati.valore.push(estraiImporto(card.querySelector('.spesa-body .importo').innerText));
    });

    fetchDownload(dati);

}

async function deleteSpesaBtnExcel() {
    // Trova tutte le righe selezionate
    const selectedCards = document.querySelectorAll('.spesa.selected');
    if (selectedCards.length === 0) {
        showErrorToast("Seleziona almeno una riga da eliminare.","error");
        return;
    }

    const totaleHTML = document.getElementById("lista-spese-excel-totale");
    let totaleExcel = -Math.abs(parseFloat(totaleHTML.innerText));
    let valuesSelected = 0;
    selectedCards.forEach(card => {
         valuesSelected += Math.abs(estraiImporto(card.querySelector('.spesa-body .importo').innerText));
        card.style.display = 'none';
        card.classList.remove("selected");
    });

    let totCell = totaleHTML.querySelector(".importo-totale");
    const totValue = estraiImporto(totCell.innerText);
    const newTot = (totValue + valuesSelected).toFixed(2);
    totCell.textContent = newTot + " €";

}

function estraiImporto(str) {
  const clean = str.replace(/[^0-9\.-]+/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
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
            criteri.push(card.innerText.trim());
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

