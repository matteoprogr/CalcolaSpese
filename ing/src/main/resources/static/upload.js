import { saveSpesa } from './queryDexie.js';
import { querySpese } from './queryDexie.js';
import { deleteSpese } from './queryDexie.js';
import { popolaCategoria } from './queryDexie.js';

async function initDate() {
    const oggi = new Date();
    const meseFa = new Date();
    meseFa.setMonth(oggi.getMonth() - 1);

    const formattaData = (data) => {
      const anno = data.getFullYear();
      const mese = String(data.getMonth() + 1).padStart(2, '0');
      const giorno = String(data.getDate()).padStart(2, '0');
      return `${anno}-${mese}-${giorno}`;
    };

    document.getElementById('startDateExpense').value = formattaData(meseFa);
    document.getElementById('endDateExpense').value = formattaData(oggi);
  };

const manualForm = document.getElementById('manualForm');

document.querySelectorAll('nav a').forEach(link => {
 const targetId = link.getAttribute('data-target');
    link.addEventListener('click', () => {
        // Rimuove classe active da tutti i link
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        targetSection.classList.add('active');

    });

        if (targetId === 'traccia-spesa') {
           initDate();
           getSpese();
        }
});

async function tracciaSpeseClick(criteri) {
    try {
        const spese = await querySpese(criteri);
        await creaTabellaManuale(spese);
    } catch (err) {
        console.error("Errore nel recupero spese:", err);
    }
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

     spese.forEach(spesa => {
         const tr = document.createElement("tr");

         // Colonna checkbox
         const tdCheck = document.createElement("td");
         const checkbox = document.createElement("input");
         checkbox.type = "checkbox";
         checkbox.value = spesa.dataInserimento;
         tdCheck.appendChild(checkbox);
         tr.appendChild(tdCheck);

         // Colonna Data Spesa
         const tdData = document.createElement("td");
         tdData.textContent = spesa.dataSpesa || "";
         tdData.style.textAlign = "center";
         tr.appendChild(tdData);

         // Colonna Categoria
         const tdCategoria = document.createElement("td");
         tdCategoria.textContent = spesa.categoria || "";
         tdCategoria.style.textAlign = "center";
         tr.appendChild(tdCategoria);

         // Colonna Descrizione
         const tdDescr = document.createElement("td");
         tdDescr.textContent = spesa.descrizione || "";
         tdDescr.style.textAlign = "center";
         tr.appendChild(tdDescr);

         // Colonna Importo
         const tdImporto = document.createElement("td");
         tdImporto.textContent = spesa.importo ? spesa.importo.toFixed(2) : "0.00";
         tdImporto.style.textAlign = "center";
         tr.appendChild(tdImporto);

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

function isValid(value) {
    return value != null && !Number.isNaN(value) && value !== "";
}


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
           alert("Inserisci un file Excel e seleziona un mese o un intervallo di date.");
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

document.getElementById("getSpesaBtn").addEventListener("click", getSpese);
document.getElementById("deleteSpesaBtn").addEventListener("click", deleteSpesaBtn);


async function getSpese() {
    const dataInizio = new Date(manualForm.startDateExpense.value).toISOString().split('T')[0];
    const dataFine = new Date(manualForm.endDateExpense.value).toISOString().split('T')[0];

    const criteri = {};
    if (isValid(manualForm.categoria.value)) {
        criteri.categoria = manualForm.categoria.value;
    }

    const importo = parseFloat(manualForm.importo.value);
    if (isValid(importo)) {
        criteri.importoMin = importo;
        criteri.importoMax = importo;
    }

    if(isValid(manualForm.startDateExpense.value)){
       criteri.dataInizio = dataInizio
    }
    if(isValid(manualForm.endDateExpense.value)){
       criteri.dataFine = dataFine
    }

     await tracciaSpeseClick(criteri);;
}

async function deleteSpesaBtn() {
    const rows = document.querySelectorAll("#resultsBodyManual tr");
    const criteri = {};
    rows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
          if (!Array.isArray(criteri.dataInserimento)) {
            criteri.dataInserimento = [];
          }
          criteri.dataInserimento.push(checkbox.value);
        }
      });
     if (criteri.dataInserimento && criteri.dataInserimento.length > 0) {
        await deleteSpese(criteri);
        getSpese();
      }
}

