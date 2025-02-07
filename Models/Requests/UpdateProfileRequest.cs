namespace Gozon.Models.Requests
{
    using System.ComponentModel.DataAnnotations;

    public class UpdateProfileRequest
    {
        [Required]
        public string Name { get; set; }
        public string? NewPassword { get; set; }
    }
} 