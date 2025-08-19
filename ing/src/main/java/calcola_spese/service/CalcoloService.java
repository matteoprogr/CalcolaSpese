package calcola_spese.service;

import calcola_spese.dto.DataTabella;
import org.springframework.web.multipart.MultipartFile;



public interface CalcoloService {

    DataTabella estraiSpese(MultipartFile file,String nomeBanca, String dataInizio, String dataFine);

    DataTabella sommaSpeseIngdirect(DataTabella data);

    byte[] download(DataTabella data);

    DataTabella elaborazioneImport(MultipartFile file);
}
