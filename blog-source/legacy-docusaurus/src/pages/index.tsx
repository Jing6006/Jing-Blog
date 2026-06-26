import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const focusAreas = [
  {
    title: '后端工程',
    description: 'Java、Spring、接口设计、服务治理与线上问题复盘。',
  },
  {
    title: '数据与中间件',
    description: 'MySQL、Redis、消息队列和常见性能问题的拆解记录。',
  },
  {
    title: '成长复盘',
    description: '项目经验、排障过程、代码质量和工程效率方法论。',
  },
];

const recentTopics = [
  'JVM 调优与线上排查',
  'Spring Boot 项目结构',
  'MySQL 索引与事务',
  'Redis 缓存一致性',
  '接口设计与代码评审',
  '服务器部署与自动化发布',
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="软件开发工程师技术博客"
      description="Java、Spring、数据库和工程实践技术分享。">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Software Engineering Notes</p>
            <Heading as="h1" className={styles.title}>
              把踩过的坑、做过的项目和想清楚的问题写下来
            </Heading>
            <p className={styles.subtitle}>
              这里会持续整理 Java 后端、数据库、中间件、部署运维和项目复盘，
              目标是把零散经验沉淀成可复用的技术资产。
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/blog">
                阅读文章
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/intro">
                查看专栏
              </Link>
            </div>
          </div>
          <div className={styles.signalPanel} aria-label="技术方向">
            <span>Java</span>
            <span>Spring Boot</span>
            <span>MySQL</span>
            <span>Redis</span>
            <span>Linux</span>
            <span>DevOps</span>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Heading as="h2">内容方向</Heading>
            <p>先从工程师日常最有复用价值的主题开始沉淀。</p>
          </div>
          <div className={styles.focusGrid}>
            {focusAreas.map((item) => (
              <article className={styles.focusItem} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Heading as="h2">近期选题</Heading>
            <p>这些主题适合写成系列文章，也适合整理成面试和项目复盘素材。</p>
          </div>
          <div className={styles.topicList}>
            {recentTopics.map((topic) => (
              <span key={topic}>{topic}</span>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
