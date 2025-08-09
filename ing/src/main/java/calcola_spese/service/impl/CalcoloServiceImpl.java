package calcola_spese.service.impl;

import calcola_spese.service.CalcoloService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;


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
    public Map<String, Double> calcola(MultipartFile file, String dataInizio, String dataFine) {

       return estraiSpese(file, dataInizio, dataFine);

    }

    @Override
    public Map<String, Double> estraiSpese(MultipartFile file, String dataInizio, String dataFine) {

        Map<String, Double> data;
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            data = elaborazioneExcelIngdirect(sheet, dataFine, dataInizio);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return sommaSpeseIngdirect(data);

    }

    public Map<String, Double> elaborazioneExcelIngdirect(Sheet sheet, String dataBefore, String dataAfter) {
        String[][]  matrice = estraiExcel(sheet);
        int righe = matrice.length;
        int indexDataValuta = 2;
        int indexDescrizione = 4;
        int indexValore = 5;
        String before = convertIsoToCustomFormat(dataBefore);
        String after = convertIsoToCustomFormat(dataAfter);
        Map<String, Double> data = new HashMap<>();

        for (int riga = 13; riga < righe; riga++) {
            String descrizione = matrice[riga][indexDataValuta];
            String valore =  matrice[riga][indexValore];
            if(isBeforeAndAfter(after,before,matrice[riga][indexDataValuta]) && descrizione != null && valore != null) {
                double parseDouble = Double.parseDouble(valore);
                if(data.get(descrizione) != null && parseDouble < 0) {
                    double val = data.get(descrizione);
                    val += Double.parseDouble(valore);
                    data.put(matrice[riga][indexDescrizione],val);
                }else if(parseDouble < 0){
                    data.put(matrice[riga][indexDescrizione], Double.parseDouble(matrice[riga][indexValore]));
                }
            }

        }
        return data;

    }

    public String convertIsoToCustomFormat(String isoDate) {
        LocalDate localDate = LocalDate.parse(isoDate);
        ZonedDateTime zonedDateTime = localDate.atStartOfDay(ZoneId.systemDefault());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);
        return zonedDateTime.format(formatter);
    }

    public static boolean isBeforeAndAfter(String after, String before, String dataValuta) {
        String pattern = "EEE MMM dd HH:mm:ss zzz yyyy";
        SimpleDateFormat formatter = new SimpleDateFormat(pattern, Locale.ENGLISH);
        boolean isBefore;
        boolean isAfter;

        try {
            Date dateAfter = formatter.parse(after);
            Date dateBefore = formatter.parse(before);
            Date dataValutaDate = formatter.parse(dataValuta);

            if (dateAfter == null || dateBefore == null) {
                return false;
            }

            isBefore = dataValutaDate.before(dateBefore);
            isAfter = dataValutaDate.after(dateAfter);
        } catch (ParseException e) {
            return false;
        }
        return isBefore && isAfter;
    }


    public Map<String, Double> sommaSpeseIngdirect(Map<String, Double> data) {
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

    public String[][] estraiExcel(Sheet sheet) {
        int lastRowNum = sheet.getLastRowNum();
        // Numero colonne preso dalla prima riga

        Row firstRow = null;
        Row row1 = null;
        boolean fineTabella = false;
        int contataore = 0;
        int i = 0;
        while (!fineTabella) {
            row1 = sheet.getRow(i);
            if(row1 == null){
                contataore++;
            }else{
                firstRow = row1;
                contataore = 0;
            }
            if(contataore == 10){
                fineTabella = true;
            }
            i++;
        }
        int numCols = (firstRow != null) ? firstRow.getLastCellNum() : 0;

        // Crea la matrice di stringhe
        String[][] matrix = new String[lastRowNum + 1][numCols];

        for (int r = 0; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                // Riga vuota: riempi con stringhe vuote
                for (int c = 0; c < numCols; c++) {
                    matrix[r][c] = "";
                }
                continue;
            }

            for (int c = 0; c < numCols; c++) {
                Cell cell = row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                matrix[r][c] = getCellValueAsString(cell);
            }
        }

        return matrix;
    }

    // Metodo di utilità per estrarre il valore di una cella come stringa
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return Double.toString(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return Boolean.toString(cell.getBooleanCellValue());
            case BLANK:
                return "";
            default:
                return "";
        }
    }

}
