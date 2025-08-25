import { saveSpesa } from './queryDexie.js';
import { updateSpesa } from './queryDexie.js';
import { createCriteri } from './main.js';
import { showErrorToast } from './main.js';
import { getCategorie } from './queryDexie.js';

export function creaSpesaComponent(spesa) {
       const container = document.createElement("div");
       container.classList.add("spesa");
       container.setAttribute("datains", spesa.dataInserimento);
       container.setAttribute("id", spesa.id);

       container.innerHTML = `
         <div class="spesa-header">
           <small class="data">${formatDate(spesa.dataSpesa)}</small>
           <button class="spesa-btn" type="button">✏️</button>
         </div>
         <div class="spesa-body">
           <span class="descrizione">${spesa.descrizione}</span>
           <span class="importo">${spesa.importo.toFixed(2)} €</span>
         </div>
         <div class="spesa-footer">
           <small class="categoria">${spesa.categoria}</small>
         </div>
       `;

         // Aggiungi l'evento di clic per alternare la classe 'selected'
         container.addEventListener("click", () => {
           container.classList.toggle("selected");
         });

         const editBtn = container.querySelector('.spesa-btn');
         editBtn.addEventListener("click", (e) => {
             e.stopPropagation();
             overlayEdit(spesa);
         });

       return container;
     }


function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("it-IT");
}


export function creaComponentTotale(spese) {

    let totale = 0;
    spese.forEach(spesa => {
        totale += parseFloat(spesa.importo);
    });
    const container = document.createElement("div");
       container.classList.add("spesa-totale");
       container.innerHTML = `
         <div>
           <span class="importo-totale">${totale.toFixed(2)} €</span>
         </div>
       `;

           return container;
}

export function nessunaElementoComponent(tipo) {
        const container = document.createElement("div");
        container.classList.add("nessuna-spesa");
           container.innerHTML = `
             <div>
               <span>Nessuna ${tipo} disponibile</span>
             </div>
           `;

               return container;
}

export function categoriaComponent(categoria) {
        const container = document.createElement("div");
        container.classList.add("cat");
           container.innerHTML = `
             <div>
               <span> ${categoria} </span>
             </div>
           `;

            container.addEventListener("click", () => {
              container.classList.toggle("selected");
            });

        return container;
}

export async function overlayAddSpesa() {
const openBtn = document.getElementById('addSpesaBtn');
const overlay = document.getElementById('spesaFormOverlay');
const form = document.getElementById('spesaForm');
const categoriaInput = document.getElementById('categoria');
const saveBtn = document.getElementById("saveBtn");
const catRow = document.getElementById('categorieCardsAdd');
const closeBtn = document.getElementById('closeFormBtn');
const importo = document.getElementById('importo');
const descrizione = document.getElementById('descrizione');
const data = document.getElementById('data');

openBtn.addEventListener('click', async (e) => {
        if (overlay.classList.contains('showOverlay')) {
            overlay.classList.remove('showOverlay');
        } else {
            catRow.innerHTML = "";
            overlay.classList.toggle("showOverlay");
            const categorie = await getCategorie();
            categorie.forEach(cat => {
            const card = catOverlay(cat.categoria, "addSpesa");
            catRow.appendChild(card);
            data.value = new Date().toISOString().split("T")[0];
            });
        }
         document.addEventListener('click', (event) => {
            if (!overlay.classList.contains('showOverlay')) return;
            if (event.target.closest('#spesaFormOverlay') || event.target.closest('#addSpesaBtn')) return;
              overlay.classList.remove('showOverlay');
          });
    });
    closeBtn.addEventListener('click',async () =>{
        overlay.classList.remove('showOverlay');
    });

    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const spesa = {
        categoria: categoriaInput.value.trim(),
        dataSpesa: document.getElementById('data').value,
        importo: -Math.abs(parseFloat(importo.value)),
        descrizione: descrizione.value
      };

      try {
        await saveSpesa(spesa);
        overlay.classList.remove('showOverlay');
        createCriteri();
        categoriaInput.value = "";
        importo.value = "";
        descrizione.value = "";
      } catch (err) {
        showErrorToast("Errore durante il salvataggio:", "error");
      }
    });
}

