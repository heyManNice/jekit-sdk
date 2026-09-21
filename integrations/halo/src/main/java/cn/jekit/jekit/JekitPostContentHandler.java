package cn.jekit.jekit;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.ReactivePostContentHandler;

@Component
public class JekitPostContentHandler implements ReactivePostContentHandler {
    private static final String GROUP = "postViews";
    private static final String DEFAULT_TEMPLATE = "阅读 {pagePv} 次";
    private final ReactiveSettingFetcher settingFetcher;

    public JekitPostContentHandler(ReactiveSettingFetcher settingFetcher) {
        this.settingFetcher = settingFetcher;
    }

    @Override
    public Mono<PostContentContext> handle(PostContentContext context) {
        return settingFetcher.fetch(GROUP, WidgetSettings.class)
            .defaultIfEmpty(new WidgetSettings(false, "before", DEFAULT_TEMPLATE, "minimal"))
            .map(settings -> {
                if (!settings.isEnabled()) {
                    return context;
                }
                var content = context.getContent() == null ? "" : context.getContent();
                if (content.contains("data-jekit-widget=\"post\"")) {
                    return context;
                }
                var widget = MetricTemplateRenderer.render(
                    settings.template(), DEFAULT_TEMPLATE, "post", settings.presetOrDefault());
                context.setContent("after".equals(settings.positionOrDefault())
                    ? content + widget
                    : widget + content);
                return context;
            });
    }
}
