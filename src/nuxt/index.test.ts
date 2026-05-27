import type {ApiDecorator} from '@/utils/decorator';

jest.mock(
    '@/utils/decorator',
    () => ({
        decorateApi: jest.fn(),
    }),
);

jest.mock(
    '@/utils/preview',
    () => ({
        isPreviewUrl: jest.fn(),
    }),
);

jest.mock(
    '@/utils/ssr',
    () => ({
        isSsr: jest.fn(),
    }),
);

describe('withCroct', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, '$fetch');
    });

    const mocks = {
        get decorateApi(): jest.Mock {
            return jest.requireMock('@/utils/decorator').decorateApi;
        },
        get isPreviewUrl(): jest.Mock {
            return jest.requireMock('@/utils/preview').isPreviewUrl;
        },
        get isSsr(): jest.Mock {
            return jest.requireMock('@/utils/ssr').isSsr;
        },
    };

    function setGlobalFetch(mock: jest.Mock): void {
        Object.defineProperty(
            globalThis,
            '$fetch',
            {
                value: mock,
                writable: true,
                configurable: true,
            },
        );
    }

    const api = {};

    function installPlugin(ssrContext?: {url?: string}): void {
        const {withCroct} = jest.requireActual('@/nuxt/index');

        withCroct(
            ssrContext !== undefined ? {ssrContext: ssrContext} : {},
            api,
        );
    }

    function getDecorator(): ApiDecorator {
        return mocks.decorateApi.mock.calls[0][1];
    }

    it('should decorate the provided API', () => {
        installPlugin();

        expect(mocks.decorateApi).toHaveBeenCalledWith(api, expect.any(Object));
    });

    it('should fetch content via the server endpoint', async () => {
        const fetchedContent = {
            content: {title: 'Personalized'},
            metadata: {contentSource: 'experience'},
        };

        const mockFetch = jest.fn().mockResolvedValue(fetchedContent);

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(true);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        const result = await getDecorator().fetchContent('slot-id');

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/_croct/content',
            {
                method: 'POST',
                body: {
                    slotId: 'slot-id',
                    includeSchema: true,
                },
            },
        );

        expect(result).toBe(fetchedContent);
    });

    it('should fetch content via the server endpoint on the client side', async () => {
        const fetchedContent = {
            content: {title: 'Personalized'},
            metadata: {contentSource: 'experience'},
        };

        const mockFetch = jest.fn().mockResolvedValue(fetchedContent);

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(false);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        const result = await getDecorator().fetchContent('slot-id');

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/_croct/content',
            {
                method: 'POST',
                body: {
                    slotId: 'slot-id',
                    includeSchema: true,
                },
            },
        );

        expect(result).toBe(fetchedContent);
    });

    it('should forward language as preferredLocale', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            content: {},
            metadata: {contentSource: 'experience'},
        });

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(false);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        await getDecorator().fetchContent('slot-id', {language: 'de'});

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/_croct/content',
            {
                method: 'POST',
                body: {
                    slotId: 'slot-id',
                    includeSchema: true,
                    preferredLocale: 'de',
                },
            },
        );
    });

    it('should not include preferredLocale when language is not provided', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            content: {},
            metadata: {contentSource: 'experience'},
        });

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(false);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        await getDecorator().fetchContent('slot-id');

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/_croct/content',
            {
                method: 'POST',
                body: {
                    slotId: 'slot-id',
                    includeSchema: true,
                },
            },
        );
    });

    it('should return undefined when content source is a slot', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            content: {title: 'Test'},
            metadata: {contentSource: 'slot'},
        });

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(false);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        const result = await getDecorator().fetchContent('slot-id');

        expect(result).toBeUndefined();
    });

    it('should skip fetching when the request URL is a preview URL during SSR', async () => {
        const mockFetch = jest.fn();

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(true);
        mocks.isPreviewUrl.mockReturnValue(true);
        installPlugin({url: 'https://example.com?_storyblok_c=1'});

        const result = await getDecorator().fetchContent('slot-id');

        expect(mocks.isPreviewUrl).toHaveBeenCalledWith('https://example.com?_storyblok_c=1');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should skip fetching when the browser URL is a preview URL on the client side', async () => {
        const mockFetch = jest.fn();

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(false);
        mocks.isPreviewUrl.mockReturnValue(true);
        installPlugin();

        const result = await getDecorator().fetchContent('slot-id');

        expect(mocks.isPreviewUrl).toHaveBeenCalledWith(window.location.href);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should fetch normally when no SSR context URL is available', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            content: {},
            metadata: {contentSource: 'experience'},
        });

        setGlobalFetch(mockFetch);
        mocks.isSsr.mockReturnValue(true);
        mocks.isPreviewUrl.mockReturnValue(false);
        installPlugin();

        await getDecorator().fetchContent('slot-id');

        expect(mocks.isPreviewUrl).not.toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalled();
    });
});
