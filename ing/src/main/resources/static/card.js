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

