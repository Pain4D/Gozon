using System.Collections.Generic;

namespace Gozon.Models
{
    public class Cart
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public List<CartItem> Items { get; set; } = new();
        public string? Comment { get; set; }
        public decimal TotalPrice { get; set; }
        public string? DeliveryMethod { get; set; }
        public string? PaymentMethod { get; set; }
        public User User { get; set; }
    }
}