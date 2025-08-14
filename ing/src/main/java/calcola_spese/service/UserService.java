package calcola_spese.service;


import calcola_spese.dto.UserDto;
import calcola_spese.model.User;

public interface UserService {
    User saveUser(UserDto userDto);
    User login(String username, String password);
}
