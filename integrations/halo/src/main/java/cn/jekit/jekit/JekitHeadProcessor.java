package cn.jekit.jekit;

import java.util.Map;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.AttributeValueQuotes;
import org.thymeleaf.model.IModel;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.dialect.TemplateHeadProcessor;

@Component
public class JekitHeadProcessor implements TemplateHeadProcessor {
    private static final String ASSET_ROOT = "/plugins/jekit-halo/assets/static/greeter/";
    private final ReactiveSettingFetcher settingFetcher;

    public JekitHeadProcessor(ReactiveSettingFetcher settingFetcher) {
        this.settingFetcher = settingFetcher;
    }

    @Override
    public Mono<Void> process(ITemplateContext context, IModel model,
        IElementModelStructureHandler structureHandler) {
        return settingFetcher.fetch(TrackingSettings.GROUP, TrackingSettings.class)
            .defaultIfEmpty(new TrackingSettings(true))
            .doOnNext(settings -> {
                if (!settings.isEnabled()) {
                    return;
                }
                var factory = context.getModelFactory();
                model.add(factory.createStandaloneElementTag(
                    "link",
                    Map.of("rel", "stylesheet", "href", ASSET_ROOT + "jekit-halo.css"),
                    AttributeValueQuotes.DOUBLE,
                    false,
                    true
                ));
                model.add(factory.createOpenElementTag(
                    "script",
                    Map.of("defer", "defer", "src", ASSET_ROOT + "jekit-halo.min.js"),
                    AttributeValueQuotes.DOUBLE,
                    false
                ));
                model.add(factory.createCloseElementTag("script"));
            })
            .then();
    }
}
