import type {JsonObject} from '@croct/json';
import {parseRichText} from '@/utils/richText';

describe('parseRichText', () => {
    type Scenario = {
        description: string,
        markdown: string,
        content: JsonObject[],
    };

    function link(href: string, linktype = 'url'): JsonObject {
        return {
            type: 'link',
            attrs: {
                href: href,
                uuid: null,
                anchor: null,
                target: null,
                linktype: linktype,
            },
        };
    }

    it.each<Scenario>([
        {
            description: 'an empty document',
            markdown: '',
            content: [],
        },
        {
            description: 'paragraphs',
            markdown: 'First paragraph\n\nSecond paragraph',
            content: [
                {
                    type: 'paragraph',
                    content: [{type: 'text', text: 'First paragraph'}],
                },
                {
                    type: 'paragraph',
                    content: [{type: 'text', text: 'Second paragraph'}],
                },
            ],
        },
        {
            description: 'inline marks',
            markdown: '**bold** *italic* ~~strike~~ `code` ***both***',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'bold', marks: [{type: 'bold'}]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'italic', marks: [{type: 'italic'}]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'strike', marks: [{type: 'strike'}]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'code', marks: [{type: 'code'}]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'both', marks: [{type: 'italic'}, {type: 'bold'}]},
                    ],
                },
            ],
        },
        {
            description: 'links',
            markdown: '[url](https://example.com) [story](/blog/post#intro) [email](mailto:jane@example.com)',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'url', marks: [link('https://example.com')]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'story', marks: [link('/blog/post#intro')]},
                        {type: 'text', text: ' '},
                        {type: 'text', text: 'email', marks: [link('jane@example.com', 'email')]},
                    ],
                },
            ],
        },
        {
            description: 'marks inside a link',
            markdown: '[**bold** link](https://example.com)',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'bold', marks: [link('https://example.com'), {type: 'bold'}]},
                        {type: 'text', text: ' link', marks: [link('https://example.com')]},
                    ],
                },
            ],
        },
        {
            description: 'escaped characters as plain text',
            markdown: '\\*not bold\\* \\[not a link\\] \\<b> \\&amp; 1\\. end\\!',
            content: [
                {
                    type: 'paragraph',
                    content: [{type: 'text', text: '*not bold* [not a link] <b> &amp; 1. end!'}],
                },
            ],
        },
        {
            description: 'raw HTML and bare URLs as plain text',
            markdown: 'A <b>tag</b> and www.example.com',
            content: [
                {
                    type: 'paragraph',
                    content: [{type: 'text', text: 'A <b>tag</b> and www.example.com'}],
                },
            ],
        },
        {
            description: 'hard breaks',
            markdown: 'First line\\\nSecond line',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'First line'},
                        {type: 'hard_break'},
                        {type: 'text', text: 'Second line'},
                    ],
                },
            ],
        },
        {
            description: 'soft line breaks as hard breaks',
            markdown: 'First line\nSecond line',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'First line'},
                        {type: 'hard_break'},
                        {type: 'text', text: 'Second line'},
                    ],
                },
            ],
        },
        {
            description: 'headings',
            markdown: '# Title\n\n### Section with **bold** \\#',
            content: [
                {
                    type: 'heading',
                    attrs: {level: 1},
                    content: [{type: 'text', text: 'Title'}],
                },
                {
                    type: 'heading',
                    attrs: {level: 3},
                    content: [
                        {type: 'text', text: 'Section with '},
                        {type: 'text', text: 'bold', marks: [{type: 'bold'}]},
                        {type: 'text', text: ' #'},
                    ],
                },
            ],
        },
        {
            description: 'a blockquote',
            markdown: '> Quoted\n>\n> - item',
            content: [
                {
                    type: 'blockquote',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{type: 'text', text: 'Quoted'}],
                        },
                        {
                            type: 'bullet_list',
                            content: [
                                {
                                    type: 'list_item',
                                    content: [{type: 'paragraph', content: [{type: 'text', text: 'item'}]}],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            description: 'a nested bullet list',
            markdown: '- a\n  - b',
            content: [
                {
                    type: 'bullet_list',
                    content: [
                        {
                            type: 'list_item',
                            content: [
                                {type: 'paragraph', content: [{type: 'text', text: 'a'}]},
                                {
                                    type: 'bullet_list',
                                    content: [
                                        {
                                            type: 'list_item',
                                            content: [{type: 'paragraph', content: [{type: 'text', text: 'b'}]}],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            description: 'an ordered list with a start number',
            markdown: '3. a\n4. b',
            content: [
                {
                    type: 'ordered_list',
                    attrs: {order: 3},
                    content: [
                        {
                            type: 'list_item',
                            content: [{type: 'paragraph', content: [{type: 'text', text: 'a'}]}],
                        },
                        {
                            type: 'list_item',
                            content: [{type: 'paragraph', content: [{type: 'text', text: 'b'}]}],
                        },
                    ],
                },
            ],
        },
        {
            description: 'a loose list item with several paragraphs',
            markdown: '- first\n\n  second',
            content: [
                {
                    type: 'bullet_list',
                    content: [
                        {
                            type: 'list_item',
                            content: [
                                {type: 'paragraph', content: [{type: 'text', text: 'first'}]},
                                {type: 'paragraph', content: [{type: 'text', text: 'second'}]},
                            ],
                        },
                    ],
                },
            ],
        },
        {
            description: 'code blocks',
            markdown: '```ts\nconst a = `<b>`;\n```\n\n```\n```',
            content: [
                {
                    type: 'code_block',
                    attrs: {class: 'language-ts'},
                    content: [{type: 'text', text: 'const a = `<b>`;'}],
                },
                {
                    type: 'code_block',
                    attrs: {class: null},
                    content: [],
                },
            ],
        },
        {
            description: 'a horizontal rule',
            markdown: 'Above\n\n---\n\nBelow',
            content: [
                {type: 'paragraph', content: [{type: 'text', text: 'Above'}]},
                {type: 'horizontal_rule'},
                {type: 'paragraph', content: [{type: 'text', text: 'Below'}]},
            ],
        },
        {
            description: 'an image',
            markdown: '![An \\*alt\\*](<https://example.com/a b.png> "Title") caption',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'image',
                            attrs: {
                                id: null,
                                src: 'https://example.com/a b.png',
                                alt: 'An *alt*',
                                title: 'Title',
                                source: null,
                                copyright: null,
                                meta_data: {},
                            },
                        },
                        {type: 'text', text: ' caption'},
                    ],
                },
            ],
        },
        {
            description: 'a line break before formatted text',
            markdown: 'First line\n**Second line**',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: 'First line'},
                        {type: 'hard_break'},
                        {type: 'text', text: 'Second line', marks: [{type: 'bold'}]},
                    ],
                },
            ],
        },
        {
            description: 'a task list as a bullet list',
            markdown: '- [x] Done',
            content: [
                {
                    type: 'bullet_list',
                    content: [
                        {
                            type: 'list_item',
                            content: [{type: 'paragraph', content: [{type: 'text', text: 'Done'}]}],
                        },
                    ],
                },
            ],
        },
        {
            description: 'an indented code block',
            markdown: '    const a = 1;',
            content: [
                {
                    type: 'code_block',
                    attrs: {class: null},
                    content: [{type: 'text', text: 'const a = 1;'}],
                },
            ],
        },
        {
            description: 'an image without a title and with formatting in its description',
            markdown: '![An *alt*\\\ntext](https://example.com/image.png)',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'image',
                            attrs: {
                                id: null,
                                src: 'https://example.com/image.png',
                                alt: 'An alt text',
                                title: null,
                                source: null,
                                copyright: null,
                                meta_data: {},
                            },
                        },
                    ],
                },
            ],
        },
        {
            description: 'table syntax as plain text',
            markdown: '| a | b |\n| - | - |',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {type: 'text', text: '| a | b |'},
                        {type: 'hard_break'},
                        {type: 'text', text: '| - | - |'},
                    ],
                },
            ],
        },
    ])('should convert $description', ({markdown, content}) => {
        expect(parseRichText(markdown)).toEqual({
            type: 'doc',
            content: content,
        });
    });
});
