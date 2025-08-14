package calcola_spese.exception;

import java.util.Date;

public class ExpensesNotFoundException extends RuntimeException {

    public ExpensesNotFoundException(String username, Date startDate, Date endDate) {
        super("No expenses found for user: " + username + " between " + startDate + " and " + endDate);
    }

    public ExpensesNotFoundException(String message) {
        super(message);
    }
}

