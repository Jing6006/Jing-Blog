import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './projects.module.css';

const projects = [
  {
    name: '技术博客',
    status: '建设中',
    description: '基于 Docusaurus 的个人技术分享站，承载文章、专栏和项目复盘。',
  },
  {
    name: 'Java 学习体系',
    status: '规划中',
    description: '整理 Java 基础、JVM、并发、Spring 和数据库方向的系统笔记。',
  },
  {
    name: '部署自动化',
    status: '规划中',
    description: '把构建、上传、发布和回滚流程脚本化，降低维护成本。',
  },
];

export default function Projects(): ReactNode {
  return (
    <Layout title="项目" description="项目记录和技术实践。">
      <main className={styles.page}>
        <section className={styles.header}>
          <Heading as="h1">项目</Heading>
          <p>记录做过的项目、正在沉淀的工具，以及值得复盘的工程实践。</p>
        </section>
        <section className={styles.grid}>
          {projects.map((project) => (
            <article className={styles.card} key={project.name}>
              <div>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
              </div>
              <span>{project.status}</span>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
