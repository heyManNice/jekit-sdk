package cn.jekit.jekit;

import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IProcessableElementTag;
import org.thymeleaf.processor.element.IElementTagStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.dialect.TemplateFooterProcessor;

@Component
public class JekitFooterProcessor implements TemplateFooterProcessor {
    private static final String GROUP = "footer";
    private static final String DEFAULT_TEMPLATE =
        "总浏览 {sitePv} 次 · 总访客 {siteUv} 人 · 今日浏览 {sitePvToday} 次 · 今日访客 {siteUvToday} 人";
    private final ReactiveSettingFetcher settingFetcher;

    public JekitFooterProcessor(ReactiveSettingFetcher settingFetcher) {
        this.settingFetcher = settingFetcher;
    }

    @Override
    public Mono<Void> process(ITemplateContext context, IProcessableElementTag tag,
        IElementTagStructureHandler structureHandler, IModel model) {
        return settingFetcher.fetch(GROUP, WidgetSettings.class)
            .doOnNext(settings -> {
                if (!settings.isEnabled()) {
                    return;
                }
                var html = MetricTemplateRenderer.render(
                    settings.template(), DEFAULT_TEMPLATE, "footer", settings.presetOrDefault());
                model.addModel(context.getModelFactory().parse(context.getTemplateData(), html));
            })
            .then();
    }
}
