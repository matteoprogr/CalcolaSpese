package calcola_spese.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Data
@AllArgsConstructor
@Document(collection = "user")
public class User {

    @Id
    private String username;
    private String password;
    private String email;
    private String name;
    private String surname;
    private String birthday;
}
