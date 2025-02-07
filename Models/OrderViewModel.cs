public class OrderViewModel
{
    public int Id { get; set; }
    public DateTime OrderDate { get; set; }
    public string Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string DeliveryAddress { get; set; }
    public string PaymentMethod { get; set; }
    public List<OrderItemViewModel> Items { get; set; }
}

public class OrderItemViewModel
{
    public string ProductName { get; set; }
    public string ProductImage { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
} 