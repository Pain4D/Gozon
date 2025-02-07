namespace Gozon.Models
{
    using System.ComponentModel.DataAnnotations;
    using System.Text.Json.Serialization;

    public class User
    {
        public int Id { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string Name { get; set; }
        public string? AvatarUrl { get; set; }

        [JsonIgnore]
        public List<Order>? Orders { get; set; }
        [JsonIgnore]
        public List<DeliveryAddress>? DeliveryAddresses { get; set; }
        [JsonIgnore]
        public List<PaymentMethod>? PaymentMethods { get; set; }
    }

    public class DeliveryAddress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        [JsonIgnore]
        public User User { get; set; }
    }

    public class PaymentMethod
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; }
        public string CardNumber { get; set; }
        public User User { get; set; }

    }
} 