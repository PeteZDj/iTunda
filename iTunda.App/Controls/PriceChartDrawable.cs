using Microsoft.Maui.Graphics;
using iTunda.App.Models;

namespace iTunda.App.Controls;

// Lightweight area+line price chart drawn with Microsoft.Maui.Graphics —
// no third-party charting dependency.
public class PriceChartDrawable : IDrawable
{
    public List<PricePoint> Points { get; set; } = new();
    public bool Up { get; set; } = true;

    public void Draw(ICanvas canvas, RectF rect)
    {
        if (Points is null || Points.Count < 2)
        {
            canvas.FontColor = Color.FromArgb("#8AA096");
            canvas.FontSize = 14;
            canvas.DrawString("No price history", rect, HorizontalAlignment.Center, VerticalAlignment.Center);
            return;
        }

        float padL = 10, padR = 10, padT = 14, padB = 22;
        float iw = rect.Width - padL - padR;
        float ih = rect.Height - padT - padB;

        var prices = Points.Select(p => (float)p.Price).ToList();
        float min = prices.Min(), max = prices.Max();
        float span = Math.Max(1f, max - min);
        float lo = min - span * 0.12f;
        float hi = max + span * 0.12f;
        float vspan = Math.Max(1f, hi - lo);

        float X(int i) => padL + (i / (float)(Points.Count - 1)) * iw;
        float Y(float v) => padT + ih - ((v - lo) / vspan) * ih;

        var lineColor = Up ? Color.FromArgb("#16A34A") : Color.FromArgb("#C0392B");
        var fillColor = Up ? Color.FromArgb("#2916A34A") : Color.FromArgb("#24C0392B"); // ARGB (alpha first)

        // Gridlines
        canvas.StrokeColor = Color.FromArgb("#EAF2EC");
        canvas.StrokeSize = 1;
        for (int g = 0; g <= 2; g++)
        {
            float yy = padT + g * (ih / 2f);
            canvas.DrawLine(padL, yy, rect.Width - padR, yy);
        }

        // Area fill
        var area = new PathF();
        area.MoveTo(X(0), padT + ih);
        for (int i = 0; i < Points.Count; i++) area.LineTo(X(i), Y(prices[i]));
        area.LineTo(X(Points.Count - 1), padT + ih);
        area.Close();
        canvas.FillColor = fillColor;
        canvas.FillPath(area);

        // Line
        var line = new PathF();
        line.MoveTo(X(0), Y(prices[0]));
        for (int i = 1; i < Points.Count; i++) line.LineTo(X(i), Y(prices[i]));
        canvas.StrokeColor = lineColor;
        canvas.StrokeSize = 2.6f;
        canvas.StrokeLineJoin = LineJoin.Round;
        canvas.StrokeLineCap = LineCap.Round;
        canvas.DrawPath(line);

        // Last-point dot
        float lx = X(Points.Count - 1), ly = Y(prices[^1]);
        canvas.FillColor = lineColor;
        canvas.FillCircle(lx, ly, 4.5f);
        canvas.FillColor = Colors.White;
        canvas.FillCircle(lx, ly, 2f);
    }
}