document.getElementById("manualForm").addEventListener("submit", async function (e) {e.preventDefault();});

async function resetForm(){
    const startDate = manualForm.startDateExpense.value;
    const endDate = manualForm.endDateExpense.value;

    manualForm.reset();
    manualForm.startDateExpense.value = startDate;
    manualForm.endDateExpense.value = endDate;
}

document.getElementById("uploadResultBtn").addEventListener("click", function () {
    const tabella = document.getElementById("resultsBody");
    const rowTot = document.getElementById("rigaTotaleBackend");
    const rows = tabella.getElementsByTagName("tr");
    const dati = {};

    for (let row of rows) {
        const celle = row.getElementsByTagName("td");
        if (celle.length === 3) {
            const chiave = celle[1].innerText.trim();
            const valore = parseFloat(celle[2].innerText.trim());
            if(chiave !== "" && valore !== null && valore !== undefined && valore !== NaN){
                dati[chiave] = valore;
            }
        }
    }
    const celle = rowTot.getElementsByTagName("td");
    const chiave = celle[1].innerText.trim();
    const valore = parseFloat(celle[2].innerText.trim());
    dati[chiave] = valore;


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
});


function mostraTabella(data) {
    const resultsTable = document.getElementById("resultsTable");
    const resultsTableTot = document.getElementById("resultsTableTot");
    const resultsBody = document.getElementById("resultsBody");
    const resultsBodyTot = document.getElementById("resultsBodyTot");

    resultsBody.innerHTML = "";
    resultsBodyTot.innerHTML = "";

    for (const [chiave, valore] of Object.entries(data)) {

        if(chiave.toLowerCase() === "totale"){
         aggiungiRiga(chiave,valore,"resultsBodyTot");
        }else{
         aggiungiRiga(chiave,valore,"resultsBody");
         }
    }

    // Aggiungi riga "Totale selezionato"
    const totalRow = document.createElement("tr");
    totalRow.id = "rigaTotaleSelezionato";
    totalRow.style.fontWeight = "bold";
    totalRow.style.backgroundColor = "#e0f7fa";

    const emptyCell = document.createElement("td");
    const labelCell = document.createElement("td");
    labelCell.textContent = "Totale selezionato";

    const valueCell = document.createElement("td");
    valueCell.id = "totaleLive";
    valueCell.textContent = "0.00";

    totalRow.appendChild(emptyCell);
    totalRow.appendChild(labelCell);
    totalRow.appendChild(valueCell);
    resultsBodyTot.appendChild(totalRow);

    const buttonRow = document.createElement("tr");
    buttonRow.id = "buttonRow";
    const buttonCell = document.createElement("td");
    buttonCell.colSpan = 1;
    buttonCell.style.textAlign = "left";

    const addRowBtn = document.createElement("button");
    addRowBtn.textContent = "+";
    addRowBtn.id = "addRowBtn";
    addRowBtn.title = "Aggiungi riga";
    addRowBtn.addEventListener("click", function(event) {
    const inputTesto = document.getElementById("inputTesto");
    const inputDouble = document.getElementById("inputDouble");
    addNuovaRiga(inputTesto, inputDouble);
    });

    buttonCell.appendChild(addRowBtn);
    buttonRow.appendChild(buttonCell);

    // 2️⃣ Seconda cella: input testo
    const textCell = document.createElement("td");
    const inputText = document.createElement("input");
    inputText.type = "text";
    inputText.style.width = "100%";
    inputText.required = true;
    inputText.id = "inputTesto";
    textCell.appendChild(inputText);
    buttonRow.appendChild(textCell);

    // 3️⃣ Terza cella: input double
    const numberCell = document.createElement("td");
    const inputNumber = document.createElement("input");
    inputNumber.type = "number";
    inputNumber.step = "0.01";
    inputNumber.id = "inputDouble";
    inputNumber.style.width = "100%";
    inputNumber.required = true;
    numberCell.appendChild(inputNumber);
    buttonRow.appendChild(numberCell);

    resultsBody.appendChild(buttonRow);

    aggiornaTotaleLive(); // calcolo iniziale
    resultsTable.style.display = "table";
    resultsTableTot.style.display = "table";
    document.getElementById("mergeRowsBtn").style.display = "inline-block";
    document.getElementById("uploadResultBtn").style.display = "inline-block";
    document.getElementById("removeRowsBtn").style.display = "inline-block";

}

