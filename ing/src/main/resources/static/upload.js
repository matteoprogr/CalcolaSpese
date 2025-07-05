document.getElementById("uploadForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const monthSelect = document.getElementById("monthSelect");
    const file = fileInput.files[0];
    const selectedMonthNumber = monthSelect.value;

    if (!file || !selectedMonthNumber) {
        alert("Inserisci un file Excel e seleziona un mese.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mese", selectedMonthNumber);

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

function mostraTabella(data) {
    const resultsTable = document.getElementById("resultsTable");
    const resultsBody = document.getElementById("resultsBody");

    resultsBody.innerHTML = "";

    for (const [chiave, valore] of Object.entries(data)) {
        const row = document.createElement("tr");

        // Colonna checkbox
        const checkboxCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;

        // Se è la riga "totale" backend, la disattivo
        if (chiave.toLowerCase() === "totale") {
            checkbox.disabled = true;
            checkbox.style.visibility = "hidden";
            row.style.fontWeight = "bold";
            row.id = "rigaTotaleBackend"; // 👈 AGGIUNTO
        }
         else {
            checkbox.addEventListener("change", aggiornaTotaleLive);
        }

        checkboxCell.appendChild(checkbox);

        // Colonne categoria e valore
        const cellKey = document.createElement("td");
        cellKey.textContent = chiave;

        const cellValue = document.createElement("td");
        cellValue.textContent = valore.toFixed(2);
        cellValue.classList.add("valore-spesa");

        row.appendChild(checkboxCell);
        row.appendChild(cellKey);
        row.appendChild(cellValue);
        resultsBody.appendChild(row);
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
    resultsBody.appendChild(totalRow);

    aggiornaTotaleLive(); // calcolo iniziale
    resultsTable.style.display = "table";
    document.getElementById("mergeRowsBtn").style.display = "inline-block";

    spostaRigheTotaliInFondo();


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

    // Aggiunge la nuova riga unita
    const resultsBody = document.getElementById("resultsBody");
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

    nuovaRiga.appendChild(checkboxCell);
    nuovaRiga.appendChild(etichettaCell);
    nuovaRiga.appendChild(valoreCell);

    // Inserisci la riga appena prima della riga del totale live
    const rigaTotale = document.getElementById("rigaTotaleSelezionato");
    resultsBody.insertBefore(nuovaRiga, rigaTotale);

    aggiornaTotaleLive();
    spostaRigheTotaliInFondo(); // 👈 AGGIUNTO

}
function spostaRigheTotaliInFondo() {
    const resultsBody = document.getElementById("resultsBody");
    const rigaTotaleBackend = document.getElementById("rigaTotaleBackend");
    const rigaTotaleSelezionato = document.getElementById("rigaTotaleSelezionato");

    if (rigaTotaleBackend) {
        resultsBody.appendChild(rigaTotaleBackend);
    }
    if (rigaTotaleSelezionato) {
        resultsBody.appendChild(rigaTotaleSelezionato);
    }
}


