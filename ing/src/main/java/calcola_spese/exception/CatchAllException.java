package calcola_spese.exception;

public class CatchAllException extends RuntimeException{

    public CatchAllException(String message) {super(message);}

    public CatchAllException(String message, Throwable cause) {super(message, cause);}
}
