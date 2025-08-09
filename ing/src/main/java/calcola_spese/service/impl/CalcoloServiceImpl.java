package calcola_spese.service.impl;

import calcola_spese.service.CalcoloService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;



@Service
public class CalcoloServiceImpl implements CalcoloService {

    @Override
    public byte[] download(Map<String, Double> data) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Risultati");

            // === Stile intestazioni ===
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true); // grassetto
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER); // centro orizzontale
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER); // centro verticale
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            // Bordi
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Riga intestazioni
            Row header = sheet.createRow(0);
            Cell cell0 = header.createCell(0);
            cell0.setCellValue("Categoria / Presso");
            cell0.setCellStyle(headerStyle);

            Cell cell1 = header.createCell(1);
            cell1.setCellValue("Importo (€)");
            cell1.setCellStyle(headerStyle);

            // Righe dati
            int rowIndex = 1;
            for (Map.Entry<String, Double> entry : data.entrySet()) {
                Row row = sheet.createRow(rowIndex++);

                Cell keyCell = row.createCell(0);
                Cell valueCell = row.createCell(1);

                keyCell.setCellValue(entry.getKey());
                valueCell.setCellValue(entry.getValue());

                // Se è la riga del totale → applica stile speciale
                if ("totale".equalsIgnoreCase(entry.getKey())) {
                    keyCell.setCellStyle(headerStyle);
                    valueCell.setCellStyle(headerStyle);
                }
            }

            // Adatta automaticamente la larghezza delle colonne
            for (int i = 0; i < 2; i++) {
                sheet.autoSizeColumn(i);
            }

            // Scrittura in memoria
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Errore durante la creazione del file Excel", e);
        }
    }
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
            throw new RuntimeException(e);
        }

        return sommaSpese(data);

    }

    @Override
    public Map<String, Double> sommaSpese(Map<String, Double> data) {
        Map<String, Double> pulisciChiave = new LinkedHashMap<>();

        for (Map.Entry<String, Double> entry : data.entrySet()) {
            String presso = entry.getKey();
            if (presso.toLowerCase().contains("presso")) {
                int index = presso.toLowerCase().indexOf("presso")+6;
                presso = presso.substring(index);
            }

            pulisciChiave.merge(presso, entry.getValue(), Double::sum);
        }

        double tot = pulisciChiave.values().stream().mapToDouble(Double::doubleValue).sum();
        pulisciChiave.put("totale", tot);

        return pulisciChiave;
    }
}
