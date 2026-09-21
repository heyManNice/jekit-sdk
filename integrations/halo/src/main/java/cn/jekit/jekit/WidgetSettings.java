package cn.jekit.jekit;

public record WidgetSettings(Boolean enabled, String position, String template, String preset) {
    public boolean isEnabled() {
        return Boolean.TRUE.equals(enabled);
    }

    public String positionOrDefault() {
        return "after".equals(position) ? "after" : "before";
    }

    public String presetOrDefault() {
        return switch (preset == null ? "" : preset) {
            case "minimal", "badge" -> preset;
            default -> "inherit";
        };
    }
}
