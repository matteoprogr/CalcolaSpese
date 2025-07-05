package CalcolaSpese.ing.services;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CalcoloService {

    Map<String, Double> calcola(MultipartFile file, int mese);

    Map<String, Double> estraiSpese(MultipartFile file, int mese);

    Map<String, Double> sommaSpese(Map<String, Double> data);
}
