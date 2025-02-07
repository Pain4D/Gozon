using System;

namespace Gozon.Models
{
    public class WishlistItem
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public DateTime AddedDate { get; set; }
        public User User { get; set; }
        public Product Product { get; set; }
    }
} 