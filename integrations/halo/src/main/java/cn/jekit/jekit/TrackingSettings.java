package cn.jekit.jekit;

public record TrackingSettings(Boolean enabled) {
    public static final String GROUP = "tracking";

    public boolean isEnabled() {
        return enabled == null || enabled;
    }
}
