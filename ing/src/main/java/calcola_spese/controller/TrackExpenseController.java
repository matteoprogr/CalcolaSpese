package calcola_spese.controller;

import calcola_spese.constants.Constants;
import calcola_spese.dto.ErrorResponseDto;
import calcola_spese.dto.ResponseDto;
import calcola_spese.dto.UserExpenseDto;
import calcola_spese.exception.CatchAllException;
import calcola_spese.service.ITrackExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/expense")
public class TrackExpenseController {


    private final ITrackExpenseService trackExpenseService;

    public TrackExpenseController(ITrackExpenseService trackExpenseService) {
        this.trackExpenseService = trackExpenseService;
    }

    @Operation(summary = "Save Expense Detaiis REST API", description = "REST API to save expense details")
    @ApiResponse(responseCode = "200", description = "HTTP Status OK")
    @ApiResponse(responseCode = "500", description = "HTTP Status internal Server Error", content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    @PostMapping("/saveExpense")
    public ResponseEntity<ResponseDto> addExpense(@Valid @RequestBody UserExpenseDto userExpenseDto){

        try {
            trackExpenseService.saveExpense(userExpenseDto);
        }catch (CatchAllException e){
            throw new CatchAllException(e.getMessage(),e);
        }
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new ResponseDto(Constants.SUCCESS, "Expense added successfully"));
    }

    @Operation(summary = "Delete Expense Detaiis REST API", description = "REST API to delete expense details")
    @ApiResponse(responseCode = "200", description = "HTTP Status OK")
    @ApiResponse(responseCode = "500", description = "HTTP Status internal Server Error", content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    @PostMapping("/deleteExpense")
    public ResponseEntity<ResponseDto> deleteExpense(@Valid @RequestParam String idExpense){

        try {
            trackExpenseService.deleteExpense(idExpense);
        }catch (CatchAllException e){
            throw new CatchAllException(e.getMessage(),e);
        }
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new ResponseDto(Constants.SUCCESS, "Expense deleted successfully"));

    }

    @Operation(summary = "Update Expense Detaiis REST API", description = "REST API to update expense details")
    @ApiResponse(responseCode = "200", description = "HTTP Status OK")
    @ApiResponse(responseCode = "500", description = "HTTP Status internal Server Error", content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    @PostMapping("/updateExpense")
    public ResponseEntity<ResponseDto> updateExpense(@Valid @RequestBody UserExpenseDto userExpenseDto){

        try {
            trackExpenseService.updateExpense(userExpenseDto);
        }catch (CatchAllException e){
            throw new CatchAllException(e.getMessage(),e);
        }
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new ResponseDto(Constants.SUCCESS, "Expense updated successfully"));

    }

    @Operation(summary = "Get Expenses Detaiis REST API", description = "REST API to get expense details")
    @ApiResponse(responseCode = "200", description = "HTTP Status OK")
    @ApiResponse(responseCode = "500", description = "HTTP Status internal Server Error", content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    @PostMapping("/getExpenses")
    public ResponseEntity<UserExpenseDto> getExpenses(@Valid @RequestBody UserExpenseDto userExpenseDto){

        try {
            UserExpenseDto totUserExpense = trackExpenseService.getExpenses(userExpenseDto.getUsername(),userExpenseDto.getStartDate(),userExpenseDto.getEndDate());
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(totUserExpense);
        }catch (CatchAllException e){
            throw new CatchAllException(e.getMessage(),e);
        }

    }
}
