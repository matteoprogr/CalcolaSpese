package calcola_spese.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "expenses")
public class Expense {

    @Id
    private ObjectId _id;
    @Indexed(unique = true)
    private String idExpense;
    private String username;
    private String description;
    private double amount;
    private String category;
    private Date insertDate;
    private Date expenseDate;
    private Date startDate;
    private Date endDate;
    private String recurrence;
}