function addNuovaRiga(inputTesto, inputDouble) {
    const resultsBody = document.getElementById("resultsBody");

    const testo = inputTesto.value.trim();
    // valore inserito con il meno " - "
    const numero = parseFloat(-inputDouble.value);

    if (!testo) {
        alert("Inserisci un testo valido");
        return;
    }
    if (isNaN(numero)) {
        alert("Inserisci un numero valido");
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
        aggiungiRiga(testo, numero,"resultsBody");
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
       const checkbox = row.querySelector("input[type='checkbox']");
       const valoreCell = row.querySelector(".valore-spesa");
       const etichettaCell = row.children[1];
       const etichetta = etichettaCell?.textContent?.toLowerCase();

        if(valoreCell){
        const valore = parseFloat(valoreCell.textContent);
           somma += valore;
        }
   });

   const elementTot = rowsTot[0];
   let valueTot = parseFloat(somma).toFixed(2);
   elementTot.children[2].textContent = valueTot;

}

function aggiornaTotaleLive() {
    let somma = 0;
    const rows = document.querySelectorAll("#resultsBody tr");

    rows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const valoreCell = row.querySelector(".valore-spesa");
        const etichettaCell = row.children[1];

        // Esclude la riga "totale" del backend dal calcolo
        const etichetta = etichettaCell?.textContent?.toLowerCase();
        const isTotaleBackend = etichetta === "totale";

        if (checkbox && checkbox.checked && valoreCell && !isTotaleBackend) {
            const valore = parseFloat(valoreCell.textContent);
            if (!isNaN(valore)) {
                somma += valore;
            }
        }
    });

    const totaleCell = document.getElementById("totaleLive");
    if (totaleCell) {
        totaleCell.textContent = somma.toFixed(2);
    }
}

document.getElementById("mergeRowsBtn").addEventListener("click", unisciRigheSelezionate);
document.getElementById("removeRowsBtn").addEventListener("click", rimuoviRigheSelezionate);

function rimuoviRigheSelezionate() {
    const rows = document.querySelectorAll("#resultsBody tr");
    const rowsTot = document.querySelectorAll("#resultsBodyTot tr");
    const righeRimuovere = [];
    let sommadaRimuovere = 0;
    let valoreTotale = 0;

    // raccoglie le righe con checkbox selezionata, escludendo totale
    rows.forEach(row => {

        const checkbox = row.querySelector("input[type='checkbox']");
        const valoreCell = row.querySelector(".valore-spesa");
        const etichettaCell = row.children[1];
        const etichetta = etichettaCell?.textContent?.toLowerCase();

        if (checkbox && checkbox.checked && !checkbox.disabled && valoreCell) {
            const valore = parseFloat(valoreCell.textContent);
            const etichetta = etichettaCell.textContent;
            righeRimuovere.push({ etichetta, valore, row });
            sommadaRimuovere += valore;
        }
    });

     // Se meno di due righe selezionate, non si unisce
        if (righeRimuovere.length < 1) {
            alert("Seleziona almeno una riga da rimuovere.");
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
        const checkbox = row.querySelector("input[type='checkbox']");
        const valoreCell = row.querySelector(".valore-spesa");
        const etichettaCell = row.children[1];

        if (checkbox && checkbox.checked && !checkbox.disabled && valoreCell) {
            const valore = parseFloat(valoreCell.textContent);
            const etichetta = etichettaCell.textContent;
            righeDaUnire.push({ etichetta, valore, row });
        }
    });

    // Se meno di due righe selezionate, non si unisce
    if (righeDaUnire.length < 2) {
        alert("Seleziona almeno due righe da unire.");
        return;
    }

    // Somma valori e concatena etichette
    const nuovaEtichetta = righeDaUnire.map(r => r.etichetta).join(" + ");
    const nuovoValore = righeDaUnire.reduce((acc, curr) => acc + curr.valore, 0);

    // Rimuove le righe originali
    righeDaUnire.forEach(r => r.row.remove());

    aggiungiRiga(nuovaEtichetta, nuovoValore,"resultsBody");

    aggiornaTotale();

}