export async function overlayRicerca() {

    const openBtn = document.getElementById('getSpesaBtn');
    const overlay = document.getElementById('overlayRicerca');
    const catRow = document.getElementById('categorieCardsEntrata');

    openBtn.addEventListener('click', async (e) => {
        if (overlay.classList.contains('showOverlay')) {
            overlay.classList.remove('showOverlay');
        } else {
            catRow.innerHTML = "";
            overlay.classList.toggle("showOverlay");
            const categorie = await getCategorie();
            categorie.forEach(cat => {
            const card = catOverlay(cat.categoria, "getSpese");
            catRow.appendChild(card);
            });
        }
         document.addEventListener('click', (event) => {
            if (!overlay.classList.contains('showOverlay')) return;
            if (event.target.closest('#overlayRicerca') || event.target.closest('#getSpesaBtn')) return;
              overlay.classList.remove('showOverlay');
          });
    });
  }

function catOverlay(categoria, sezione) {
        const container = document.createElement("div");
        container.classList.add("card");
           container.innerHTML = `
             <div>
               <span> ${categoria} </span>
             </div>
           `;

            container.addEventListener("click", () => {
              const categoriaElement = container.querySelector("span");
              container.classList.toggle("selected");
              if(sezione === "getSpese"){
                    createCriteri();
              }else if(sezione === "addSpesa"){
                    const categoria = document.getElementById('categoria');
                    container.classList.toggle("selected");
                    categoria.value = categoriaElement.innerText;
              }else if(sezione === "editSpesa"){
                    const categoria = document.getElementById('editCategoria');
                    container.classList.toggle("selected");
                    categoria.value = categoriaElement.innerText;
              }

            });

        return container;
}

export async function overlayEdit(spesa) {
    const overlay = document.getElementById('editSpesaFormOverlay');
    const catRow = document.getElementById('categorieCardsEdit');
    const editBtn = document.getElementById('editBtn');
    const closeBtn = document.getElementById('closeEditFormBtn');
    const dataInserimento = spesa.dataInserimento;

    // Popola i campi del form con i dati della spesa
    document.getElementById('editSpesaId').value = spesa.id;
    const categoriaElement = document.getElementById('editCategoria');
    categoriaElement.value = spesa.categoria.trim();
    document.getElementById('editData').value = spesa.dataSpesa;
    document.getElementById('editImporto').value = Math.abs(spesa.importo); // Rimuovi il segno negativo per visualizzazione
    document.getElementById('editDescrizione').value = spesa.descrizione;


    closeBtn.addEventListener('click',async () =>{
        overlay.classList.remove('showOverlay');
    });


    catRow.innerHTML = "";
    overlay.classList.add("showOverlay");
    const categorie = await getCategorie();
    categorie.forEach(cat => {
    const card = catOverlay(cat.categoria, "editSpesa");
    catRow.appendChild(card);
    });
    document.addEventListener('click', (event) => {
        if (!overlay.classList.contains('showOverlay')) return;
        if (event.target.closest('#editSpesaFormOverlay')) return;
          overlay.classList.remove('showOverlay');
      });


    editBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const spesa = {
        id: parseInt(document.getElementById('editSpesaId').value),
        categoria: categoriaElement.value,
        dataInserimento: dataInserimento,
        dataSpesa: document.getElementById('editData').value,
        importo: -Math.abs(parseFloat(document.getElementById('editImporto').value)),
        descrizione: document.getElementById('editDescrizione').value
     };
       try {
         await updateSpesa(spesa);
         overlay.classList.remove('showOverlay');
         createCriteri();
       } catch (err) {
         showErrorToast("Errore durante la modifica:", "error");
       }
    });
}