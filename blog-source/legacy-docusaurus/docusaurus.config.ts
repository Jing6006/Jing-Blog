import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: "Jing's Dev Notes",
  tagline: '软件开发工程师的技术分享、项目复盘与工程实践',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'http://39.105.9.115',
  baseUrl: '/',

  organizationName: 'jing',
  projectName: 'dev-notes',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
          blogTitle: '技术文章',
          blogDescription: '围绕 Java、后端工程、数据库和项目实践的持续记录。',
          postsPerPage: 8,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            copyright: `Copyright ${new Date().getFullYear()} Jing.`,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Jing's Dev Notes",
      logo: {
        alt: 'Jing Dev Notes Logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/docs/intro', label: '技术专栏', position: 'left'},
        {to: '/blog', label: '文章', position: 'left'},
        {to: '/projects', label: '项目', position: 'left'},
        {to: '/about', label: '关于', position: 'left'},
        {
          href: 'https://github.com/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '内容',
          items: [
            {label: '技术专栏', to: '/docs/intro'},
            {label: '文章归档', to: '/blog'},
            {label: '项目记录', to: '/projects'},
          ],
        },
        {
          title: '方向',
          items: [
            {label: 'Java', to: '/docs/java/jvm'},
            {label: 'Spring', to: '/docs/spring/spring-boot'},
            {label: '数据库', to: '/docs/database/mysql'},
          ],
        },
        {
          title: '更多',
          items: [
            {label: '关于我', to: '/about'},
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Jing. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'bash', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
