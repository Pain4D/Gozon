using System.ComponentModel.DataAnnotations;

public class AddAddressRequest
{
    [Required]
    public string Address { get; set; }
    [Required]
    public string City { get; set; }
    [Required]
    public string PostalCode { get; set; }
} 