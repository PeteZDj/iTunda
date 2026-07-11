using Microsoft.Maui.Graphics;
using Microsoft.Maui.Graphics.Platform;
using GImage = Microsoft.Maui.Graphics.IImage;

namespace iTunda.App.Services;

// Reads an image stream, downscales it and returns a JPEG data-URI — the same
// format the web app uploads, so images render everywhere without a file host.
public static class ImageUtil
{
    public static async Task<string> ToDataUriAsync(Stream stream, int maxDimension = 1100)
    {
        try
        {
            GImage image = PlatformImage.FromStream(stream);
            using GImage resized = image.Downsize(maxDimension, disposeOriginal: true);
            using var ms = new MemoryStream();
            resized.Save(ms, ImageFormat.Jpeg, 0.8f);
            return "data:image/jpeg;base64," + Convert.ToBase64String(ms.ToArray());
        }
        catch
        {
            using var ms = new MemoryStream();
            if (stream.CanSeek) stream.Position = 0;
            await stream.CopyToAsync(ms);
            return "data:image/jpeg;base64," + Convert.ToBase64String(ms.ToArray());
        }
    }
}
