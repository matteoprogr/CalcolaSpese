package calcola_spese.controller;

import calcola_spese.service.CalcoloService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/excel")
public class ExcelController {

   private final CalcoloService calcoloService;

    public ExcelController(CalcoloService calcoloService) {
        this.calcoloService = calcoloService;
    }

    @PostMapping("/upload")
    public  ResponseEntity<Map<String, Double>> handleUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("dataInizio") String dataInizio,
            @RequestParam("dataFine") String dataFine) {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File vuoto o mese non valido.");
        }

        Map<String, Double> calcoloSpese = calcoloService.calcola(file, dataInizio, dataFine);

        return ResponseEntity.ok(calcoloSpese);
    }

    @PostMapping("/download")
    public ResponseEntity<byte[]> handleDownload(@RequestBody Map<String, Double> body) {

        byte[] file = calcoloService.download(body);
        return ResponseEntity.ok(file);
    }
}
