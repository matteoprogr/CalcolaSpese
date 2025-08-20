import { saveSpesa } from './queryDexie.js';
import { createCriteri } from './main.js';
import { showErrorToast } from './main.js';

export function creaSpesaComponent(spesa) {
       const container = document.createElement("div");
       container.classList.add("spesa");
       container.setAttribute("datains", spesa.dataInserimento);

       container.innerHTML = `
         <div class="spesa-header">
           <small class="data">${spesa.dataSpesa}</small>
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

       return container;
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
           <span class="importo">${totale.toFixed(2)} €</span>
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

export function overlayAddSpesa() {
const openBtn = document.getElementById('addSpesaBtn');
const closeBtn = document.getElementById('closeFormBtn');
const overlay = document.getElementById('spesaFormOverlay');
const form = document.getElementById('spesaForm');
const mainContent = document.querySelector('.main-content');

openBtn.addEventListener('click', () => {
  overlay.style.display = 'flex';
  mainContent.classList.add('blur-active');
  setTimeout(() => overlay.classList.add('show'), 10);
});

closeBtn.addEventListener('click', () => {
  overlay.classList.remove('show');
  mainContent.classList.remove('blur-active');
  setTimeout(() => overlay.style.display = 'none', 300);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const spesa = {
    categoria: document.getElementById('categoria').value,
    dataSpesa: document.getElementById('data').value,
    importo: -Math.abs(parseFloat(document.getElementById('importo').value)),
    descrizione: document.getElementById('descrizione').value
  };

  try {
    await saveSpesa(spesa);
    overlay.classList.remove('show');
    mainContent.classList.remove('blur-active');
    setTimeout(() => overlay.style.display = 'none', 300);
    createCriteri();
    form.reset();
  } catch (err) {
    showErrorToast("Errore durante il salvataggio:", "error");
  }
});

}
