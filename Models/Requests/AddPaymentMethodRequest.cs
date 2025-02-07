using System.ComponentModel.DataAnnotations;

public class AddPaymentMethodRequest
{
    [Required]
    public string Type { get; set; }
    
    [StringLength(5, MinimumLength = 5, ErrorMessage = "Номер карты должен состоять из 5 цифр")]
    [RegularExpression(@"^\d{5}$", ErrorMessage = "Номер карты должен содержать только цифры")]
    public string? CardNumber { get; set; }
} 