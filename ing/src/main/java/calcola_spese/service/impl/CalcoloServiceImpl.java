package calcola_spese.service.impl;

import calcola_spese.dto.DataTabella;
import calcola_spese.exception.CatchAllException;
import calcola_spese.service.CalcoloService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;


@Service
@Slf4j
public class CalcoloServiceImpl implements CalcoloService {

    @Override
    public byte[] download(DataTabella dataTabella) {
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

           //Inserimento intestazioni
            Row header = sheet.createRow(0);

            //id
            Cell idCell = header.createCell(0);
            idCell.setCellValue("Id");
            idCell.setCellStyle(headerStyle);

            // Data
            Cell dataCell = header.createCell(1);
            dataCell.setCellValue("Data");
            dataCell.setCellStyle(headerStyle);

            // Categoria
            Cell categoriaCell = header.createCell(2);
            categoriaCell.setCellValue("Categoria");
            categoriaCell.setCellStyle(headerStyle);

            // Descrizione
            Cell descrizioneCell = header.createCell(3);
            descrizioneCell.setCellValue("Descrizione");
            descrizioneCell.setCellStyle(headerStyle);

            // Valore
            Cell valueCell = header.createCell(4);
            valueCell.setCellValue(" (€)");
            valueCell.setCellStyle(headerStyle);

            // Righe dati
            int indexRow = 1;
            for (int i = 0; i < dataTabella.getDataValuta().size(); i++) {
                Row row = sheet.createRow(indexRow++);

                Cell id = row.createCell(0);
                Cell data = row.createCell(1);
                Cell categoria = row.createCell(2);
                Cell descrizione = row.createCell(3);
                Cell valore = row.createCell(4);

                id.setCellValue(dataTabella.getId().get(i));
                data.setCellValue(dataTabella.getDataValuta().get(i));
                categoria.setCellValue(dataTabella.getCategoria().get(i));
                descrizione.setCellValue(dataTabella.getDescrizione().get(i));
                valore.setCellValue(dataTabella.getValore().get(i));
            }

            if(dataTabella.getTotale() != 0){
                Row row = sheet.createRow(dataTabella.getDataValuta().size()+1);

                Cell data = row.createCell(0);
                Cell categoria = row.createCell(1);
                Cell descrizione = row.createCell(2);
                Cell valore = row.createCell(3);
                // Se è la riga del totale → applica stile speciale
                data.setCellValue("");
                categoria.setCellValue("Totale");
                descrizione.setCellValue("");
                valore.setCellValue(dataTabella.getTotale());

                data.setCellStyle(headerStyle);
                categoria.setCellStyle(headerStyle);
                descrizione.setCellStyle(headerStyle);
                valore.setCellStyle(headerStyle);
            }


            // Adatta automaticamente la larghezza delle colonne
            for (int i = 0; i < 4; i++) {
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
    public DataTabella estraiSpese(MultipartFile file, String nomeBanca,String dataInizio, String dataFine) {

        DataTabella data = new DataTabella();
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            String[][]  matrice = estraiExcel(sheet);
            if(nomeBanca != null && nomeBanca.equals("IngDirect")) {
                data = elaborazioneExcelIngdirect(matrice, dataInizio, dataFine);
            }
            else if(nomeBanca != null && nomeBanca.equals("unicredit")) {

            }else {
                throw new RuntimeException();
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return data;

    }

    @Override
    public DataTabella elaborazioneImport(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            String[][]  matrice = estraiExcel(sheet);
            return convertiImport(matrice);

        } catch (Exception e) {
            throw new CatchAllException(e);
        }
    }

    public DataTabella elaborazioneExcelIngdirect( String[][] matrice, String dataInizio, String dataFine) {

        int righe = matrice.length;
        int indexDataValuta = 2;
        int indexCausale = 3;
        int indexDescrizione = 4;
        int indexValore = 5;
        DataTabella dataTabella = new DataTabella();

        String after = !dataInizio.isEmpty() ? convertIsoToCustomFormat(dataInizio) : null;
        String before = !dataFine.isEmpty() ? convertIsoToCustomFormat(dataFine) : null;

        for (int riga = 12; riga < righe; riga++) {
            String descrizione = matrice[riga][indexDescrizione];
            String valore =  matrice[riga][indexValore];
            String dataValuta = matrice[riga][indexDataValuta];
            String categoria = matrice[riga][indexCausale];
            if(isBeforeAndAfter(after,before,dataValuta) && descrizione != null && valore != null) {
                double parseDouble = Double.parseDouble(valore);
               if(parseDouble < 0){
                    dataTabella.getDataValuta().add(dataValuta);
                    dataTabella.getCategoria().add(categoria);
                    dataTabella.getDescrizione().add(descrizione);
                    dataTabella.getValore().add(parseDouble);
                }
            }
        }

        return sommaSpeseIngdirect(dataTabella);

    }

    public String convertIsoToCustomFormat(String isoDate) {
        LocalDate localDate = LocalDate.parse(isoDate);
        ZonedDateTime zonedDateTime = localDate.atStartOfDay(ZoneId.systemDefault());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);
        return zonedDateTime.format(formatter);
    }

    public static boolean isBeforeAndAfter(String inizio, String fine, String dataValuta) {
        String pattern = "EEE MMM dd HH:mm:ss zzz yyyy";
        SimpleDateFormat formatter = new SimpleDateFormat(pattern, Locale.ENGLISH);
        boolean isBefore;
        boolean isAfter;

        try {
            Date dateAfter = inizio != null ? formatter.parse(inizio) : null;
            Date dateBefore = fine != null ? formatter.parse(fine) : null;
            Date dataValutaDate = formatter.parse(dataValuta);

            isBefore = dateBefore != null && dataValutaDate.before(dateBefore);
            isAfter =  dateAfter != null && dataValutaDate.after(dateAfter);

            if(inizio != null && fine != null && isBefore && isAfter) return true;

            if(inizio == null && fine != null && isBefore) return true;

            if(inizio != null && fine == null && isAfter) return true;

            if(inizio == null && fine == null) return true;

        } catch (ParseException e) {
            return false;
        }
        return false;
    }


    public DataTabella sommaSpeseIngdirect(DataTabella data) {

        DataTabella dataPuliti = new DataTabella();
        dataPuliti.setValore(data.getValore());
        dataPuliti.setCategoria(data.getCategoria());

        for (String  descrizione : data.getDescrizione()) {
            String presso = descrizione;
            if (presso.toLowerCase().contains("presso")) {
                int index = presso.toLowerCase().indexOf("presso")+6;
                presso = presso.substring(index);
                dataPuliti.getDescrizione().add(presso);
            }else {
                dataPuliti.getDescrizione().add(presso);
            }
        }

        for (String  dataValuta : data.getDataValuta()) {
            try{
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss z yyyy", Locale.ENGLISH);
                ZonedDateTime zonedDateTime = ZonedDateTime.parse(dataValuta, formatter);
                DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                String formattedDate = zonedDateTime.format(outputFormatter);
                dataPuliti.getDataValuta().add(formattedDate);
            }catch (Exception e) {
                log.error(e.getMessage());
                throw new CatchAllException("Errore nel parsing della data", e);
            }

        }

        double tot = dataPuliti.getValore().stream().mapToDouble(Double::doubleValue).sum();
        dataPuliti.setTotale(tot);

        return dataPuliti;
    }

    public String[][] estraiExcel(Sheet sheet) {
        int lastRowNum = sheet.getLastRowNum();
        // Numero colonne preso dalla prima riga

        Row firstRow = null;
        Row row1 = null;
        int numCols = 0;
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
                int numColInRow1 = firstRow.getLastCellNum();
                if(numColInRow1 > numCols){
                    numCols = numColInRow1;
                }
            }
            if(contataore == 10){
                fineTabella = true;
            }
            i++;
        }

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

    public DataTabella convertiImport(String[][] matrice) {

        int righe = matrice.length;
        int idx = 0;
        int indexData = 1;
        int indexCategoria = 2;
        int indexDescrizione = 3;
        int indexValore = 4;
        DataTabella dataTabella = new DataTabella();


        for (int riga = 1; riga < righe; riga++) {
            String id = matrice[riga][idx];
            String descrizione = matrice[riga][indexDescrizione];
            String valore =  matrice[riga][indexValore];
            String dataValuta = matrice[riga][indexData];
            String categoria = matrice[riga][indexCategoria];
            if(valore != null) {
                double parseDouble = Double.parseDouble(valore);
                double parseId =  Double.parseDouble(id);
                dataTabella.getId().add(parseId);
                dataTabella.getDataValuta().add(dataValuta);
                dataTabella.getCategoria().add(categoria);
                dataTabella.getDescrizione().add(descrizione);
                dataTabella.getValore().add(parseDouble);
            }
        }

        return dataTabella;

    }

}
