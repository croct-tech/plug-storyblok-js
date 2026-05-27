import type {App, Plugin} from 'vue';
import {StoryblokVue} from '@storyblok/vue';
import type {SbVueSDKOptions} from '@storyblok/vue';
import type {ApiDecorator} from '@/utils/decorator';
import {createOptionDecorator as createDefaultOptionDecorator} from '@/utils/decorator';

/**
 * @internal
 */
export function createOptionDecorator(decorator: ApiDecorator): (options: SbVueSDKOptions) => Plugin {
    const defaultDecorator = createDefaultOptionDecorator(decorator);

    return (options: SbVueSDKOptions): Plugin => ({
        install: function install(app: App) {
            StoryblokVue.install!(app, defaultDecorator(options));
        },
    });
}
