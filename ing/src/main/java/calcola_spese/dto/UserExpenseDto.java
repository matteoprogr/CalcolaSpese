package calcola_spese.dto;

import calcola_spese.model.Expense;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;


@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserExpenseDto {

    private String username;
    private String idExpense;
    private List<Expense> expenses;
    private double totalExpense;

    // Fields for a new expense
    private String description;
    private double amount;
    private String category;
    private Date expenseDate;
    private Date startDate;
    private Date endDate;
    private String recurrence;
}
