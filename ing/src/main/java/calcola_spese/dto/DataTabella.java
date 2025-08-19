package calcola_spese.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DataTabella {

    private List<Double> id = new ArrayList<>();
    private List<String> dataValuta = new ArrayList<>();
    private List<String> categoria = new ArrayList<>();
    private List<String> descrizione = new ArrayList<>();
    private List<Double> valore = new ArrayList<>();
    private Double totale;
}
