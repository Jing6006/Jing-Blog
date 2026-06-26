import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Java',
      items: ['java/jvm', 'java/concurrency'],
    },
    {
      type: 'category',
      label: 'Spring',
      items: ['spring/spring-boot', 'spring/spring-cloud'],
    },
    {
      type: 'category',
      label: '数据库',
      items: ['database/mysql', 'database/redis'],
    },
    {
      type: 'category',
      label: '工程实践',
      items: ['engineering/code-review', 'engineering/deployment'],
    },
  ],
};

export default sidebars;
