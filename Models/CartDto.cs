namespace Gozon.Models
{
    public class CartDto
    {
        public List<CartItemDto> Items { get; set; } = new();
        public decimal TotalPrice { get; set; }
    }

    public class CartItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
} 