function aggiungiRiga(nuovaEtichetta,nuovoValore,results) {
   // Aggiunge la nuova riga unita
     if (!nuovaEtichetta) {
           alert("Inserisci un testo valido");
           return;
       }
       if (isNaN(nuovoValore)) {
           alert("Inserisci un numero valido");
           return;
       }
    const tabella = document.getElementById(results);
    const nuovaRiga = document.createElement("tr");

    const checkboxCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.addEventListener("change", aggiornaTotaleLive);
    checkboxCell.appendChild(checkbox);

    const etichettaCell = document.createElement("td");
    etichettaCell.textContent = nuovaEtichetta;

    const valoreCell = document.createElement("td");
    valoreCell.classList.add("valore-spesa");
    valoreCell.textContent = nuovoValore.toFixed(2);

    if (nuovaEtichetta.toLowerCase() === "totale") {
        checkbox.disabled = true;
        checkbox.style.visibility = "hidden";
        nuovaRiga.style.fontWeight = "bold";
        nuovaRiga.id = "rigaTotaleBackend";
    }

    nuovaRiga.appendChild(checkboxCell);
    nuovaRiga.appendChild(etichettaCell);
    nuovaRiga.appendChild(valoreCell);

    // Inserisci la riga appena prima della riga del totale live
    const buttonwRow = document.getElementById("buttonRow");
    tabella.insertBefore(nuovaRiga, buttonwRow);
}

document.addEventListener("DOMContentLoaded", () => {
    popolaCategoria();
    document.getElementById("modalForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const spesa = {
        categoria: formData.get("categoria"),
        dataSpesa: formData.get("dataSpesa"),
        importo: parseFloat(formData.get("importo")),
        descrizione: formData.get("descrizione")
        };
        await saveSpesa(spesa);  // la tua funzione salva
        await getSpese();        // la tua funzione aggiorna la tabella
        e.target.reset();
    });
});

//const fullscreenBtn = document.getElementById("fullscreenBtn");

//function isMobile() {
//  return window.innerWidth <= 768;
//}
//
//
//// All'avvio
//if (isMobile()) {
//  fullscreenBtn.style.display = "block";
//}
//
//// Gestione click fullscreen
//fullscreenBtn.addEventListener("click", async () => {
//  try {
//    await document.documentElement.requestFullscreen();
//    if (screen.orientation && screen.orientation.lock) {
//      await screen.orientation.lock("landscape");
//    }
//  } catch (err) {
//    console.warn("Fullscreen/orientamento non riuscito:", err);
//  }
//});
//
//// Evento cambio fullscreen (entra/esce)
//document.addEventListener("fullscreenchange", () => {
//  if (document.fullscreenElement) {
//    fullscreenBtn.style.display = "none"; // in fullscreen → nascondi bottone
//  } else if (isMobile()) {
//    fullscreenBtn.style.display = "block"; // fuori fullscreen → torna visibile
//  }
//});
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isMobile()) {
  document.getElementById("fullscreenBtn").style.display = "block";
}

document.getElementById("fullscreenBtn").addEventListener("click", async () => {
  try {
    await document.documentElement.requestFullscreen();
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (err) {
    console.warn("Fullscreen/orientamento non riuscito:", err);
  }
});
