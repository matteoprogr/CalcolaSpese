package CalcolaSpese.ing.services.impl;

import CalcolaSpese.ing.services.CalcoloService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CalcoloServiceImpl implements CalcoloService {
    @Override
    public Map<String, Double> calcola(MultipartFile file, int mese) {

       return estraiSpese(file, mese);

    }

    @Override
    public Map<String, Double> estraiSpese(MultipartFile file, int mese) {

        Map<String, Double> data = new HashMap<>();
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);  // prima tabella

            for (Row row : sheet) {
                // Indici colonne (base 0):
                // Colonna 2 = indice 2 -> data valuta (stringa)
                // Colonna 4 = indice 4 -> presso (stringa)
                // Colonna 5 = indice 5 -> valore (double)

                Cell cellDataValuta = row.getCell(2);
                Cell cellPresso = row.getCell(4);
                Cell cellValore = row.getCell(5);

                if (cellDataValuta == null || cellPresso == null || cellValore == null)
                    continue;

                String dataValuta;
                if (cellDataValuta.getCellType() == CellType.STRING) {
                    dataValuta = cellDataValuta.getStringCellValue();
                } else if (cellDataValuta.getCellType() == CellType.NUMERIC) {
                    if (DateUtil.isCellDateFormatted(cellDataValuta)) {
                        Date date = cellDataValuta.getDateCellValue();
                        SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy"); // oppure "yyyy-MM-dd"
                        dataValuta = sdf.format(date);
                    } else {
                        dataValuta = String.valueOf(cellDataValuta.getNumericCellValue());
                    }
                } else {
                    dataValuta = "";
                }
                String presso = cellPresso.getStringCellValue();

                if (dataValuta == null || dataValuta.isEmpty() || presso == null || presso.isEmpty())
                    continue;

                // Controllo mese nel formato dd/MM/yyyy o simile
                String[] splitDataValuta = dataValuta.split("-");

                if (splitDataValuta.length > 1) {
                    String meseStr = splitDataValuta[1];
                    int meseRiga;
                    try {
                        meseRiga = Integer.parseInt(meseStr);
                    } catch (NumberFormatException e) {
                        continue;
                    }

                    if (meseRiga == mese) {
                        double valore;

                        // Proviamo a leggere il valore come numero o stringa numerica
                        if (cellValore.getCellType() == CellType.NUMERIC) {
                            valore = cellValore.getNumericCellValue();
                        } else {
                            try {
                                valore = Double.parseDouble(cellValore.getStringCellValue());
                            } catch (NumberFormatException ex) {
                                continue;
                            }
                        }

                        if (valore < 0) {
                            data.put(presso, valore);
                        }
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return sommaSpese(data);

    }

    @Override
    public Map<String, Double> sommaSpese(Map<String, Double> data) {
        Map<String, Double> pulisciChiave = new LinkedHashMap<>();

        for (Map.Entry<String, Double> entry : data.entrySet()) {
            String presso = entry.getKey();
            if (presso.toLowerCase().contains("presso")) {
                int index = presso.toLowerCase().indexOf("presso");
                presso = presso.substring(index);
            }

            pulisciChiave.merge(presso, entry.getValue(), Double::sum);
        }

        double tot = pulisciChiave.values().stream().mapToDouble(Double::doubleValue).sum();
        pulisciChiave.put("totale", tot);

        return pulisciChiave;
    }
}
