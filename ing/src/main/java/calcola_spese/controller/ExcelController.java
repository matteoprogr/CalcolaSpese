package calcola_spese.controller;

import calcola_spese.service.CalcoloService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @RequestParam("mese") int mese) {

        if (file.isEmpty() || mese < 1 || mese > 12) {
            throw new IllegalArgumentException("File vuoto o mese non valido.");
        }

        Map<String, Double> calcoloSpese = calcoloService.calcola(file, mese);

        return ResponseEntity.ok(calcoloSpese);
    }

    @PostMapping("/download")
    public ResponseEntity<byte[]> handleDownload(@RequestBody Map<String, Double> body) {

        byte[] file = calcoloService.download(body);
        return ResponseEntity.ok(file);
    }
}
