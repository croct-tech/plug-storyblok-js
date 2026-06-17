import type {ContentDefinitionBundle} from '@croct/content-model/definition';
import type {JsonObject} from '@croct/json';
import type {ContentFetcher} from '@/utils/content';
import {createStoryblokContent, resolveContent} from '@/utils/content';

const RANDOM_UUID = '00000000-0000-0000-0000-000000000000';

describe('createStoryblokContent', () => {
    type SupportedScenario = {
        description: string,
        content: JsonObject & {_component?: string},
        schemas: ContentDefinitionBundle,
        expected: JsonObject,
    };

    beforeEach(() => {
        jest.spyOn(crypto, 'randomUUID').mockReturnValue(RANDOM_UUID);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each<SupportedScenario>([
        {
            description: 'a structure with different attribute types',
            content: {
                _component: 'page',
                link_attribute: 'http://example.com',
                text_attribute: 'Lorem ipsum',
                number_attribute: 9,
                boolean_attribute: false,
                markdown_attribute: 'Lorem *ipsum*',
                date_time_attribute: '2026-01-01 01:02',
                text_area_attribute: 'Lorem ipsum',
                multi_assets_attribute: [
                    'https://example.com/asset-1.png',
                    'https://example.com/asset-2.png',
                ],
                asset_attribute: 'https://www.example.com/image.png',
                multi_option_attribute: ['a', 'b'],
                single_option_attribute: 'b',
            },
            schemas: {
                root: {
                    type: 'structure',
                    title: 'Block with all types',
                    attributes: {
                        link_attribute: {
                            type: {
                                type: 'text',
                                format: 'url',
                            },
                        },
                        text_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        number_attribute: {
                            type: {
                                type: 'number',
                            },
                        },
                        boolean_attribute: {
                            type: {
                                type: 'boolean',
                            },
                        },
                        markdown_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        date_time_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        text_area_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        multi_assets_attribute: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'reference',
                                    id: '@croct/file',
                                },
                            },
                        },
                        asset_attribute: {
                            type: {
                                type: 'reference',
                                id: '@croct/file',
                            },
                        },
                        multi_option_attribute: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                    choices: {
                                        '1': {
                                            label: 'a',
                                            position: 0,
                                        },
                                        '2': {
                                            label: 'b',
                                            position: 1,
                                        },
                                        '3': {
                                            label: 'c',
                                            position: 2,
                                        },
                                    },
                                },
                            },
                        },
                        single_option_attribute: {
                            type: {
                                type: 'text',
                                choices: {
                                    '1': {
                                        label: 'a',
                                        position: 0,
                                    },
                                    '2': {
                                        label: 'b',
                                        position: 1,
                                    },
                                    '3': {
                                        label: 'c',
                                        position: 2,
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'page',
                link_attribute: {
                    id: '',
                    url: 'http://example.com',
                    linktype: 'url',
                    fieldtype: 'multilink',
                    cached_url: 'http://example.com',
                },
                text_attribute: 'Lorem ipsum',
                asset_attribute: {
                    id: null,
                    alt: null,
                    name: '',
                    focus: '',
                    title: null,
                    filename: 'https://www.example.com/image.png',
                    copyright: null,
                    fieldtype: 'asset',
                    meta_data: {},
                    is_external_url: true,
                },
                number_attribute: '9',
                boolean_attribute: false,
                markdown_attribute: 'Lorem *ipsum*',
                date_time_attribute: '2026-01-01 01:02',
                text_area_attribute: 'Lorem ipsum',
                multi_assets_attribute: [
                    {
                        id: null,
                        alt: null,
                        name: '',
                        focus: '',
                        title: null,
                        filename: 'https://example.com/asset-1.png',
                        copyright: null,
                        fieldtype: 'asset',
                        meta_data: {},
                        is_external_url: true,
                    },
                    {
                        id: null,
                        alt: null,
                        name: '',
                        focus: '',
                        title: null,
                        filename: 'https://example.com/asset-2.png',
                        copyright: null,
                        fieldtype: 'asset',
                        meta_data: {},
                        is_external_url: true,
                    },
                ],
                multi_option_attribute: [
                    'a',
                    'b',
                ],
                single_option_attribute: 'b',
            },
        },
        {
            description: 'a structure with list of text items',
            content: {
                _component: 'tags',
                items: ['javascript', 'typescript', 'react'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'tags',
                items: ['javascript', 'typescript', 'react'],
            },
        },
        {
            description: 'a structure with list of nested structures',
            content: {
                _component: 'cardList',
                cards: [
                    {
                        _component: 'card',
                        title: 'Card 1',
                    },
                    {
                        _component: 'card',
                        title: 'Card 2',
                    },
                ],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        cards: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'structure',
                                    attributes: {
                                        title: {
                                            type: {
                                                type: 'text',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'cardList',
                cards: [
                    {
                        _uid: RANDOM_UUID,
                        component: 'card',
                        title: 'Card 1',
                    },
                    {
                        _uid: RANDOM_UUID,
                        component: 'card',
                        title: 'Card 2',
                    },
                ],
            },
        },
        {
            description: 'a structure with nested structure attribute',
            content: {
                _component: 'article',
                header: {
                    _component: 'header',
                    title: 'Article Title',
                    columns: 2,
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {
                                    title: {
                                        type: {
                                            type: 'text',
                                        },
                                    },
                                    columns: {
                                        type: {
                                            type: 'number',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'article',
                header: {
                    _uid: RANDOM_UUID,
                    component: 'header',
                    title: 'Article Title',
                    columns: '2',
                },
            },
        },
        {
            description: 'a structure with union attribute',
            content: {
                _component: 'section',
                media: {
                    _type: 'image',
                    src: 'https://example.com/photo.jpg',
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        media: {
                            type: {
                                type: 'union',
                                types: {
                                    image: {
                                        type: 'structure',
                                        attributes: {
                                            src: {
                                                type: {
                                                    type: 'text',
                                                },
                                            },
                                        },
                                    },
                                    video: {
                                        type: 'structure',
                                        attributes: {
                                            url: {
                                                type: {
                                                    type: 'text',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'section',
                media: {
                    _uid: RANDOM_UUID,
                    component: 'image',
                    src: 'https://example.com/photo.jpg',
                },
            },
        },
        {
            description: 'a structure with reference to definition',
            content: {
                _component: 'page',
                button: {
                    label: 'Submit',
                    url: 'https://example.com/submit',
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        button: {
                            type: {
                                type: 'reference',
                                id: 'button-component',
                            },
                        },
                    },
                },
                definitions: {
                    'button-component': {
                        type: 'structure',
                        attributes: {
                            label: {
                                type: {
                                    type: 'text',
                                },
                            },
                            url: {
                                type: {
                                    type: 'text',
                                    format: 'url',
                                },
                            },
                        },
                    },
                },
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'page',
                button: {
                    _uid: RANDOM_UUID,
                    component: 'button-component',
                    label: 'Submit',
                    url: {
                        id: '',
                        linktype: 'url',
                        fieldtype: 'multilink',
                        url: 'https://example.com/submit',
                        cached_url: 'https://example.com/submit',
                    },
                },
            },
        },
    ])('should create a Storyblok content for $description', scenario => {
        const result = createStoryblokContent(scenario.content, scenario.schemas);

        expect(result).toEqual(scenario.expected);
    });

    type UnsupportedScenario = {
        description: string,
        content: JsonObject,
        schemas: ContentDefinitionBundle | undefined,
    };

    it.each<UnsupportedScenario>([
        {
            description: 'no schemas are provided',
            content: {
                _component: 'page',
                title: 'Hello',
            },
            schemas: undefined,
        },
        {
            description: '_component is not a string',
            content: {
                _component: 123,
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'text',
                },
                definitions: {},
            },
        },
        {
            description: '_component is missing',
            content: {
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'text',
                },
                definitions: {},
            },
        },
        {
            description: '_component is empty string',
            content: {
                _component: '',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: '_component is whitespace only',
            content: {
                _component: '   ',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: '_component results in empty name after stripping version',
            content: {
                _component: '@1.0.0',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
    ])('should return undefined when $description', ({content, schemas}) => {
        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when content has attribute not in schema definition', () => {
        const content = {
            _component: 'page',
            title: 'Hello',
            unknownAttribute: 'value',
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    title: {
                        type: {
                            type: 'text',
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when union member type is not in definition', () => {
        const content = {
            _component: 'section',
            media: {
                _type: 'audio',
                src: 'https://example.com/sound.mp3',
            },
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    media: {
                        type: {
                            type: 'union',
                            types: {
                            },
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when list item cannot be resolved', () => {
        const content = {
            _component: 'cardList',
            cards: [
                {
                    title: 'Valid Card',
                },
                {
                    title: 'Invalid Card',
                },
            ],
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    cards: {
                        type: {
                            type: 'list',
                            items: {
                                type: 'reference',
                                id: 'missing-definition',
                            },
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when nested attribute content cannot be resolved', () => {
        const content = {
            _component: 'page',
            header: {
                title: 'Title',
            },
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    header: {
                        type: {
                            type: 'reference',
                            id: 'missing-definition',
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    type TypeMismatchScenario = {
        description: string,
        content: JsonObject,
        schemas: ContentDefinitionBundle,
    };

    it.each<TypeMismatchScenario>([
        {
            description: 'number content when definition expects text',
            content: {
                _component: 'page',
                title: 42,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'number content when definition expects boolean',
            content: {
                _component: 'page',
                flag: 1,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'boolean content when definition expects text',
            content: {
                _component: 'page',
                title: true,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'boolean content when definition expects number',
            content: {
                _component: 'page',
                count: false,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects number',
            content: {
                _component: 'page',
                count: 'not a number',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects boolean',
            content: {
                _component: 'page',
                flag: 'true',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects list',
            content: {
                _component: 'page',
                items: 'not an array',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects structure',
            content: {
                _component: 'page',
                header: 'not an object',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects text',
            content: {
                _component: 'page',
                title: ['a', 'b'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects number',
            content: {
                _component: 'page',
                count: [1, 2, 3],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects structure',
            content: {
                _component: 'page',
                header: ['a', 'b'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects text',
            content: {
                _component: 'page',
                title: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects number',
            content: {
                _component: 'page',
                count: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects boolean',
            content: {
                _component: 'page',
                flag: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects list',
            content: {
                _component: 'page',
                items: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects text',
            content: {
                _component: 'page',
                title: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects number',
            content: {
                _component: 'page',
                count: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects boolean',
            content: {
                _component: 'page',
                flag: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects list',
            content: {
                _component: 'page',
                items: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects structure',
            content: {
                _component: 'page',
                header: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
    ])('should return undefined when $description', ({content, schemas}) => {
        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });
});

describe('resolveContent', () => {
    beforeEach(() => {
        jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(RANDOM_UUID);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        {
            description: 'a string',
            content: 'hello',
        },
        {
            description: 'a number',
            content: 42,
        },
        {
            description: 'a boolean',
            content: true,
        },
        {
            description: 'null',
            content: null,
        },
    ])('should return $description as-is', async ({content}) => {
        const fetcher: ContentFetcher = jest.fn();

        await expect(resolveContent(content, fetcher)).resolves.toBe(content);

        expect(fetcher).not.toHaveBeenCalled();
    });

    type InvalidCroctPropertyScenario = {
        description: string,
        content: JsonObject,
    };

    it.each<InvalidCroctPropertyScenario>([
        {
            description: 'croct property is empty string',
            content: {
                croct: '',
                other: 'value',
            },
        },
        {
            description: 'croct property is whitespace only',
            content: {
                croct: '   ',
                other: 'value',
            },
        },
        {
            description: 'croct property is not a string',
            content: {
                croct: 123,
                other: 'value',
            },
        },
    ])('should not fetch when $description', async ({content}) => {
        const fetcher: ContentFetcher = jest.fn();

        await expect(resolveContent(content, fetcher)).resolves.toEqual(content);

        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch content when slot property is a non-empty string', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'hero',
                title: 'Fetched Title',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            title: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {croct: 'slot-id'};

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'hero',
            title: 'Fetched Title',
        });

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should resolve slot references at any depth', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'widget',
                data: 'fetched',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            data: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {
            level1: {
                level2: {
                    level3: {
                        croct: 'deep-slot',
                    },
                },
            },
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            level1: {
                level2: {
                    level3: {
                        _uid: RANDOM_UUID,
                        component: 'widget',
                        data: 'fetched',
                    },
                },
            },
        });

        expect(fetcher).toHaveBeenCalledWith('deep-slot');
    });

    it('should resolve nested slot references in arrays', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {_component: 'card', title: 'Fetched'},
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            title: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = [
            {croct: 'slot-1'},
            {croct: 'slot-2'},
        ];

        await expect(resolveContent(content, fetcher)).resolves.toEqual([
            {
                _uid: RANDOM_UUID,
                component: 'card',
                title: 'Fetched',
            },
            {
                _uid: RANDOM_UUID,
                component: 'card',
                title: 'Fetched',
            },
        ]);

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenCalledWith('slot-1');
        expect(fetcher).toHaveBeenCalledWith('slot-2');
    });

    it('should convert the content to Storyblok format when fetching succeeds', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'banner',
                message: 'Welcome!',
                url: 'https://example.com/welcome',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            message: {
                                type: {
                                    type: 'text',
                                },
                            },
                            url: {
                                type: {
                                    type: 'text',
                                    format: 'url',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {croct: 'slot-id'};

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'banner',
            message: 'Welcome!',
            url: {
                id: '',
                linktype: 'url',
                fieldtype: 'multilink',
                url: 'https://example.com/welcome',
                cached_url: 'https://example.com/welcome',
            },
        });

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should only resolve the outermost slot reference', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'outer@1',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {},
                    },
                    definitions: {},
                },
            },
        });

        const content = {
            croct: 'outer-slot',
            nested: {
                croct: 'inner-slot',
            },
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'outer',
        });

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenCalledWith('outer-slot');
    });

    it('should remove croct property and return fallback properties when fetching fails', async () => {
        const fetcher: ContentFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should remove croct property and return fallback properties when content creation fails', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'widget',
                data: 'fetched',
            },
            metadata: {
                schema: undefined,
            },
        });

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should remove croct property and return fallback properties when fetcher returns undefined', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue(undefined);

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });
});
