package calcola_spese.controller;

import calcola_spese.dto.DataTabella;
import calcola_spese.service.CalcoloService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/excel")
public class ExcelController {

   private final CalcoloService calcoloService;

    public ExcelController(CalcoloService calcoloService) {
        this.calcoloService = calcoloService;
    }

    @PostMapping("/upload")
    public  ResponseEntity<DataTabella> handleUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("nomeBanca") String nomeBanca,
            @RequestParam("dataInizio") String dataInizio,
            @RequestParam("dataFine") String dataFine) {

        if (file.isEmpty() && nomeBanca.isEmpty()) {
            throw new IllegalArgumentException("File vuoto o mese non valido.");
        }

        DataTabella calcoloSpese = calcoloService.estraiSpese(file,nomeBanca, dataInizio, dataFine);

        return ResponseEntity.ok(calcoloSpese);
    }

    @PostMapping("/download")
    public ResponseEntity<byte[]> handleDownload(@RequestBody DataTabella body) {

        byte[] file = calcoloService.download(body);
        return ResponseEntity.ok(file);
    }

    @PostMapping("/import")
    public ResponseEntity<DataTabella> importExcel(@RequestParam("file") MultipartFile file) {

        DataTabella result = calcoloService.elaborazioneImport(file);
        return ResponseEntity.ok(result);
    }
}
