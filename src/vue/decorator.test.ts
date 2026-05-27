import type {App} from 'vue';
import {StoryblokVue} from '@storyblok/vue';
import type {ApiDecorator} from '@/utils/decorator';
import {createOptionDecorator as createDefaultOptionDecorator} from '@/utils/decorator';
import {createOptionDecorator} from '@/vue/decorator';

jest.mock(
    '@/utils/decorator',
    () => ({
        createOptionDecorator: jest.fn(),
    }),
);

jest.mock(
    '@storyblok/vue',
    () => ({
        StoryblokVue: {
            install: jest.fn(),
        },
    }),
);

describe('createOptionDecorator', () => {
    beforeEach(() => {
        jest.mocked(createDefaultOptionDecorator).mockReturnValue(options => options);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call the default decorator factory with the provided decorator', () => {
        const decorator: ApiDecorator = {
            fetchContent: jest.fn(),
        };

        createOptionDecorator(decorator);

        expect(createDefaultOptionDecorator).toHaveBeenCalledWith(decorator);
    });

    it('should return a plugin with an install method', () => {
        const decorator: ApiDecorator = {
            fetchContent: jest.fn(),
        };

        const plugin = createOptionDecorator(decorator)({accessToken: 'token'});

        expect(plugin).toHaveProperty('install');
        expect(typeof plugin.install).toBe('function');
    });

    it('should call StoryblokVue.install with the app and decorated options', () => {
        const decorator: ApiDecorator = {
            fetchContent: jest.fn(),
        };

        const options = {accessToken: 'token'};
        const plugin = createOptionDecorator(decorator)(options);

        const mockApp = createMockApp();

        plugin.install!(mockApp);

        expect(StoryblokVue.install).toHaveBeenCalledWith(mockApp, options);
    });
});

function createMockApp(): App {
    return {
        component: jest.fn().mockReturnThis(),
        config: {} as any,
        directive: jest.fn().mockReturnThis(),
        mixin: jest.fn().mockReturnThis(),
        mount: jest.fn(),
        onUnmount: jest.fn(),
        provide: jest.fn().mockReturnThis(),
        runWithContext: jest.fn(),
        unmount: jest.fn(),
        use: jest.fn().mockReturnThis(),
        version: '3.0.0',
    } as unknown as App;
}
