package cn.jekit.jekit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MetricTemplateRendererTest {

    @Test
    void rendersKnownFieldsAndEscapesUserText() {
        var html = MetricTemplateRenderer.render(
            "<阅读> {pagePv} {unknown}",
            "fallback",
            "post",
            "minimal"
        );

        assertThat(html)
            .contains("&lt;阅读&gt;")
            .contains("data-jekit-widget=\"post\"")
            .contains("data-jekit-field=\"pagePv\"")
            .contains("{unknown}")
            .doesNotContain("<阅读>");
    }

    @Test
    void usesFallbackForBlankTemplate() {
        var html = MetricTemplateRenderer.render(" ", "访问 {sitePv}", "footer", "inherit");

        assertThat(html)
            .contains("访问 ")
            .contains("data-jekit-field=\"sitePv\"")
            .contains("jekit-halo-stats--footer");
    }
}
