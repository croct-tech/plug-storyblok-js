import type {SbPluginFactory, StoryblokClient, SbSDKOptions, ISbStoriesParams} from '@storyblok/js';
import type {ApiDecorator} from '@/utils/decorator';
import {createOptionDecorator, decoratePlugin} from '@/utils/decorator';
import {resolveContent} from '@/utils/content';
import mocked = jest.mocked;

jest.mock(
    '@/utils/content',
    () => ({
        resolveContent: jest.fn(),
    }),
);

describe('createOptionDecorator', () => {
    const decorator: ApiDecorator = {
        fetchContent: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return options unchanged when the use option is undefined', () => {
        const options: SbSDKOptions = {
            accessToken: 'token',
        };

        const result = createOptionDecorator(decorator)(options);

        expect(result).toEqual(options);
        expect(result).not.toBe(options);
    });

    it('should decorate plugins when the use option is defined', () => {
        const mockPluginResult = {};
        const mockPlugin: SbPluginFactory = jest.fn().mockReturnValue(mockPluginResult);

        const options: SbSDKOptions = {
            accessToken: 'token',
            use: [mockPlugin],
        };

        const result = createOptionDecorator(decorator)(options);

        expect(result.use).toHaveLength(1);
        expect(result.use).not.toBe(options.use);

        const decoratedPlugin = result.use![0];
        const pluginOptions = {accessToken: 'test'};

        decoratedPlugin(pluginOptions);

        expect(mockPlugin).toHaveBeenCalledWith(pluginOptions);
    });
});

