package CalcolaSpese.ing.controllers;

import CalcolaSpese.ing.services.CalcoloService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/excel")
public class ExcelUploadController {

   private final CalcoloService calcoloService;

    public ExcelUploadController(CalcoloService calcoloService) {
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
}
