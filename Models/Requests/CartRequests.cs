using System.ComponentModel.DataAnnotations;

public class AddToCartRequest
{
    [Required]
    public int ProductId { get; set; }
    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; }
}

public class UpdateCartItemRequest
{
    [Required]
    public int CartItemId { get; set; }
    [Required]
    [Range(0, 100)]
    public int Quantity { get; set; }
}

public class CartCommentRequest
{
    public string Comment { get; set; }
}

public class AddToWishlistRequest
{
    [Required]
    public int ProductId { get; set; }
} 