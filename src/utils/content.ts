import type {JsonObject, JsonValue} from '@croct/json';
import type {ContentDefinition, ContentDefinitionBundle} from '@croct/content-model/definition';
import type {FetchResponse} from '@croct/plug';
import type {DynamicSlotId} from '@croct/plug/slot';

/**
 * @internal
 */
export type ContentFetcher = (id: string) => Promise<FetchResponse<DynamicSlotId> | undefined>;

/**
 * @internal
 */
export async function resolveContent(content: unknown, fetcher: ContentFetcher): Promise<unknown> {
    if (isObject(content)) {
        if (typeof content.croct === 'string' && content.croct.trim() !== '') {
            const {croct: slotId, ...rest} = content;

            return await fetcher(content.croct).then(
                response => {
                    if (response === undefined) {
                        return rest;
                    }

                    return createStoryblokContent(response.content, response.metadata?.schema) ?? rest;
                },
            ).catch(() => rest);
        }

        return Object.fromEntries(
            await Promise.all(
                Object.entries(content).map(
                    async ([key, value]) => [
                        key,
                        value === undefined ? value : await resolveContent(value, fetcher),
                    ],
                ),
            ),
        );
    }

    if (Array.isArray(content)) {
        return Promise.all(content.map(item => resolveContent(item, fetcher)));
    }

    return content;
}

/**
 * @internal
 */
export function createStoryblokContent(
    content: JsonObject,
    schemas: ContentDefinitionBundle | undefined,
): JsonObject | undefined {
    if (schemas === undefined) {
        return undefined;
    }

    return convertContent(content, schemas, schemas.root) as JsonObject | undefined;
}

function convertContent(
    content: JsonValue,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
): JsonValue | undefined {
    if (typeof content === 'number') {
        return convertNumber(content, definition);
    }

    if (typeof content === 'boolean') {
        return convertBoolean(content, definition);
    }

    if (typeof content === 'string') {
        return convertString(content, definition);
    }

    if (Array.isArray(content)) {
        return convertArray(content, schemas, definition);
    }

    if (isObject(content)) {
        return convertObject(content, schemas, definition);
    }

    return undefined;
}

function convertNumber(content: number, definition: ContentDefinition): string | undefined {
    if (definition.type === 'number') {
        return content.toString();
    }

    return undefined;
}

function convertBoolean(content: boolean, definition: ContentDefinition): boolean | undefined {
    if (definition.type === 'boolean') {
        return content;
    }

    return undefined;
}

function convertString(content: string, definition: ContentDefinition): JsonValue | undefined {
    if (definition.type === 'reference' && definition.id === '@croct/file') {
        return {
            id: null,
            alt: null,
            name: '',
            focus: '',
            title: null,
            filename: content,
            copyright: null,
            fieldtype: 'asset',
            meta_data: {},
            is_external_url: true,
        };
    }

    if (definition.type === 'text') {
        if (definition.format === 'url') {
            return {
                id: '',
                linktype: 'url',
                fieldtype: 'multilink',
                url: content,
                cached_url: content,
            };
        }

        return content;
    }

    return undefined;
}

function convertArray(
    content: JsonValue[],
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
): JsonValue[] | undefined {
    if (definition.type !== 'list') {
        return undefined;
    }

    const elements: JsonValue[] = [];

    for (const item of content) {
        const itemContent = convertContent(item, schemas, definition.items);

        if (itemContent === undefined) {
            return undefined;
        }

        elements.push(itemContent);
    }

    return elements;
}

function convertObject(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
): JsonValue | undefined {
    switch (definition.type) {
        case 'structure':
            return convertStructure(content, schemas, definition);

        case 'union':
            return convertUnion(content, schemas, definition);

        case 'reference':
            return convertReference(content, schemas, definition);

        default:
            return undefined;
    }
}

function convertStructure(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'structure'>,
): JsonObject | undefined {
    const componentName = typeof content._component === 'string' && content._component.trim() !== ''
        ? getComponentName(content._component)
        : null;

    if (componentName === null) {
        // Storyblok requires every structure to have an associated component. For root,
        // reference, and union types, the _component property is injected during conversion.
        // However, nested structures have no associated component, so a missing component
        // here indicates a schema mismatch. This should never occur in practice since
        // Storyblok doesn't support nested structures without components.
        return undefined;
    }

    const entries: JsonObject = {};

    for (const [key, value] of Object.entries(content)) {
        if (key === '_component' || key === '_type' || value === undefined) {
            continue;
        }

        if (definition.attributes[key] === undefined) {
            return undefined;
        }

        const attributeContent = convertContent(value, schemas, definition.attributes[key].type);

        if (attributeContent === undefined) {
            return undefined;
        }

        entries[key] = attributeContent;
    }

    return {
        _uid: generateUid(),
        component: componentName,
        ...entries,
    };
}

function convertUnion(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'union'>,
): JsonValue | undefined {
    const memberDefinition = definition.types[content._type as string];

    if (memberDefinition === undefined) {
        return undefined;
    }

    return convertContent({...content, _component: content._type}, schemas, memberDefinition);
}

function convertReference(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'reference'>,
): JsonValue | undefined {
    const referenceDefinition = schemas.definitions[definition.id];

    if (referenceDefinition === undefined) {
        return undefined;
    }

    return convertContent({...content, _component: definition.id}, schemas, referenceDefinition);
}

function getComponentName(id: string): string | null {
    const name = id.replace(/@.*$/, '');

    if (name.trim() === '') {
        return null;
    }

    return name;
}

function generateUid(): string {
    return crypto.randomUUID();
}

function isObject<T>(value: T): value is T & Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
