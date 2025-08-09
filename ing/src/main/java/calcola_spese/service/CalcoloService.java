package calcola_spese.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CalcoloService {

    Map<String, Double> calcola(MultipartFile file, String dataInizio, String dataFine);

    Map<String, Double> estraiSpese(MultipartFile file, String dataInizio, String dataFine);

    Map<String, Double> sommaSpeseIngdirect(Map<String, Double> data);

    byte[] download(Map<String, Double> data);
}
