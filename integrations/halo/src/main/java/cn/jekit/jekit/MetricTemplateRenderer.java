package cn.jekit.jekit;

import java.util.Set;
import java.util.regex.Pattern;

final class MetricTemplateRenderer {
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{([A-Za-z]+)}");
    private static final Set<String> FIELDS = Set.of(
        "sitePv", "siteUv", "pagePv", "pageUv",
        "sitePvToday", "siteUvToday", "pagePvToday", "pageUvToday"
    );

    private MetricTemplateRenderer() {
    }

    static String render(String template, String fallback, String kind, String preset) {
        var source = template == null || template.isBlank() ? fallback : template;
        var matcher = PLACEHOLDER.matcher(source);
        var output = new StringBuilder();
        var cursor = 0;
        while (matcher.find()) {
            output.append(escape(source.substring(cursor, matcher.start())));
            var field = matcher.group(1);
            if (FIELDS.contains(field)) {
                output.append("<span data-jekit-field=\"")
                    .append(field)
                    .append("\" aria-live=\"polite\">--</span>");
            } else {
                output.append(escape(matcher.group()));
            }
            cursor = matcher.end();
        }
        output.append(escape(source.substring(cursor)));
        return "<span data-jekit-widget=\"" + escape(kind)
            + "\" class=\"jekit-halo-stats jekit-halo-stats--"
            + escape(kind) + " jekit-halo-stats--" + escape(preset)
            + "\">" + output + "</span>";
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
