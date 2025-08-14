package calcola_spese.service.impl;

import calcola_spese.constants.Constants;
import calcola_spese.dto.UserExpenseDto;
import calcola_spese.exception.CatchAllException;
import calcola_spese.exception.ExpensesNotFoundException;
import calcola_spese.model.Expense;
import calcola_spese.repository.TrackExpenseRepository;
import calcola_spese.service.ITrackExpenseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class TrackExpenseServiceImpl implements ITrackExpenseService {

    private final TrackExpenseRepository trackExpenseRepository;


    public TrackExpenseServiceImpl(TrackExpenseRepository trackExpenseRepository) {
        this.trackExpenseRepository = trackExpenseRepository;
    }

    @Override
    public void saveExpense(UserExpenseDto expense) {
        if (expense != null) {
            Expense newExpense = new Expense();
            newExpense.setIdExpense(UUID.randomUUID().toString());
            newExpense.setUsername(expense.getUsername());
            newExpense.setDescription(expense.getDescription());
            newExpense.setAmount(expense.getAmount());
            newExpense.setCategory(expense.getCategory());
            newExpense.setExpenseDate(expense.getExpenseDate());
            newExpense.setInsertDate(new Date());
            newExpense.setRecurrence(expense.getRecurrence());
            newExpense.setStartDate(expense.getStartDate());
            newExpense.setEndDate(expense.getEndDate());
            trackExpenseRepository.save(newExpense);
        } else {
            throw new IllegalArgumentException(Constants.EXPENSE_CANT_BE_NULL);
        }
    }

    @Override
    public void deleteExpense(String idExpense) {
        if (idExpense != null) {
            Expense newExpense = trackExpenseRepository.findByIdExpense(idExpense).orElseThrow();

            trackExpenseRepository.delete(newExpense);
        } else {
            throw new IllegalArgumentException(Constants.EXPENSE_CANT_BE_NULL);
        }
    }

    @Override
    public void updateExpense(UserExpenseDto expense) {
        if (expense != null) {
            Expense newExpense = trackExpenseRepository.findByIdExpense(expense.getIdExpense()).orElseThrow();

            newExpense.setUsername(expense.getUsername());
            newExpense.setDescription(expense.getDescription());
            newExpense.setAmount(expense.getAmount());
            newExpense.setCategory(expense.getCategory());
            newExpense.setExpenseDate(expense.getExpenseDate());
            trackExpenseRepository.save(newExpense);
        } else {
            throw new IllegalArgumentException(Constants.EXPENSE_CANT_BE_NULL);
        }
    }

    @Override
    public UserExpenseDto getExpenses(String username, Date startDate, Date endDate) {

        try{
            List<Expense> expenses = trackExpenseRepository.findByUsernameAndInsertDateBetween(username, startDate, endDate);
            if(expenses.isEmpty()){
                log.error("Expenses not found for user: " + username + " between " + startDate + " and " + endDate);
                ExpensesNotFoundException expensesNotFoundException = new ExpensesNotFoundException(username, startDate, endDate);
                throw new CatchAllException(expensesNotFoundException.getMessage(), expensesNotFoundException);
            }
            UserExpenseDto userExpenseDto = new UserExpenseDto();
            userExpenseDto.setUsername(username);
            userExpenseDto.setExpenses(expenses);
            userExpenseDto.setTotalExpense(expenses.stream().mapToDouble(Expense::getAmount).sum());
            userExpenseDto.setStartDate(startDate);
            userExpenseDto.setEndDate(endDate);
            return userExpenseDto;
        } catch (Exception e) {
            throw new IllegalArgumentException(Constants.USER_NOT_FOUND);
        }
    }

}
