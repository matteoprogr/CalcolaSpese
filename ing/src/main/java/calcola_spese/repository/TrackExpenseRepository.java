package calcola_spese.repository;

import calcola_spese.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrackExpenseRepository extends MongoRepository<Expense, String> {

    @Query("{ 'username': ?0, 'insertDate': { $gte: ?1, $lte: ?2 } }")
    List<Expense> findByUsernameAndInsertDateBetween(String username, Date startDate, Date endDate);

    Optional<Expense> findByIdExpense(String idExpense);
}