describe('decoratePlugin', () => {
    beforeEach(() => {
        mocked(resolveContent).mockImplementation(content => Promise.resolve(content));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    type Mocks = {
        originalGet: jest.Mock,
        originalGetAll: jest.Mock,
        originalGetStory: jest.Mock,
        originalGetStories: jest.Mock,
        storyblokApi: Partial<StoryblokClient>,
        plugin: SbPluginFactory,
    };

    function createMocks(): Mocks {
        const originalGet = jest.fn();
        const originalGetAll = jest.fn();
        const originalGetStory = jest.fn();
        const originalGetStories = jest.fn();

        const storyblokApi = {
            get: originalGet,
            getAll: originalGetAll,
            getStory: originalGetStory,
            getStories: originalGetStories,
        };

        const mockPlugin: SbPluginFactory = jest.fn().mockReturnValue({storyblokApi: storyblokApi});

        return {
            originalGet: originalGet,
            originalGetAll: originalGetAll,
            originalGetStory: originalGetStory,
            originalGetStories: originalGetStories,
            storyblokApi: storyblokApi,
            plugin: mockPlugin,
        };
    }

    it('should return plugin result unchanged when the storyblokApi property is undefined', () => {
        const pluginResult = {someOtherProperty: 'value'};
        const plugin: SbPluginFactory = jest.fn().mockReturnValue(pluginResult);

        const decorator: ApiDecorator = {
            fetchContent: jest.fn(),
        };
        const decorated = decoratePlugin(plugin, decorator);
        const result = decorated({accessToken: 'token'});

        expect(result).toBe(pluginResult);
    });

    describe('get method', () => {
        it('should call beforeRequest and resolve content for cdn/stories/ path', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {story: {content: {}}};

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGet.mockImplementation(() => {
                callOrder.push('get');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.get('cdn/stories/home', params);

            expect(callOrder).toEqual(['beforeRequest', 'get']);
            expect(originalGet).toHaveBeenCalledWith('cdn/stories/home', params);
            expect(resolveContent).toHaveBeenCalledWith(responseData, expect.any(Function));
            expect(result).toEqual(responseData);
        });

        it('should call beforeRequest and not resolve content for non cdn/stories/ path', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {links: []};

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGet.mockImplementation(() => {
                callOrder.push('get');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.get('cdn/links/', params);

            expect(callOrder).toEqual(['beforeRequest', 'get']);
            expect(originalGet).toHaveBeenCalledWith('cdn/links/', params);
            expect(resolveContent).not.toHaveBeenCalled();
            expect(result).toEqual(responseData);
        });

        it('should use resolveParams when provided for cdn/stories/ path', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {story: {}};

            originalGet.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.get('cdn/stories/home', originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGet).toHaveBeenCalledWith('cdn/stories/home', resolvedParams);
        });

        it('should use resolveParams when provided for non cdn/stories/ path', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {links: []};

            originalGet.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.get('cdn/links/', originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGet).toHaveBeenCalledWith('cdn/links/', resolvedParams);
        });

        it('should call fetchContent with original params', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {story: {content: {croct: 'slot-id'}}};

            originalGet.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.get('cdn/stories/home', params);

            const fetcherFn = mocked(resolveContent).mock.calls[0][1];

            await fetcherFn('slot-id');

            expect(decorator.fetchContent).toHaveBeenCalledWith('slot-id', params);
        });

        it('should pass additional arguments to get method', async () => {
            const {originalGet, plugin} = createMocks();
            const responseData = {links: []};

            originalGet.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            // @ts-expect-error - extra arguments for testing
            await decoratedApi.get('cdn/links/', params, 'extraArg1', 'extraArg2');

            expect(originalGet).toHaveBeenCalledWith('cdn/links/', params, 'extraArg1', 'extraArg2');
        });
    });

    describe('getAll method', () => {
        it('should call beforeRequest and resolve content for cdn/stories/ path', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{story: {content: {}}}];

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGetAll.mockImplementation(() => {
                callOrder.push('getAll');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.getAll('cdn/stories/', params);

            expect(callOrder).toEqual(['beforeRequest', 'getAll']);
            expect(originalGetAll).toHaveBeenCalledWith('cdn/stories/', params);
            expect(resolveContent).toHaveBeenCalledWith(responseData, expect.any(Function));
            expect(result).toEqual(responseData);
        });

        it('should call beforeRequest and not resolve content for non cdn/stories/ path', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{link: {}}];

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGetAll.mockImplementation(() => {
                callOrder.push('getAll');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.getAll('cdn/links/', params);

            expect(callOrder).toEqual(['beforeRequest', 'getAll']);
            expect(originalGetAll).toHaveBeenCalledWith('cdn/links/', params);
            expect(resolveContent).not.toHaveBeenCalled();
            expect(result).toEqual(responseData);
        });

        it('should use resolveParams when provided for cdn/stories/ path', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{story: {}}];

            originalGetAll.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getAll('cdn/stories/', originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGetAll).toHaveBeenCalledWith('cdn/stories/', resolvedParams);
        });

        it('should use resolveParams when provided for non cdn/stories/ path', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{link: {}}];

            originalGetAll.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getAll('cdn/links/', originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGetAll).toHaveBeenCalledWith('cdn/links/', resolvedParams);
        });

        it('should call fetchContent with original params', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{story: {content: {croct: 'slot-id'}}}];

            originalGetAll.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getAll('cdn/stories/', params);

            const fetcherFn = mocked(resolveContent).mock.calls[0][1];

            await fetcherFn('slot-id');

            expect(decorator.fetchContent).toHaveBeenCalledWith('slot-id', params);
        });

        it('should pass additional arguments to getAll method', async () => {
            const {originalGetAll, plugin} = createMocks();
            const responseData = [{link: {}}];

            originalGetAll.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getAll('cdn/links/', params, 'extraArg');

            expect(originalGetAll).toHaveBeenCalledWith('cdn/links/', params, 'extraArg');
        });
    });

    describe('getStory method', () => {
        it('should call beforeRequest and resolve content', async () => {
            const {originalGetStory, plugin} = createMocks();
            const responseData = {story: {content: {}}};

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGetStory.mockImplementation(() => {
                callOrder.push('getStory');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.getStory('home', params);

            expect(callOrder).toEqual(['beforeRequest', 'getStory']);
            expect(originalGetStory).toHaveBeenCalledWith('home', params);
            expect(resolveContent).toHaveBeenCalledWith(responseData, expect.any(Function));
            expect(result).toEqual(responseData);
        });

        it('should use resolveParams when provided', async () => {
            const {originalGetStory, plugin} = createMocks();
            const responseData = {story: {}};

            originalGetStory.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getStory('home', originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGetStory).toHaveBeenCalledWith('home', resolvedParams);
        });

        it('should call fetchContent with original params', async () => {
            const {originalGetStory, plugin} = createMocks();
            const responseData = {story: {content: {croct: 'slot-id'}}};

            originalGetStory.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getStory('home', params);

            const fetcherFn = mocked(resolveContent).mock.calls[0][1];

            await fetcherFn('slot-id');

            expect(decorator.fetchContent).toHaveBeenCalledWith('slot-id', params);
        });

        it('should pass additional arguments to getStory method', async () => {
            const {originalGetStory, plugin} = createMocks();
            const responseData = {story: {}};

            originalGetStory.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            // @ts-expect-error - extra arguments for testing
            await decoratedApi.getStory('home', params, 'extra');

            expect(originalGetStory).toHaveBeenCalledWith('home', params, 'extra');
        });
    });

    describe('getStories method', () => {
        it('should call beforeRequest and resolve content', async () => {
            const {originalGetStories, plugin} = createMocks();
            const responseData = {stories: [{content: {}}]};

            const callOrder: string[] = [];
            const beforeRequest = jest.fn(() => { callOrder.push('beforeRequest'); });

            originalGetStories.mockImplementation(() => {
                callOrder.push('getStories');

                return Promise.resolve(responseData);
            });

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
                beforeRequest: beforeRequest,
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};
            const result = await decoratedApi.getStories(params);

            expect(callOrder).toEqual(['beforeRequest', 'getStories']);
            expect(originalGetStories).toHaveBeenCalledWith(params);
            expect(resolveContent).toHaveBeenCalledWith(responseData, expect.any(Function));
            expect(result).toEqual(responseData);
        });

        it('should use resolveParams when provided', async () => {
            const {originalGetStories, plugin} = createMocks();
            const responseData = {stories: []};

            originalGetStories.mockResolvedValue(responseData);

            const resolvedParams: ISbStoriesParams = {version: 'published'};
            const decoratorWithResolve: ApiDecorator = {
                fetchContent: jest.fn(),
                resolveParams: jest.fn().mockReturnValue(resolvedParams),
            };

            const decorated = decoratePlugin(plugin, decoratorWithResolve);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const originalParams: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getStories(originalParams);

            expect(decoratorWithResolve.resolveParams).toHaveBeenCalledWith(originalParams);
            expect(originalGetStories).toHaveBeenCalledWith(resolvedParams);
        });

        it('should call fetchContent with original params', async () => {
            const {originalGetStories, plugin} = createMocks();
            const responseData = {stories: [{content: {croct: 'slot-id'}}]};

            originalGetStories.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            await decoratedApi.getStories(params);

            const fetcherFn = mocked(resolveContent).mock.calls[0][1];

            await fetcherFn('slot-id');

            expect(decorator.fetchContent).toHaveBeenCalledWith('slot-id', params);
        });

        it('should pass additional arguments to getStories method', async () => {
            const {originalGetStories, plugin} = createMocks();
            const responseData = {stories: []};

            originalGetStories.mockResolvedValue(responseData);

            const decorator: ApiDecorator = {
                fetchContent: jest.fn(),
            };
            const decorated = decoratePlugin(plugin, decorator);
            const pluginResult = decorated({accessToken: 'token'});
            const decoratedApi = (pluginResult as {storyblokApi: StoryblokClient}).storyblokApi;

            const params: ISbStoriesParams = {version: 'draft'};

            // @ts-expect-error - extra arguments for testing
            await decoratedApi.getStories(params, 'extra');

            expect(originalGetStories).toHaveBeenCalledWith(params, 'extra');
        });
    });
});
